using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Mulkchi.Api.Services.Foundations.Auth;

public class RedisRefreshTokenGuard : IRefreshTokenGuard
{
    private const string Prefix = "mulkchi:auth:refresh";

    private readonly IDatabase redisDatabase;
    private readonly ILogger<RedisRefreshTokenGuard> logger;

    public RedisRefreshTokenGuard(IConnectionMultiplexer connectionMultiplexer, ILogger<RedisRefreshTokenGuard> logger)
    {
        this.redisDatabase = connectionMultiplexer.GetDatabase();
        this.logger = logger;
    }

    public bool IsRevoked(string refreshTokenHash)
    {
        try
        {
            return this.redisDatabase.KeyExists(GetRevokedKey(refreshTokenHash));
        }
        catch (RedisException exception)
        {
            this.logger.LogWarning(
                exception,
                "Redis unavailable while checking refresh token revocation for {RefreshTokenHash}. Falling back to database validation.",
                refreshTokenHash);

            return false;
        }
    }

    public bool TryReserve(string refreshTokenHash, TimeSpan reservationTtl)
    {
        try
        {
            var reserved = this.redisDatabase.StringSet(
                GetReservationKey(refreshTokenHash),
                "1",
                reservationTtl,
                When.NotExists);

            if (reserved)
            {
                this.logger.LogDebug("Refresh token reservation acquired for {RefreshTokenHash}.", refreshTokenHash);
            }

            return reserved;
        }
        catch (RedisException exception)
        {
            this.logger.LogWarning(
                exception,
                "Redis unavailable while reserving refresh token {RefreshTokenHash}. Continuing with database validation only.",
                refreshTokenHash);

            return true;
        }
    }

    public void Revoke(string refreshTokenHash, TimeSpan revocationTtl)
    {
        if (revocationTtl <= TimeSpan.Zero)
        {
            revocationTtl = TimeSpan.FromMinutes(1);
        }

        try
        {
            this.redisDatabase.StringSet(GetRevokedKey(refreshTokenHash), "1", revocationTtl);
            this.logger.LogInformation("Refresh token revoked for {RefreshTokenHash}.", refreshTokenHash);
        }
        catch (RedisException exception)
        {
            this.logger.LogWarning(
                exception,
                "Redis unavailable while revoking refresh token {RefreshTokenHash}. Revocation will be persisted by the database update.",
                refreshTokenHash);
        }
    }

    public void ReleaseReservation(string refreshTokenHash)
    {
        try
        {
            this.redisDatabase.KeyDelete(GetReservationKey(refreshTokenHash));
        }
        catch (RedisException exception)
        {
            this.logger.LogDebug(
                exception,
                "Redis unavailable while releasing refresh token reservation for {RefreshTokenHash}.",
                refreshTokenHash);
        }
    }

    private static string GetReservationKey(string refreshTokenHash) =>
        $"{Prefix}:reservation:{refreshTokenHash}";

    private static string GetRevokedKey(string refreshTokenHash) =>
        $"{Prefix}:revoked:{refreshTokenHash}";
}
