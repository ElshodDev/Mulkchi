using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.Properties.Exceptions;
using Xeptions;

namespace Mulkchi.Api.Services.Foundations.Properties;

public partial class PropertyService
{
    private void ValidatePropertyOnAdd(Property property)
    {
        ValidatePropertyIsNotNull(property);
        Validate(
        (Rule: IsInvalid(property.Title), Parameter: nameof(Property.Title)),
        (Rule: IsInvalid(property.Description), Parameter: nameof(Property.Description)),
        (Rule: IsInvalid(property.City), Parameter: nameof(Property.City)),
        (Rule: IsInvalid(property.Address), Parameter: nameof(Property.Address)),
        (Rule: IsInvalidArea(property.Area), Parameter: nameof(Property.Area)),
        (Rule: property.ListingType == ListingType.Rent ? IsInvalidMonthlyRent(property.MonthlyRent) : new { Condition = false, Message = string.Empty }, Parameter: nameof(Property.MonthlyRent)),
        (Rule: property.ListingType == ListingType.Sale ? IsInvalidSalePrice(property.SalePrice) : new { Condition = false, Message = string.Empty }, Parameter: nameof(Property.SalePrice)),
        (Rule: property.ListingType == ListingType.ShortTermRent ? IsInvalidPricePerNight(property.PricePerNight) : new { Condition = false, Message = string.Empty }, Parameter: nameof(Property.PricePerNight)),
        (Rule: IsInvalidListingType(property.ListingType), Parameter: nameof(Property.ListingType)));
    }

    private void ValidatePropertyOnModify(Property property)
    {
        ValidatePropertyIsNotNull(property);
        Validate(
        (Rule: IsInvalid(property.Id), Parameter: nameof(Property.Id)),
        (Rule: IsInvalid(property.Title), Parameter: nameof(Property.Title)),
        (Rule: IsInvalid(property.Description), Parameter: nameof(Property.Description)),
        (Rule: IsInvalid(property.City), Parameter: nameof(Property.City)),
        (Rule: IsInvalid(property.Address), Parameter: nameof(Property.Address)),
        (Rule: IsInvalidArea(property.Area), Parameter: nameof(Property.Area)),
        (Rule: IsInvalidMonthlyRent(property.MonthlyRent), Parameter: nameof(Property.MonthlyRent)),
        (Rule: IsInvalidListingType(property.ListingType), Parameter: nameof(Property.ListingType)));
    }

    private static void ValidatePropertyId(Guid propertyId)
    {
        if (propertyId == Guid.Empty)
        {
            throw new InvalidPropertyException(
                message: "Property id is invalid.");
        }
    }

    private static void ValidatePropertyIsNotNull(Property property)
    {
        if (property is null)
            throw new NullPropertyException(message: "Property is null.");
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

    private static dynamic IsInvalidArea(double area) => new
    {
        Condition = area <= 0,
        Message = "Area must be greater than 0."
    };

    private static dynamic IsInvalidMonthlyRent(decimal? monthlyRent) => new
    {
        Condition = !monthlyRent.HasValue || monthlyRent.Value <= 0,
        Message = "Monthly rent must be greater than 0."
    };

    private static dynamic IsInvalidSalePrice(decimal? salePrice) => new
    {
        Condition = !salePrice.HasValue || salePrice.Value <= 0,
        Message = "Sale price must be greater than 0."
    };

    private static dynamic IsInvalidPricePerNight(decimal? pricePerNight) => new
    {
        Condition = !pricePerNight.HasValue || pricePerNight.Value <= 0,
        Message = "Price per night must be greater than 0."
    };

    private static dynamic IsInvalidListingType(ListingType listingType) => new
    {
        Condition = !Enum.IsDefined(typeof(ListingType), listingType),
        Message = "Invalid listing type."
    };

    private void Validate(params (dynamic Rule, string Parameter)[] validations)
    {
        var invalidPropertyException =
            new InvalidPropertyException(message: "Property data is invalid.");

        foreach ((dynamic rule, string parameter) in validations)
        {
            if (rule.Condition)
                invalidPropertyException.UpsertDataList(parameter, rule.Message);
        }

        invalidPropertyException.ThrowIfContainsErrors();
    }
}
