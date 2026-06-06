using Mulkchi.Api.Models.Foundations.Verifications;

namespace Mulkchi.Api.Services.Foundations.Verifications;

public interface IVerificationService
{
    ValueTask<Verification> SubmitVerificationAsync(Verification verification);
    ValueTask<Verification> RetrieveVerificationByIdAsync(Guid verificationId);
    ValueTask<Verification> VerifyIdentityAsync(Guid verificationId);
}
