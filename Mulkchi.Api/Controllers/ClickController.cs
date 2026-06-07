using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Mulkchi.Api.Application.Payments.Webhooks;
using Mulkchi.Api.Models.Foundations.Payments;
using Mulkchi.Api.Services.Foundations.Payments;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/click")]
public class ClickController : ControllerBase
{
    private const int ErrOk = 0;
    private const int ErrSignatureMismatch = -1;
    private const int ErrOrderNotFound = -5;
    private const int ErrAlreadyPaid = -4;
    private const int ErrTransactionCancelled = -9;
    private const int ErrInvalidAmount = -2;
    private static readonly TimeSpan MaxWebhookSkew = TimeSpan.FromMinutes(5);

    private const double AmountToleranceUzs = 0.01;
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<long, System.Threading.SemaphoreSlim> transactionLocks = new();

    private readonly IPaymentService paymentService;
    private readonly IConfiguration configuration;
    private readonly IFinalizePaymentWebhookHandler finalizePaymentWebhookHandler;

    public ClickController(
        IPaymentService paymentService,
        IConfiguration configuration,
        IFinalizePaymentWebhookHandler finalizePaymentWebhookHandler)
    {
        this.paymentService = paymentService;
        this.configuration = configuration;
        this.finalizePaymentWebhookHandler = finalizePaymentWebhookHandler;
    }

    [HttpPost("prepare")]
    public async Task<IActionResult> PrepareAsync([FromForm] ClickRequest request)
    {
        var response = new ClickResponse
        {
            ClickTransId = request.ClickTransId,
            MerchantTransId = request.MerchantTransId,
            MerchantPrepareId = 0
        };

        if (!VerifySignature(request, isPrepare: true))
        {
            response.Error = ErrSignatureMismatch;
            response.ErrorNote = "Invalid signature.";
            return Ok(response);
        }

        if (!Guid.TryParse(request.MerchantTransId, out var paymentId))
        {
            response.Error = ErrOrderNotFound;
            response.ErrorNote = "Order not found.";
            return Ok(response);
        }

        var transLock = transactionLocks.GetOrAdd(request.ClickTransId, _ => new System.Threading.SemaphoreSlim(1, 1));
        await transLock.WaitAsync();
        try
        {
            var payment = await this.paymentService.RetrievePaymentByIdAsync(paymentId);
            if (payment is null)
            {
                response.Error = ErrOrderNotFound;
                response.ErrorNote = "Order not found.";
                return Ok(response);
            }

            if (Math.Abs(request.Amount - (double)payment.Amount) > AmountToleranceUzs)
            {
                response.Error = ErrInvalidAmount;
                response.ErrorNote = "Invalid amount.";
                return Ok(response);
            }

            if (payment.Status == PaymentStatus.Completed)
            {
                response.Error = ErrAlreadyPaid;
                response.ErrorNote = "Already paid.";
                return Ok(response);
            }

            if (payment.Status == PaymentStatus.Cancelled)
            {
                response.Error = ErrTransactionCancelled;
                response.ErrorNote = "Transaction cancelled.";
                return Ok(response);
            }

            payment.ExternalTransactionId = request.ClickTransId.ToString();
            payment.Status = PaymentStatus.Processing;
            payment.Method = PaymentMethod.Click;
            payment.UpdatedDate = DateTimeOffset.UtcNow;
            await this.paymentService.ModifyPaymentAsync(payment);

            response.Error = ErrOk;
            response.ErrorNote = "Success";
            response.MerchantPrepareId = (long)payment.CreatedDate.ToUnixTimeMilliseconds();
            return Ok(response);
        }
        finally
        {
            transLock.Release();
        }
    }

    [HttpPost("complete")]
    public async Task<IActionResult> CompleteAsync([FromForm] ClickRequest request)
    {
        var response = new ClickResponse
        {
            ClickTransId = request.ClickTransId,
            MerchantTransId = request.MerchantTransId,
            MerchantConfirmId = 0
        };

        if (!VerifySignature(request, isPrepare: false))
        {
            response.Error = ErrSignatureMismatch;
            response.ErrorNote = "Invalid signature.";
            return Ok(response);
        }

        if (!Guid.TryParse(request.MerchantTransId, out var paymentId))
        {
            response.Error = ErrOrderNotFound;
            response.ErrorNote = "Order not found.";
            return Ok(response);
        }

        var transLock = transactionLocks.GetOrAdd(request.ClickTransId, _ => new System.Threading.SemaphoreSlim(1, 1));
        await transLock.WaitAsync();
        try
        {
            var payment = await this.paymentService.RetrievePaymentByIdAsync(paymentId);
            if (payment is null)
            {
                response.Error = ErrOrderNotFound;
                response.ErrorNote = "Order not found.";
                return Ok(response);
            }

            if (request.Error > 0)
            {
                payment = await this.finalizePaymentWebhookHandler.HandleAsync(
                    new FinalizePaymentWebhookCommand(
                        request.ClickTransId.ToString(),
                        PaymentMethod.Click,
                        PaymentStatus.Cancelled));

                response.Error = ErrOk;
                response.ErrorNote = "Cancelled";
                return Ok(response);
            }

            if (payment.Status == PaymentStatus.Completed)
            {
                response.Error = ErrAlreadyPaid;
                response.ErrorNote = "Already paid.";
                return Ok(response);
            }

            payment = await this.finalizePaymentWebhookHandler.HandleAsync(
                new FinalizePaymentWebhookCommand(
                    request.ClickTransId.ToString(),
                    PaymentMethod.Click,
                    PaymentStatus.Completed));

            response.Error = ErrOk;
            response.ErrorNote = "Success";
            response.MerchantConfirmId = (long)payment.UpdatedDate.ToUnixTimeMilliseconds();
            return Ok(response);
        }
        finally
        {
            transLock.Release();
        }
    }


    private bool VerifySignature(ClickRequest req, bool isPrepare)
    {
        if (!long.TryParse(req.SignTime, out var signUnix))
            return false;

        var signTime = DateTimeOffset.FromUnixTimeSeconds(signUnix);
        if (DateTimeOffset.UtcNow - signTime > MaxWebhookSkew)
            return false;

        var secretKey = this.configuration["Click:SecretKey"] ?? "";
        var raw = $"{req.ClickTransId}{req.ServiceId}{secretKey}{req.MerchantTransId}{req.Amount}{req.Action}{req.SignTime}";
        var computed = ComputeMd5(raw);
        return string.Equals(computed, req.SignString, StringComparison.OrdinalIgnoreCase);
    }

    private static string ComputeMd5(string input)
    {
        var bytes = MD5.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}


public class ClickRequest
{
    [Microsoft.AspNetCore.Mvc.ModelBinder(Name = "click_trans_id")]
    public long ClickTransId { get; set; }

    [Microsoft.AspNetCore.Mvc.ModelBinder(Name = "service_id")]
    public int ServiceId { get; set; }

    [Microsoft.AspNetCore.Mvc.ModelBinder(Name = "click_paydoc_id")]
    public long ClickPaydocId { get; set; }

    [Microsoft.AspNetCore.Mvc.ModelBinder(Name = "merchant_trans_id")]
    public string MerchantTransId { get; set; }

    [Microsoft.AspNetCore.Mvc.ModelBinder(Name = "amount")]
    public double Amount { get; set; }

    [Microsoft.AspNetCore.Mvc.ModelBinder(Name = "action")]
    public int Action { get; set; }

    [Microsoft.AspNetCore.Mvc.ModelBinder(Name = "error")]
    public int Error { get; set; }

    [Microsoft.AspNetCore.Mvc.ModelBinder(Name = "error_note")]
    public string ErrorNote { get; set; }

    [Microsoft.AspNetCore.Mvc.ModelBinder(Name = "sign_time")]
    public string SignTime { get; set; }

    [Microsoft.AspNetCore.Mvc.ModelBinder(Name = "sign_string")]
    public string SignString { get; set; }
}

public class ClickResponse
{
    [System.Text.Json.Serialization.JsonPropertyName("click_trans_id")]
    public long ClickTransId { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("merchant_trans_id")]
    public string MerchantTransId { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("merchant_prepare_id")]
    public long MerchantPrepareId { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("merchant_confirm_id")]
    public long MerchantConfirmId { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("error")]
    public int Error { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("error_note")]
    public string ErrorNote { get; set; }
}
