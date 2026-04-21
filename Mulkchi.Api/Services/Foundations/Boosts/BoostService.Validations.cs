using Mulkchi.Api.Models.Foundations.Boosts;
using System;

namespace Mulkchi.Api.Services.Foundations.Boosts;

public partial class BoostService
{
    private static void ValidateBoostOnAdd(Boost boost)
    {
        if (boost is null)
            throw new ArgumentNullException(nameof(boost));

        if (boost.PropertyId == Guid.Empty)
            throw new ArgumentException("PropertyId is required.", nameof(boost));

        if (boost.UserId == Guid.Empty)
            throw new ArgumentException("UserId is required.", nameof(boost));

        if (boost.Amount <= 0)
            throw new ArgumentException("Amount must be greater than zero.", nameof(boost));

        if (boost.EndDate <= boost.StartDate)
            throw new ArgumentException("EndDate must be after StartDate.", nameof(boost));
    }

    private static void ValidateBoostOnModify(Boost boost)
    {
        if (boost is null)
            throw new ArgumentNullException(nameof(boost));

        if (boost.Id == Guid.Empty)
            throw new ArgumentException("Id is required.", nameof(boost));

        ValidateBoostOnAdd(boost);
    }

    private static void ValidateBoostId(Guid id)
    {
        if (id == Guid.Empty)
            throw new ArgumentException("Id is required.", nameof(id));
    }

    private static T TryCatch<T>(Func<T> function)
    {
        try
        {
            return function();
        }
        catch (ArgumentNullException argumentNullException)
        {
            throw new ArgumentException(argumentNullException.Message, argumentNullException);
        }
        catch (ArgumentException argumentException)
        {
            throw new ArgumentException(argumentException.Message, argumentException);
        }
        catch (Exception exception)
        {
            throw new InvalidOperationException($"An unexpected error occurred: {exception.Message}", exception);
        }
    }
}
