namespace Mulkchi.Api.Services.Foundations.Auth;

public sealed class NoOpRefreshTokenGuard : IRefreshTokenGuard
{
    public bool IsRevoked(string refreshTokenHash) => false;

    public bool TryReserve(string refreshTokenHash, TimeSpan reservationTtl) => true;

    public void Revoke(string refreshTokenHash, TimeSpan revocationTtl)
    {
    }

    public void ReleaseReservation(string refreshTokenHash)
    {
    }
}
