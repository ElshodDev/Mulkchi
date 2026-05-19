using Mulkchi.Api.Models.Foundations.Payments;

namespace Mulkchi.Api.Services.Foundations.Payments;

public interface IPaymentService
{
    ValueTask<Payment> AddPaymentAsync(Payment payment);
    IQueryable<Payment> RetrieveAllPayments();
    ValueTask<Payment> RetrievePaymentByIdAsync(Guid paymentId);
    ValueTask<Payment?> RetrievePaymentByIdempotencyKeyAsync(string idempotencyKey);
    ValueTask<Payment> ModifyPaymentAsync(Payment payment);
    ValueTask<Payment> RemovePaymentByIdAsync(Guid paymentId);
}
