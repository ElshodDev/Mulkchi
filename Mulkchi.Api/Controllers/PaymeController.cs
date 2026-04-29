using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Mulkchi.Api.Application.Payments.Webhooks;
using Mulkchi.Api.Models.Foundations.Payments;
using Mulkchi.Api.Services.Foundations.Payments;

namespace Mulkchi.Api.Controllers;

/// <summary>
/// Payme (Paycom) merchant API — JSON-RPC 2.0 webhook handler.
/// Docs: https://developer.payme.uz/documentation
/// </summary>
[ApiController]
[Route("api/payme")]
public class PaymeController : ControllerBase
{
    // ── Payme error codes ──────────────────────────────────────────────────────
    private const int ErrInvalidAmount        = -31001;
    private const int ErrTransactionNotFound  = -31003;
    private const int ErrTransactionDone      = -31060;
    private const int ErrTransactionCancelled = -31061;
    private const int ErrCantCancelTransaction= -31062;
    private const int ErrOrderNotFound        = -31050;
    private const int ErrInternalError        = -32400;

    private readonly IPaymentService paymentService;
    private readonly IConfiguration configuration;
    private readonly IFinalizePaymentWebhookHandler finalizePaymentWebhookHandler;

    public PaymeController(
        IPaymentService paymentService,
        IConfiguration configuration,
        IFinalizePaymentWebhookHandler finalizePaymentWebhookHandler)
    {
        this.paymentService = paymentService;
        this.configuration = configuration;
        this.finalizePaymentWebhookHandler = finalizePaymentWebhookHandler;
    }

    [HttpPost]
    public async Task<IActionResult> HandleAsync([FromBody] PaymeRequest request)
    {
        if (!IsAuthorized())
            return Unauthorized(new { error = new { code = -32504, message = "Insufficient privilege to perform this method." } });

        return request.Method switch
        {
            "CheckPerformTransaction"  => Ok(await CheckPerformTransactionAsync(request)),
            "CreateTransaction"        => Ok(await CreateTransactionAsync(request)),
            "PerformTransaction"       => Ok(await PerformTransactionAsync(request)),
            "CancelTransaction"        => Ok(await CancelTransactionAsync(request)),
            "CheckTransaction"         => Ok(await CheckTransactionAsync(request)),
            "GetStatement"             => Ok(await GetStatementAsync(request)),
            _ => Ok(Error(request.Id, -32601, "Method not found."))
        };
    }

    // ── Method handlers ────────────────────────────────────────────────────────

    private async Task<PaymeResponse> CheckPerformTransactionAsync(PaymeRequest request)
    {
        var orderId = request.Params?.GetValueOrDefault("order_id")?.ToString();
        var amount  = GetAmount(request.Params);

        if (string.IsNullOrWhiteSpace(orderId) || !Guid.TryParse(orderId, out var paymentId))
            return Error(request.Id, ErrOrderNotFound, "Order not found.");

        Payment payment = await this.paymentService.RetrievePaymentByIdAsync(paymentId);
        if (payment is null)
            return Error(request.Id, ErrOrderNotFound, "Order not found.");

        // Amount is in tiyin (1/100 of UZS), so 1 UZS = 100 tiyin
        if (amount != (long)Math.Round(payment.Amount * 100, MidpointRounding.AwayFromZero))
            return Error(request.Id, ErrInvalidAmount, "Invalid amount.");

        return Success(request.Id, new { allow = true });
    }

    private async Task<PaymeResponse> CreateTransactionAsync(PaymeRequest request)
    {
        var transactionId = request.Params?.GetValueOrDefault("id")?.ToString();
        var orderId       = request.Params?.GetValueOrDefault("order_id")?.ToString();
        var amount        = GetAmount(request.Params);
        var createTime    = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        if (string.IsNullOrWhiteSpace(orderId) || !Guid.TryParse(orderId, out var paymentId))
            return Error(request.Id, ErrOrderNotFound, "Order not found.");

        Payment payment = await this.paymentService.RetrievePaymentByIdAsync(paymentId);
        if (payment is null)
            return Error(request.Id, ErrOrderNotFound, "Order not found.");

        if (amount != (long)Math.Round(payment.Amount * 100, MidpointRounding.AwayFromZero))
            return Error(request.Id, ErrInvalidAmount, "Invalid amount.");

        // If already linked to this transaction — return existing info
        if (payment.ExternalTransactionId == transactionId)
        {
            return Success(request.Id, new
            {
                create_time  = payment.CreatedDate.ToUnixTimeMilliseconds(),
                transaction  = payment.Id.ToString(),
                state        = PaymeTransactionState(payment.Status)
            });
        }

        // Can't create if already processed
        if (payment.Status == PaymentStatus.Completed || payment.Status == PaymentStatus.Cancelled)
            return Error(request.Id, ErrTransactionDone, "Transaction already done.");

        // Record the Payme transaction reference
        payment.ExternalTransactionId = transactionId;
        payment.Status = PaymentStatus.Processing;
        payment.Method = PaymentMethod.Payme;
        payment.UpdatedDate = DateTimeOffset.UtcNow;
        await this.paymentService.ModifyPaymentAsync(payment);

        return Success(request.Id, new
        {
            create_time = createTime,
            transaction = payment.Id.ToString(),
            state       = 1  // created/in-progress
        });
    }

    private async Task<PaymeResponse> PerformTransactionAsync(PaymeRequest request)
    {
        var transactionId = request.Params?.GetValueOrDefault("id")?.ToString();
        if (string.IsNullOrWhiteSpace(transactionId))
            return Error(request.Id, ErrTransactionNotFound, "Transaction not found.");

        var payment = await FindByExternalIdAsync(transactionId);
        if (payment is null)
            return Error(request.Id, ErrTransactionNotFound, "Transaction not found.");

        if (payment.Status == PaymentStatus.Completed)
        {
            return Success(request.Id, new
            {
                perform_time = payment.UpdatedDate.ToUnixTimeMilliseconds(),
                transaction  = payment.Id.ToString(),
                state        = 2
            });
        }

        if (payment.Status == PaymentStatus.Cancelled)
            return Error(request.Id, ErrTransactionCancelled, "Transaction cancelled.");

        payment = await this.finalizePaymentWebhookHandler.HandleAsync(
            new FinalizePaymentWebhookCommand(
                transactionId,
                PaymentMethod.Payme,
                PaymentStatus.Completed));

        return Success(request.Id, new
        {
            perform_time = payment.UpdatedDate.ToUnixTimeMilliseconds(),
            transaction  = payment.Id.ToString(),
            state        = 2
        });
    }

    private async Task<PaymeResponse> CancelTransactionAsync(PaymeRequest request)
    {
        var transactionId = request.Params?.GetValueOrDefault("id")?.ToString();
        if (string.IsNullOrWhiteSpace(transactionId))
            return Error(request.Id, ErrTransactionNotFound, "Transaction not found.");

        var payment = await FindByExternalIdAsync(transactionId);
        if (payment is null)
            return Error(request.Id, ErrTransactionNotFound, "Transaction not found.");

        if (payment.Status == PaymentStatus.Completed)
            return Error(request.Id, ErrCantCancelTransaction, "Cannot cancel a completed transaction.");

        if (payment.Status == PaymentStatus.Cancelled)
        {
            return Success(request.Id, new
            {
                cancel_time = payment.UpdatedDate.ToUnixTimeMilliseconds(),
                transaction = payment.Id.ToString(),
                state       = -1
            });
        }

        payment = await this.finalizePaymentWebhookHandler.HandleAsync(
            new FinalizePaymentWebhookCommand(
                transactionId,
                PaymentMethod.Payme,
                PaymentStatus.Cancelled));

        return Success(request.Id, new
        {
            cancel_time = payment.UpdatedDate.ToUnixTimeMilliseconds(),
            transaction = payment.Id.ToString(),
            state       = -1
        });
    }

    private async Task<PaymeResponse> CheckTransactionAsync(PaymeRequest request)
    {
        var transactionId = request.Params?.GetValueOrDefault("id")?.ToString();
        if (string.IsNullOrWhiteSpace(transactionId))
            return Error(request.Id, ErrTransactionNotFound, "Transaction not found.");

        var payment = await FindByExternalIdAsync(transactionId);
        if (payment is null)
            return Error(request.Id, ErrTransactionNotFound, "Transaction not found.");

        return Success(request.Id, new
        {
            create_time  = payment.CreatedDate.ToUnixTimeMilliseconds(),
            perform_time = payment.Status == PaymentStatus.Completed ? payment.UpdatedDate.ToUnixTimeMilliseconds() : 0,
            cancel_time  = payment.Status == PaymentStatus.Cancelled ? payment.UpdatedDate.ToUnixTimeMilliseconds() : 0,
            transaction  = payment.Id.ToString(),
            state        = PaymeTransactionState(payment.Status),
            reason       = (int?)null
        });
    }

    private async Task<PaymeResponse> GetStatementAsync(PaymeRequest request)
    {
        var fromMs = Convert.ToInt64(request.Params?.GetValueOrDefault("from") ?? 0);
        var toMs   = Convert.ToInt64(request.Params?.GetValueOrDefault("to") ?? 0);

        var from = DateTimeOffset.FromUnixTimeMilliseconds(fromMs);
        var to   = DateTimeOffset.FromUnixTimeMilliseconds(toMs);

        var payments = this.paymentService.RetrieveAllPayments()
            .Where(p => p.Method == PaymentMethod.Payme &&
                        p.CreatedDate >= from && p.CreatedDate <= to);

        var list = await payments.ToListAsync();

        var transactions = list.Select(p => new
        {
            id           = p.ExternalTransactionId,
            time         = p.CreatedDate.ToUnixTimeMilliseconds(),
            amount       = (long)(p.Amount * 100),
            account      = new { order_id = p.Id.ToString() },
            create_time  = p.CreatedDate.ToUnixTimeMilliseconds(),
            perform_time = p.Status == PaymentStatus.Completed ? p.UpdatedDate.ToUnixTimeMilliseconds() : 0,
            cancel_time  = p.Status == PaymentStatus.Cancelled ? p.UpdatedDate.ToUnixTimeMilliseconds() : 0,
            transaction  = p.Id.ToString(),
            state        = PaymeTransactionState(p.Status),
            reason       = (int?)null
        });

        return Success(request.Id, new { transactions });
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private bool IsAuthorized()
    {
        var authHeader = Request.Headers["Authorization"].FirstOrDefault();
        if (authHeader is null || !authHeader.StartsWith("Basic ", StringComparison.OrdinalIgnoreCase))
            return false;

        var encoded = authHeader["Basic ".Length..].Trim();
        string decoded;
        try
        {
            decoded = Encoding.UTF8.GetString(Convert.FromBase64String(encoded));
        }
        catch
        {
            return false;
        }
        // Expected format: "Paycom:{merchantKey}"
        var merchantKey = this.configuration["Payme:MerchantKey"] ?? "";
        return decoded == $"Paycom:{merchantKey}";
    }

    private async Task<Payment?> FindByExternalIdAsync(string externalId)
    {
        return await this.paymentService.RetrieveAllPayments()
            .FirstOrDefaultAsync(p => p.ExternalTransactionId == externalId);
    }

    private static long GetAmount(Dictionary<string, object> p)
    {
        if (p is null) return 0;
        if (p.TryGetValue("amount", out var v))
        {
            if (v is JsonElement je) return je.GetInt64();
            return Convert.ToInt64(v);
        }
        return 0;
    }

    private static int PaymeTransactionState(PaymentStatus status) => status switch
    {
        PaymentStatus.Completed  =>  2,
        PaymentStatus.Cancelled  => -1,
        _                        =>  1
    };

    private static PaymeResponse Success(object id, object result) =>
        new() { Id = id, Result = result };

    private static PaymeResponse Error(object id, int code, string message) =>
        new() { Id = id, Error = new PaymeError { Code = code, Message = message, Data = null } };
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public class PaymeRequest
{
    [JsonPropertyName("jsonrpc")] public string JsonRpc { get; set; } = "2.0";
    [JsonPropertyName("id")]      public object Id      { get; set; }
    [JsonPropertyName("method")]  public string Method  { get; set; }
    [JsonPropertyName("params")]  public Dictionary<string, object> Params { get; set; }
}

public class PaymeResponse
{
    [JsonPropertyName("jsonrpc")] public string JsonRpc { get; set; } = "2.0";
    [JsonPropertyName("id")]      public object Id      { get; set; }
    [JsonPropertyName("result")]  public object Result  { get; set; }
    [JsonPropertyName("error")]   public PaymeError Error { get; set; }
}

public class PaymeError
{
    [JsonPropertyName("code")]    public int    Code    { get; set; }
    [JsonPropertyName("message")] public string Message { get; set; }
    [JsonPropertyName("data")]    public object? Data    { get; set; }
}
