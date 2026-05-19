using Mulkchi.Api.Models.Foundations.Payments;

namespace Mulkchi.Api.Application.Payments.Webhooks;

public sealed record FinalizePaymentWebhookCommand(
    string ExternalTransactionId,
    PaymentMethod Method,
    PaymentStatus TargetStatus);
