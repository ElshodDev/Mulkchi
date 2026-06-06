using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Verifications;

namespace Mulkchi.Api.Brokers.Storages;

public partial class StorageBroker
{
    public async ValueTask<Verification> InsertVerificationAsync(Verification verification)
    {
        var entry = await this.Verifications.AddAsync(verification);
        await this.SaveChangesAsync();
        return entry.Entity;
    }

    public IQueryable<Verification> SelectAllVerifications() =>
        this.Verifications.AsQueryable();

    public async ValueTask<Verification> SelectVerificationByIdAsync(Guid verificationId) =>
        (await this.Verifications.FindAsync(verificationId))!;

    public async ValueTask<Verification> UpdateVerificationAsync(Verification verification)
    {
        this.Entry(verification).State = EntityState.Modified;
        await this.SaveChangesAsync();
        return verification;
    }

    public async ValueTask<Verification> DeleteVerificationAsync(Verification verification)
    {
        this.Entry(verification).State = EntityState.Deleted;
        await this.SaveChangesAsync();
        return verification;
    }
}
