using Mulkchi.Api.Models.Foundations.Verifications;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.DateTimes;

namespace Mulkchi.Api.Services.Foundations.Verifications;

public class VerificationService : IVerificationService
{
    private readonly IStorageBroker storageBroker;
    private readonly ILoggingBroker loggingBroker;
    private readonly IDateTimeBroker dateTimeBroker;

    public VerificationService(
        IStorageBroker storageBroker,
        ILoggingBroker loggingBroker,
        IDateTimeBroker dateTimeBroker)
    {
        this.storageBroker = storageBroker;
        this.loggingBroker = loggingBroker;
        this.dateTimeBroker = dateTimeBroker;
    }

    public async ValueTask<Verification> SubmitVerificationAsync(Verification verification)
    {
        var now = this.dateTimeBroker.GetCurrentDateTimeOffset();
        verification.CreatedDate = now;
        verification.UpdatedDate = now;
        verification.Status = VerificationStatus.Pending;

        return await this.storageBroker.InsertVerificationAsync(verification);
    }

    public async ValueTask<Verification> RetrieveVerificationByIdAsync(Guid verificationId)
    {
        var verification = await this.storageBroker.SelectVerificationByIdAsync(verificationId);
        if (verification is null)
        {
            throw new Exception($"Verification with ID {verificationId} not found.");
        }
        return verification;
    }

    public async ValueTask<Verification> VerifyIdentityAsync(Guid verificationId)
    {
        // Sandbox AI Logic: Simulates Face Recognition & Passport Check
        var verification = await RetrieveVerificationByIdAsync(verificationId);
        
        // Mock AI Processing
        verification.AiConfidenceScore = 98.5;
        verification.Status = VerificationStatus.Approved;
        verification.UpdatedDate = this.dateTimeBroker.GetCurrentDateTimeOffset();

        return await this.storageBroker.UpdateVerificationAsync(verification);
    }
}
