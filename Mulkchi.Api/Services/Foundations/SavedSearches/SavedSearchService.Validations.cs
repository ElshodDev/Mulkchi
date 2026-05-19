using Mulkchi.Api.Models.Foundations.SavedSearches;
using Mulkchi.Api.Models.Foundations.SavedSearches.Exceptions;
using Xeptions;

namespace Mulkchi.Api.Services.Foundations.SavedSearches;

public partial class SavedSearchService
{
    private void ValidateSavedSearchOnAdd(SavedSearch savedSearch)
    {
        ValidateSavedSearchIsNotNull(savedSearch);
        Validate(
        (Rule: IsInvalid(savedSearch.Id), Parameter: nameof(SavedSearch.Id)),
        (Rule: IsInvalid(savedSearch.UserId), Parameter: nameof(SavedSearch.UserId)),
        (Rule: IsInvalid(savedSearch.Name), Parameter: nameof(SavedSearch.Name)),
        (Rule: IsInvalid(savedSearch.City), Parameter: nameof(SavedSearch.City)));
    }

    private void ValidateSavedSearchOnModify(SavedSearch savedSearch)
    {
        ValidateSavedSearchIsNotNull(savedSearch);
        Validate(
        (Rule: IsInvalid(savedSearch.Id), Parameter: nameof(SavedSearch.Id)),
        (Rule: IsInvalid(savedSearch.UserId), Parameter: nameof(SavedSearch.UserId)),
        (Rule: IsInvalid(savedSearch.Name), Parameter: nameof(SavedSearch.Name)),
        (Rule: IsInvalid(savedSearch.City), Parameter: nameof(SavedSearch.City)));
    }

    private static void ValidateSavedSearchId(Guid savedSearchId)
    {
        if (savedSearchId == Guid.Empty)
        {
            throw new InvalidSavedSearchException(
                message: "SavedSearch id is invalid.");
        }
    }

    private static void ValidateSavedSearchIsNotNull(SavedSearch savedSearch)
    {
        if (savedSearch is null)
            throw new NullSavedSearchException(message: "SavedSearch is null.");
    }

    private static dynamic IsInvalid(Guid id) => new
    {
        Condition = id == Guid.Empty,
        Message = "Id is required."
    };

    private static dynamic IsInvalid(string text) => new
    {
        Condition = string.IsNullOrWhiteSpace(text),
        Message = "Value is required."
    };

    private void Validate(params (dynamic Rule, string Parameter)[] validations)
    {
        var invalidSavedSearchException =
            new InvalidSavedSearchException(message: "SavedSearch data is invalid.");

        foreach ((dynamic rule, string parameter) in validations)
        {
            if (rule.Condition)
                invalidSavedSearchException.UpsertDataList(parameter, rule.Message);
        }

        invalidSavedSearchException.ThrowIfContainsErrors();
    }
}
