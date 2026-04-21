using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.Subscriptions;

namespace Mulkchi.Api.Brokers.Storages;

public partial class StorageBroker
{
    public DbSet<SubscriptionPlan> SubscriptionPlans { get; set; }
    public DbSet<UserSubscription> UserSubscriptions { get; set; }

    public async ValueTask<SubscriptionPlan> InsertSubscriptionPlanAsync(SubscriptionPlan plan)
    {
        this.SubscriptionPlans.Add(plan);
        await this.SaveChangesAsync();
        return plan;
    }

    public IQueryable<SubscriptionPlan> SelectAllSubscriptionPlans() =>
        this.SubscriptionPlans.AsQueryable();

    public async ValueTask<SubscriptionPlan?> SelectSubscriptionPlanByIdAsync(Guid id) =>
        await this.SubscriptionPlans.FindAsync(id);

    public async ValueTask<SubscriptionPlan> UpdateSubscriptionPlanAsync(SubscriptionPlan plan)
    {
        this.SubscriptionPlans.Update(plan);
        await this.SaveChangesAsync();
        return plan;
    }

    public async ValueTask<SubscriptionPlan> DeleteSubscriptionPlanAsync(SubscriptionPlan plan)
    {
        this.SubscriptionPlans.Remove(plan);
        await this.SaveChangesAsync();
        return plan;
    }

    public async ValueTask<UserSubscription> InsertUserSubscriptionAsync(UserSubscription subscription)
    {
        this.UserSubscriptions.Add(subscription);
        await this.SaveChangesAsync();
        return subscription;
    }

    public IQueryable<UserSubscription> SelectAllUserSubscriptions() =>
        this.UserSubscriptions.AsQueryable();

    public async ValueTask<UserSubscription?> SelectUserSubscriptionByIdAsync(Guid id) =>
        await this.UserSubscriptions
            .Include(s => s.Plan)
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == id);

    public async ValueTask<UserSubscription> UpdateUserSubscriptionAsync(UserSubscription subscription)
    {
        this.UserSubscriptions.Update(subscription);
        await this.SaveChangesAsync();
        return subscription;
    }

    public async ValueTask<UserSubscription> DeleteUserSubscriptionAsync(UserSubscription subscription)
    {
        this.UserSubscriptions.Remove(subscription);
        await this.SaveChangesAsync();
        return subscription;
    }
}
