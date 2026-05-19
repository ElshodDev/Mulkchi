using System.Collections.Concurrent;

namespace Mulkchi.Api.Services.Foundations.Users;

public interface IUserConnectionTracker
{
    void AddConnection(string userId, string connectionId);
    void RemoveConnection(string connectionId);
    List<string> GetConnections(string userId);
    string? GetConnectionId(string userId);
    bool IsUserOnline(string userId);
    List<string> GetOnlineUsers();
    int GetOnlineUserCount();
    void UpdateUserActivity(string userId);
    DateTimeOffset? GetUserLastActivity(string userId);
    Task CleanupExpiredConnectionsAsync(CancellationToken cancellationToken = default);
}

public class UserConnectionTracker : IUserConnectionTracker
{
    private readonly ConcurrentDictionary<string, HashSet<string>> userConnections = new();
    private readonly ConcurrentDictionary<string, string> connectionToUser = new();
    private readonly ConcurrentDictionary<string, DateTimeOffset> userActivity = new();

    public void AddConnection(string userId, string connectionId)
    {
        userConnections.AddOrUpdate(userId, 
            new HashSet<string> { connectionId }, 
            (key, existing) => 
            {
                lock (existing)
                {
                    existing.Add(connectionId);
                    return existing;
                }
            });

        connectionToUser[connectionId] = userId;
        UpdateUserActivity(userId);
    }

    public void RemoveConnection(string connectionId)
    {
        if (connectionToUser.TryRemove(connectionId, out var userId))
        {
            if (userConnections.TryGetValue(userId, out var connections))
            {
                lock (connections)
                {
                    connections.Remove(connectionId);
                    if (connections.Count == 0)
                    {
                        userConnections.TryRemove(userId, out _);
                        userActivity.TryRemove(userId, out _);
                    }
                }
            }
        }
    }

    public List<string> GetConnections(string userId)
    {
        if (userConnections.TryGetValue(userId, out var connections))
        {
            lock (connections)
            {
                return connections.ToList();
            }
        }
        return new List<string>();
    }

    public string? GetConnectionId(string userId)
    {
        var connections = GetConnections(userId);
        return connections.FirstOrDefault();
    }

    public bool IsUserOnline(string userId)
    {
        return userConnections.ContainsKey(userId) && GetConnections(userId).Count > 0;
    }

    public List<string> GetOnlineUsers()
    {
        return userConnections.Keys.ToList();
    }

    public int GetOnlineUserCount()
    {
        return userConnections.Count;
    }

    public void UpdateUserActivity(string userId)
    {
        userActivity[userId] = DateTimeOffset.UtcNow;
    }

    public DateTimeOffset? GetUserLastActivity(string userId)
    {
        return userActivity.TryGetValue(userId, out var lastActivity) ? lastActivity : null;
    }

    public Task CleanupExpiredConnectionsAsync(CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
}
