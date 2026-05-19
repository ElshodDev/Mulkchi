using Mulkchi.Api.Models.Foundations.Auth;

namespace Mulkchi.Api.Brokers.Storages;

public partial interface IStorageBroker
{
    ValueTask<EmailVerificationToken> InsertEmailVerificationTokenAsync(EmailVerificationToken token);
    ValueTask<EmailVerificationToken> SelectEmailVerificationTokenByTokenAsync(string token);
    ValueTask<EmailVerificationToken> UpdateEmailVerificationTokenAsync(EmailVerificationToken token);
}
