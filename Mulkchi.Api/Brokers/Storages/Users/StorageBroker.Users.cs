using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Users;

namespace Mulkchi.Api.Brokers.Storages;

public partial class StorageBroker
{
    public DbSet<User> Users { get; set; }

    public async ValueTask<User> InsertUserAsync(User user)
    {
        var entry = await this.Users.AddAsync(user);
        await this.SaveChangesAsync();
        return entry.Entity;
    }

    public IQueryable<User> SelectAllUsers()
        => this.Users.AsQueryable();

    public async ValueTask<User> SelectUserByIdAsync(Guid userId)
        => (await this.Users.FindAsync(userId))!;

    public async ValueTask<User?> SelectUserByEmailAsync(string email)
        => await this.Users.FirstOrDefaultAsync(u => u.Email == email);

    public async ValueTask<User?> SelectUserByTelegramIdAsync(long telegramId)
        => await this.Users.FirstOrDefaultAsync(u => u.TelegramId == telegramId);

    public async ValueTask<User> UpdateUserAsync(User user)
    {
        this.Entry(user).State = EntityState.Modified;
        await this.SaveChangesAsync();
        return user;
    }

    public async ValueTask<User> DeleteUserByIdAsync(Guid userId)
    {
        User? user = await this.Users.FindAsync(userId);

        if (user is null)
            return null!;

        user.DeletedDate = DateTimeOffset.UtcNow;
        user.UpdatedDate = DateTimeOffset.UtcNow;
        this.Entry(user).State = EntityState.Modified;
        await this.SaveChangesAsync();
        return user;
    }

    // Admin methods to bypass soft delete filters
    public IQueryable<User> SelectAllUsersIncludingDeleted()
        => this.Users.IgnoreQueryFilters().AsQueryable();

    public async ValueTask<User> SelectUserByIdIncludingDeletedAsync(Guid userId)
        => (await this.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId))!;
}
