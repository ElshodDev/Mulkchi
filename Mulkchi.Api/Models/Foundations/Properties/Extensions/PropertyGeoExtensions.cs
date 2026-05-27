using System;
using System.Linq;
using Mulkchi.Api.Models.Foundations.Properties;

namespace Mulkchi.Api.Models.Foundations.Properties.Extensions;

public static class PropertyGeoExtensions
{
    private const double EarthRadiusKm = 6371.0;

    public static double DistanceKm(
        double latitude1,
        double longitude1,
        double latitude2,
        double longitude2)
    {
        double dLat = DegreesToRadians(latitude2 - latitude1);
        double dLon = DegreesToRadians(longitude2 - longitude1);

        double a =
            Math.Sin(dLat / 2.0) * Math.Sin(dLat / 2.0) +
            Math.Cos(DegreesToRadians(latitude1)) * Math.Cos(DegreesToRadians(latitude2)) *
            Math.Sin(dLon / 2.0) * Math.Sin(dLon / 2.0);

        double c = 2.0 * Math.Asin(Math.Sqrt(a));

        return EarthRadiusKm * c;
    }

    public static IQueryable<Property> WithinRadius(
        this IQueryable<Property> properties,
        double latitude,
        double longitude,
        double radiusInKm)
    {
        double latDelta = radiusInKm / 111.0;
        double lonDelta = radiusInKm / (111.0 * Math.Cos(latitude * Math.PI / 180.0));

        double minLat = latitude - latDelta;
        double maxLat = latitude + latDelta;
        double minLon = longitude - lonDelta;
        double maxLon = longitude + lonDelta;

        return properties.Where(p =>
            p.Latitude.HasValue && p.Longitude.HasValue &&
            p.Latitude >= minLat && p.Latitude <= maxLat &&
            p.Longitude >= minLon && p.Longitude <= maxLon);
    }

    public static IQueryable<Property> OrderByDistance(
        this IQueryable<Property> properties,
        double latitude,
        double longitude)
    {
        return properties
            .Where(p => p.Latitude.HasValue && p.Longitude.HasValue)
            .OrderBy(p =>
                (p.Latitude!.Value - latitude) * (p.Latitude!.Value - latitude) +
                (p.Longitude!.Value - longitude) * (p.Longitude!.Value - longitude));
    }

    private static double DegreesToRadians(double degree) => degree * Math.PI / 180.0;
}