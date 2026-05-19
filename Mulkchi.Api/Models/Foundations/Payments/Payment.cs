#nullable disable

namespace Mulkchi.Api.Models.Foundations.Payments;

public class Payment
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public decimal PlatformFee { get; set; }
    public decimal HostReceives { get; set; }
    public PaymentType Type { get; set; }
    public PaymentStatus Status { get; set; }
    public PaymentMethod Method { get; set; }
    public bool IsEscrowHeld { get; set; }
    public DateTimeOffset? EscrowReleasedAt { get; set; }
    public string ExternalTransactionId { get; set; }
    public string PaymentUrl { get; set; }
    public Guid PayerId { get; set; }
    public Guid ReceiverId { get; set; }
    public Guid? HomeRequestId { get; set; }
    public Guid? ContractId { get; set; }
    public Guid? BookingId { get; set; }

    /// <summary>
    /// Client-supplied idempotency key (e.g. from X-Idempotency-Key header).
    /// Duplicate requests with the same key return the original payment instead
    /// of creating a new charge, preventing double-billing on network retries.
    /// </summary>
    public string IdempotencyKey { get; set; }

    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset UpdatedDate { get; set; }
    public DateTimeOffset? DeletedDate { get; set; }
}

