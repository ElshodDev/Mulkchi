using System.Globalization;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Mulkchi.Api.Services.Foundations.Users;

public class RedisUserConnectionTracker : IUserConnectionTracker
{
    private const string PresencePrefix = "mulkchi:presence";
    private const string OnlineUsersKey = PresencePrefix + ":users";
    private static readonly TimeSpan ConnectionRetention = TimeSpan.FromDays(7);
    private static readonly TimeSpan CleanupLookback = TimeSpan.FromDays(7);

    private readonly IDatabase redisDatabase;
    private readonly ILogger<RedisUserConnectionTracker> logger;

    public RedisUserConnectionTracker(IConnectionMultiplexer connectionMultiplexer, ILogger<RedisUserConnectionTracker> logger)
    {
        this.redisDatabase = connectionMultiplexer.GetDatabase();
        this.logger = logger;
    }

    public void AddConnection(string userId, string connectionId)
    {
        var now = DateTimeOffset.UtcNow;
        var connectionKey = GetConnectionKey(connectionId);
        var userConnectionsKey = GetUserConnectionsKey(userId);
        var userActivityKey = GetUserActivityKey(userId);

        this.redisDatabase.StringSet(connectionKey, userId, ConnectionRetention);
        this.redisDatabase.SortedSetAdd(userConnectionsKey, connectionId, now.ToUnixTimeMilliseconds());
        this.redisDatabase.StringSet(userActivityKey, now.ToString("O", CultureInfo.InvariantCulture), ConnectionRetention);
        this.redisDatabase.SetAdd(OnlineUsersKey, userId);

        this.logger.LogInformation(
            "Redis presence added for user {UserId} and connection {ConnectionId}.",
            userId,
            connectionId);
    }

    public void RemoveConnection(string connectionId)
    {
        var connectionKey = GetConnectionKey(connectionId);
        var userId = this.redisDatabase.StringGet(connectionKey).ToString();

        if (string.IsNullOrWhiteSpace(userId))
        {
            this.redisDatabase.KeyDelete(connectionKey);
            return;
        }

        RemoveConnectionFromUser(userId, connectionId);
        this.redisDatabase.KeyDelete(connectionKey);
        this.logger.LogInformation(
            "Redis presence removed for user {UserId} and connection {ConnectionId}.",
            userId,
            connectionId);
    }

    public List<string> GetConnections(string userId)
    {
        PruneUserConnections(userId);

        var members = this.redisDatabase.SortedSetRangeByScore(
            GetUserConnectionsKey(userId),
            double.NegativeInfinity,
            double.PositiveInfinity,
            Exclude.None,
            Order.Ascending);

        return members
            .Select(member => member.ToString())
            .Where(connectionId => !string.IsNullOrWhiteSpace(connectionId))
            .ToList();
    }

    public string? GetConnectionId(string userId)
    {
        return GetConnections(userId).FirstOrDefault();
    }

    public bool IsUserOnline(string userId)
    {
        return GetConnections(userId).Count > 0;
    }

    public List<string> GetOnlineUsers()
    {
        var users = this.redisDatabase.SetMembers(OnlineUsersKey)
            .Select(member => member.ToString())
            .Where(userId => !string.IsNullOrWhiteSpace(userId))
            .ToList();

        var onlineUsers = new List<string>();

        foreach (var userId in users)
        {
            if (GetConnections(userId).Count > 0)
            {
                onlineUsers.Add(userId);
            }
        }

        return onlineUsers;
    }

    public int GetOnlineUserCount()
    {
        return GetOnlineUsers().Count;
    }

    public void UpdateUserActivity(string userId)
    {
        this.redisDatabase.StringSet(
            GetUserActivityKey(userId),
            DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture),
            ConnectionRetention);
    }

    public DateTimeOffset? GetUserLastActivity(string userId)
    {
        var value = this.redisDatabase.StringGet(GetUserActivityKey(userId));

        if (value.IsNullOrEmpty)
        {
            return null;
        }

        return DateTimeOffset.TryParse(
            value.ToString(),
            CultureInfo.InvariantCulture,
            DateTimeStyles.RoundtripKind,
            out var lastActivity)
            ? lastActivity
            : null;
    }

    public Task CleanupExpiredConnectionsAsync(CancellationToken cancellationToken = default)
    {
        var userIds = this.redisDatabase.SetMembers(OnlineUsersKey)
            .Select(member => member.ToString())
            .Where(userId => !string.IsNullOrWhiteSpace(userId))
            .ToList();

        foreach (var userId in userIds)
        {
            cancellationToken.ThrowIfCancellationRequested();
            PruneUserConnections(userId);
        }

        return Task.CompletedTask;
    }

    private void PruneUserConnections(string userId)
    {
        var cutoff = DateTimeOffset.UtcNow.Subtract(CleanupLookback).ToUnixTimeMilliseconds();
        var userConnectionsKey = GetUserConnectionsKey(userId);

        var staleConnections = this.redisDatabase.SortedSetRangeByScore(
            userConnectionsKey,
            double.NegativeInfinity,
            cutoff,
            Exclude.None,
            Order.Ascending);

        if (staleConnections.Length > 0)
        {
            this.redisDatabase.SortedSetRemoveRangeByScore(userConnectionsKey, double.NegativeInfinity, cutoff);
        }

        var remainingCount = this.redisDatabase.SortedSetLength(userConnectionsKey);
        if (remainingCount == 0)
        {
            this.redisDatabase.SetRemove(OnlineUsersKey, userId);
            this.redisDatabase.KeyDelete(userConnectionsKey);
            this.redisDatabase.KeyDelete(GetUserActivityKey(userId));
        }
    }

    private void RemoveConnectionFromUser(string userId, string connectionId)
    {
        var userConnectionsKey = GetUserConnectionsKey(userId);
        this.redisDatabase.SortedSetRemove(userConnectionsKey, connectionId);

        if (this.redisDatabase.SortedSetLength(userConnectionsKey) == 0)
        {
            this.redisDatabase.SetRemove(OnlineUsersKey, userId);
            this.redisDatabase.KeyDelete(userConnectionsKey);
            this.redisDatabase.KeyDelete(GetUserActivityKey(userId));
        }
    }

    private static string GetConnectionKey(string connectionId) =>
        $"{PresencePrefix}:connections:{connectionId}";

    private static string GetUserConnectionsKey(string userId) =>
        $"{PresencePrefix}:users:{userId}:connections";

    private static string GetUserActivityKey(string userId) =>
        $"{PresencePrefix}:users:{userId}:activity";
}
