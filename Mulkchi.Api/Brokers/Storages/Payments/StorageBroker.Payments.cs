using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Payments;

namespace Mulkchi.Api.Brokers.Storages;

public partial class StorageBroker
{
    public DbSet<Payment> Payments { get; set; }

    public async ValueTask<Payment> InsertPaymentAsync(Payment payment)
    {
        var entry = await this.Payments.AddAsync(payment);
        await this.SaveChangesAsync();
        return entry.Entity;
    }

    public IQueryable<Payment> SelectAllPayments()
        => this.Payments.AsQueryable();

    public async ValueTask<Payment> SelectPaymentByIdAsync(Guid paymentId)
        => (await this.Payments.FindAsync(paymentId))!;

    public async ValueTask<Payment?> SelectPaymentByIdempotencyKeyAsync(string idempotencyKey)
        => await this.Payments
            .FirstOrDefaultAsync(p => p.IdempotencyKey == idempotencyKey);

    public async ValueTask<Payment> UpdatePaymentAsync(Payment payment)
    {
        this.Entry(payment).State = EntityState.Modified;
        await this.SaveChangesAsync();
        return payment;
    }

    public async ValueTask<Payment> DeletePaymentByIdAsync(Guid paymentId)
    {
        Payment payment = (await this.Payments.FindAsync(paymentId))!;
        payment.DeletedDate = DateTimeOffset.UtcNow;
        payment.UpdatedDate = DateTimeOffset.UtcNow;
        this.Entry(payment).State = EntityState.Modified;
        await this.SaveChangesAsync();
        return payment;
    }
}
