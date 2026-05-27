using Mulkchi.Api.Models.Foundations.Users;

namespace Mulkchi.Api.Brokers.Storages;

public partial interface IStorageBroker
{
    ValueTask<User> InsertUserAsync(User user);
    IQueryable<User> SelectAllUsers();
    ValueTask<User> SelectUserByIdAsync(Guid userId);
    ValueTask<User?> SelectUserByEmailAsync(string email);
    ValueTask<User?> SelectUserByTelegramIdAsync(long telegramId);
    ValueTask<User> UpdateUserAsync(User user);
    ValueTask<User> DeleteUserByIdAsync(Guid userId);

    IQueryable<User> SelectAllUsersIncludingDeleted();
    ValueTask<User> SelectUserByIdIncludingDeletedAsync(Guid userId);
}
