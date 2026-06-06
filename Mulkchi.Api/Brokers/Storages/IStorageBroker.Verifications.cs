using Mulkchi.Api.Models.Foundations.Verifications;

namespace Mulkchi.Api.Brokers.Storages;

public partial interface IStorageBroker
{
    ValueTask<Verification> InsertVerificationAsync(Verification verification);
    IQueryable<Verification> SelectAllVerifications();
    ValueTask<Verification> SelectVerificationByIdAsync(Guid verificationId);
    ValueTask<Verification> UpdateVerificationAsync(Verification verification);
    ValueTask<Verification> DeleteVerificationAsync(Verification verification);
}
