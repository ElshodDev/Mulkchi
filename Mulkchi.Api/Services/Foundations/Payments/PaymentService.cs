using Mulkchi.Api.Models.Foundations.Payments;
using Mulkchi.Api.Models.Foundations.Payments.Exceptions;
using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Brokers.Payments;

namespace Mulkchi.Api.Services.Foundations.Payments;

public partial class PaymentService : IPaymentService
{
    private readonly IStorageBroker storageBroker;
    private readonly ILoggingBroker loggingBroker;
    private readonly IDateTimeBroker dateTimeBroker;
    private readonly IPaymeBroker paymeBroker;
    private readonly IClickBroker clickBroker;

    public PaymentService(
        IStorageBroker storageBroker,
        ILoggingBroker loggingBroker,
        IDateTimeBroker dateTimeBroker,
        IPaymeBroker paymeBroker,
        IClickBroker clickBroker)
    {
        this.storageBroker = storageBroker;
        this.loggingBroker = loggingBroker;
        this.dateTimeBroker = dateTimeBroker;
        this.paymeBroker = paymeBroker;
        this.clickBroker = clickBroker;
    }

    public ValueTask<Payment> AddPaymentAsync(Payment payment) =>
        TryCatch(async () =>
        {
            ValidatePaymentOnAdd(payment);
            var now = this.dateTimeBroker.GetCurrentDateTimeOffset();
            payment.CreatedDate = now;
            payment.UpdatedDate = now;
            return await this.storageBroker.InsertPaymentAsync(payment);
        });

    public IQueryable<Payment> RetrieveAllPayments() =>
        TryCatch(() => this.storageBroker.SelectAllPayments());

    public ValueTask<Payment> RetrievePaymentByIdAsync(Guid paymentId) =>
        TryCatch(async () =>
        {
            ValidatePaymentId(paymentId);
            Payment maybePayment = await this.storageBroker.SelectPaymentByIdAsync(paymentId);

            if (maybePayment is null)
                throw new NotFoundPaymentException(paymentId);

            return maybePayment;
        });

    public async ValueTask<Payment?> RetrievePaymentByIdempotencyKeyAsync(string idempotencyKey)
    {
        if (string.IsNullOrWhiteSpace(idempotencyKey))
            return null;

        return await this.storageBroker.SelectPaymentByIdempotencyKeyAsync(idempotencyKey);
    }

    public ValueTask<Payment> ModifyPaymentAsync(Payment payment) =>
        TryCatch(async () =>
        {
            ValidatePaymentOnModify(payment);
            payment.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();
            return await this.storageBroker.UpdatePaymentAsync(payment);
        });

    public ValueTask<Payment> RemovePaymentByIdAsync(Guid paymentId) =>
        TryCatch(async () =>
        {
            ValidatePaymentId(paymentId);
            return await this.storageBroker.DeletePaymentByIdAsync(paymentId);
        });
}
