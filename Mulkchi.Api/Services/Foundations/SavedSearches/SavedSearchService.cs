using Mulkchi.Api.Models.Foundations.SavedSearches;
using Mulkchi.Api.Models.Foundations.SavedSearches.Exceptions;
using Mulkchi.Api.Brokers.DateTimes;
using Mulkchi.Api.Brokers.Loggings;
using Mulkchi.Api.Brokers.Storages;

namespace Mulkchi.Api.Services.Foundations.SavedSearches
{
    public partial class SavedSearchService : ISavedSearchService
    {
        private readonly IStorageBroker storageBroker;
        private readonly ILoggingBroker loggingBroker;
        private readonly IDateTimeBroker dateTimeBroker;

        public SavedSearchService(
            IStorageBroker storageBroker,
            ILoggingBroker loggingBroker,
            IDateTimeBroker dateTimeBroker)
        {
            this.storageBroker = storageBroker;
            this.loggingBroker = loggingBroker;
            this.dateTimeBroker = dateTimeBroker;
        }

        public ValueTask<SavedSearch> AddSavedSearchAsync(SavedSearch savedSearch) =>
            TryCatch(async () =>
            {
                ValidateSavedSearchOnAdd(savedSearch);
                var now = this.dateTimeBroker.GetCurrentDateTimeOffset();
                savedSearch.CreatedAt = now;
                savedSearch.UpdatedAt = now;
                return await this.storageBroker.InsertSavedSearchAsync(savedSearch);
            });

        public IQueryable<SavedSearch> RetrieveAllSavedSearches() =>
            TryCatch(() => this.storageBroker.SelectAllSavedSearches());

        public ValueTask<SavedSearch> RetrieveSavedSearchByIdAsync(Guid savedSearchId) =>
            TryCatch(async () =>
            {
                ValidateSavedSearchId(savedSearchId);
                SavedSearch maybeSavedSearch = await this.storageBroker.SelectSavedSearchByIdAsync(savedSearchId);

                if (maybeSavedSearch is null)
                    throw new NotFoundSavedSearchException(savedSearchId);

                return maybeSavedSearch;
            });

        public ValueTask<SavedSearch> ModifySavedSearchAsync(SavedSearch savedSearch) =>
            TryCatch(async () =>
            {
                ValidateSavedSearchOnModify(savedSearch);
                savedSearch.UpdatedAt = this.dateTimeBroker.GetCurrentDateTimeOffset();
                return await this.storageBroker.UpdateSavedSearchAsync(savedSearch);
            });

        public ValueTask<SavedSearch> RemoveSavedSearchByIdAsync(Guid savedSearchId) =>
            TryCatch(async () =>
            {
                ValidateSavedSearchId(savedSearchId);
                SavedSearch maybeSavedSearch = await this.storageBroker.SelectSavedSearchByIdAsync(savedSearchId);

                if (maybeSavedSearch is null)
                    throw new NotFoundSavedSearchException(savedSearchId);

                maybeSavedSearch.DeletedAt = this.dateTimeBroker.GetCurrentDateTimeOffset();
                maybeSavedSearch.UpdatedAt = this.dateTimeBroker.GetCurrentDateTimeOffset();
                return await this.storageBroker.UpdateSavedSearchAsync(maybeSavedSearch);
            });
    }
}
