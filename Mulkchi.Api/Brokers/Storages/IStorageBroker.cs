using Mulkchi.Api.Models.Foundations.Auth;

namespace Mulkchi.Api.Brokers.Storages;

public partial interface IStorageBroker
{
    ValueTask<PasswordResetToken> InsertPasswordResetTokenAsync(PasswordResetToken token);
    ValueTask<PasswordResetToken> SelectPasswordResetTokenByTokenAsync(string token);
    ValueTask<PasswordResetToken> UpdatePasswordResetTokenAsync(PasswordResetToken token);
}
