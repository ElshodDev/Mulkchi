using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Models.Foundations.SavedSearches;

namespace Mulkchi.Api.Brokers.Storages
{
    public partial class StorageBroker
    {
        public DbSet<SavedSearch> SavedSearches { get; set; }

        public async ValueTask<SavedSearch> InsertSavedSearchAsync(SavedSearch savedSearch)
        {
            var entry = await this.SavedSearches.AddAsync(savedSearch);
            await this.SaveChangesAsync();
            return entry.Entity;
        }

        public IQueryable<SavedSearch> SelectAllSavedSearches()
            => this.SavedSearches.AsQueryable();

        public async ValueTask<SavedSearch> SelectSavedSearchByIdAsync(Guid savedSearchId)
            => (await this.SavedSearches.FindAsync(savedSearchId))!;

        public async ValueTask<SavedSearch> UpdateSavedSearchAsync(SavedSearch savedSearch)
        {
            var trackedEntry = this.ChangeTracker.Entries<SavedSearch>()
                .FirstOrDefault(entry => entry.Entity.Id == savedSearch.Id);

            if (trackedEntry is not null)
                trackedEntry.State = EntityState.Detached;

            this.Entry(savedSearch).State = EntityState.Modified;
            await this.SaveChangesAsync();
            return savedSearch;
        }

        public async ValueTask<SavedSearch> DeleteSavedSearchByIdAsync(Guid savedSearchId)
        {
            SavedSearch savedSearch = (await this.SavedSearches.FindAsync(savedSearchId))!;
            savedSearch.DeletedAt = DateTimeOffset.UtcNow;
            savedSearch.UpdatedAt = DateTimeOffset.UtcNow;
            this.Entry(savedSearch).State = EntityState.Modified;
            await this.SaveChangesAsync();
            return savedSearch;
        }
    }
}
