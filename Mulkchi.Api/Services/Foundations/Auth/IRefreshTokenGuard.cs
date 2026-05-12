namespace Mulkchi.Api.Services.Foundations.Auth;

public interface IRefreshTokenGuard
{
    bool IsRevoked(string refreshTokenHash);
    bool TryReserve(string refreshTokenHash, TimeSpan reservationTtl);
    void Revoke(string refreshTokenHash, TimeSpan revocationTtl);
    void ReleaseReservation(string refreshTokenHash);
}
