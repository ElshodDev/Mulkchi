using Mulkchi.Api.Models.Foundations.Payments;

namespace Mulkchi.Api.Brokers.Storages;

public partial interface IStorageBroker
{
    ValueTask<Payment> InsertPaymentAsync(Payment payment);
    IQueryable<Payment> SelectAllPayments();
    ValueTask<Payment> SelectPaymentByIdAsync(Guid paymentId);
    ValueTask<Payment?> SelectPaymentByIdempotencyKeyAsync(string idempotencyKey);
    ValueTask<Payment> UpdatePaymentAsync(Payment payment);
    ValueTask<Payment> DeletePaymentByIdAsync(Guid paymentId);
}
