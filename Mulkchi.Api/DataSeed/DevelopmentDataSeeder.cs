using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Bookings;
using Mulkchi.Api.Models.Foundations.Discounts;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.Reviews;
using Mulkchi.Api.Models.Foundations.PropertyImages;
using Mulkchi.Api.Models.Foundations.Users;

namespace Mulkchi.Api.DataSeed;

public static class DevelopmentDataSeeder
{
    private const int TargetUserCount = 10;
    private const int TargetPropertyCount = 20;
    private const int TargetBookingCount = 15;
    private const int TargetReviewCount = 10;
    private const int TargetDiscountCount = 5;

    public static async Task SeedAsync(WebApplication app)
    {
        if (!app.Environment.IsDevelopment()) return;
        await SeedInternalAsync(app.Services);
    }

    public static async Task SeedProductionAsync(IServiceProvider services)
    {
        await SeedInternalAsync(services);
    }

    private static async Task SeedInternalAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IStorageBroker>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>()
            .CreateLogger("DevelopmentDataSeeder");
        var now = DateTimeOffset.UtcNow;

        List<User> existingUsers = await db.SelectAllUsers().ToListAsync();
        var usersToAdd = CreateUsersToAdd(existingUsers, now);
        foreach (User user in usersToAdd)
        {
            await db.InsertUserAsync(user);
        }

        existingUsers = await db.SelectAllUsers().ToListAsync();
        List<User> hosts = existingUsers.Where(user => user.Role is UserRole.Host or UserRole.Admin).ToList();
        List<User> guests = existingUsers.Where(user => user.Role == UserRole.Guest).ToList();

        if (hosts.Count == 0 || guests.Count == 0)
        {
            logger.LogWarning("Skipping development seed because host/guest users are not available.");
            return;
        }

        List<Property> existingProperties = await db.SelectAllProperties().ToListAsync();
        var propertiesToAdd = CreatePropertiesToAdd(existingProperties.Count, hosts, now);
        foreach (Property property in propertiesToAdd)
        {
            await db.InsertPropertyAsync(property);
        }

        List<Property> properties = await db.SelectAllProperties().ToListAsync();

        int existingBookings = await db.SelectAllBookings().CountAsync();
        var bookingsToAdd = CreateBookingsToAdd(existingBookings, properties, guests, now);
        foreach (Booking booking in bookingsToAdd)
        {
            await db.InsertBookingAsync(booking);
        }

        int existingReviews = await db.SelectAllReviews().CountAsync();
        var reviewsToAdd = CreateReviewsToAdd(existingReviews, properties, guests, now);
        foreach (Review review in reviewsToAdd)
        {
            await db.InsertReviewAsync(review);
        }

        int existingDiscounts = await db.SelectAllDiscounts().CountAsync();
        var discountsToAdd = CreateDiscountsToAdd(existingDiscounts, properties, guests, now);
        foreach (Discount discount in discountsToAdd)
        {
            await db.InsertDiscountAsync(discount);
        }

        logger.LogInformation(
            "Development seed completed. Added Users={Users}, Properties={Properties}, Bookings={Bookings}, Reviews={Reviews}, Discounts={Discounts}",
            usersToAdd.Count,
            propertiesToAdd.Count,
            bookingsToAdd.Count,
            reviewsToAdd.Count,
            discountsToAdd.Count);
    }

    private static List<User> CreateUsersToAdd(IReadOnlyList<User> existingUsers, DateTimeOffset now)
    {
        int existingCount = existingUsers.Count;
        if (existingCount >= TargetUserCount)
        {
            return new List<User>();
        }

        var templates = new[]
        {
            new { FirstName = "Aziz", LastName = "Karimov", Role = UserRole.Admin, Badge = HostBadge.PremiumHost, Gender = Gender.Male, Language = "uz" },
            new { FirstName = "Dilnoza", LastName = "Rasulova", Role = UserRole.Host, Badge = HostBadge.SuperHost, Gender = Gender.Female, Language = "uz" },
            new { FirstName = "Bekzod", LastName = "Umarov", Role = UserRole.Host, Badge = HostBadge.SuperHost, Gender = Gender.Male, Language = "ru" },
            new { FirstName = "Malika", LastName = "Saidova", Role = UserRole.Host, Badge = HostBadge.NewHost, Gender = Gender.Female, Language = "en" },
            new { FirstName = "Javohir", LastName = "Nazarov", Role = UserRole.Guest, Badge = HostBadge.None, Gender = Gender.Male, Language = "uz" },
            new { FirstName = "Madina", LastName = "Tursunova", Role = UserRole.Guest, Badge = HostBadge.None, Gender = Gender.Female, Language = "ru" },
            new { FirstName = "Sardor", LastName = "Ismoilov", Role = UserRole.Guest, Badge = HostBadge.None, Gender = Gender.Male, Language = "uz" },
            new { FirstName = "Sevara", LastName = "Akbarova", Role = UserRole.Guest, Badge = HostBadge.None, Gender = Gender.Female, Language = "en" },
            new { FirstName = "Temur", LastName = "Qodirov", Role = UserRole.Guest, Badge = HostBadge.None, Gender = Gender.Male, Language = "uz" },
            new { FirstName = "Nigora", LastName = "Xolmatova", Role = UserRole.Guest, Badge = HostBadge.None, Gender = Gender.Female, Language = "ru" }
        };

        int usersNeeded = TargetUserCount - existingCount;
        var existingEmails = new HashSet<string>(
            existingUsers
                .Where(user => !string.IsNullOrWhiteSpace(user.Email))
                .Select(user => user.Email),
            StringComparer.OrdinalIgnoreCase);
        var existingPhones = new HashSet<string>(
            existingUsers
                .Where(user => !string.IsNullOrWhiteSpace(user.Phone))
                .Select(user => user.Phone),
            StringComparer.OrdinalIgnoreCase);

        var users = new List<User>();
        for (int i = 0; i < templates.Length && users.Count < usersNeeded; i++)
        {
            var template = templates[i];
            string email = $"{template.FirstName.ToLowerInvariant()}.{template.LastName.ToLowerInvariant()}@demo.mulkchi.uz";
            if (existingEmails.Contains(email))
            {
                continue;
            }

            users.Add(new User
            {
                Id = Guid.NewGuid(),
                FirstName = template.FirstName,
                LastName = template.LastName,
                Email = email,
                Phone = GenerateUniqueDemoPhone(existingCount + users.Count, existingPhones),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo12345!"),
                AvatarUrl = string.Empty,
                Bio = "Mulkchi demo foydalanuvchisi",
                Address = "O'zbekiston",
                DateOfBirth = now.AddYears(-24 - i),
                Gender = template.Gender,
                IsVerified = true,
                Role = template.Role,
                Badge = template.Badge,
                Rating = 4.5m + (i % 4) * 0.1m,
                ResponseRate = 86 + i,
                ResponseTimeMinutes = 15 + (i * 3),
                TotalListings = template.Role == UserRole.Host || template.Role == UserRole.Admin ? 3 + (i % 3) : 0,
                TotalBookings = template.Role == UserRole.Guest ? 1 + (i % 4) : 0,
                HostSince = template.Role == UserRole.Host || template.Role == UserRole.Admin ? now.AddYears(-1).AddMonths(-i) : null,
                PreferredLanguage = template.Language,
                CreatedDate = now,
                UpdatedDate = now
            });
        }

        return users;
    }

    private static string GenerateUniqueDemoPhone(int templateIndex, HashSet<string> existingPhones)
    {
        int candidateIndex = templateIndex;
        string phone = GenerateDemoPhone(candidateIndex);
        while (existingPhones.Contains(phone))
        {
            candidateIndex++;
            phone = GenerateDemoPhone(candidateIndex);
        }

        existingPhones.Add(phone);
        return phone;
    }

    private static string GenerateDemoPhone(int index) =>
        $"+99890{(1000000 + index * 733):0000000}";

    private static List<Property> CreatePropertiesToAdd(int existingCount, IReadOnlyList<User> hosts, DateTimeOffset now)
    {
        const int NewTargetPropertyCount = 100;

        if (existingCount >= NewTargetPropertyCount)
        {
            return new List<Property>();
        }

                var realListings = new[]
        {
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Mirobod", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 125000m, Area = 70, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Mirobodda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Mirobod", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 850m, Area = 65, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Mirobodda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Mirobod", Type = PropertyType.Apartment, ListingType = ListingType.ShortTermRent, Price = 45m, Area = 50, Beds = 1, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Mirobodda 1 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Yakkasaroy", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 132000m, Area = 110, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.ShellAndCore, Title = "Yakkasaroyda 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Yakkasaroy", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 550m, Area = 85, Beds = 3, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.Average, Title = "Yakkasaroyda 3 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Yakkasaroy", Type = PropertyType.Apartment, ListingType = ListingType.ShortTermRent, Price = 55m, Area = 60, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Yakkasaroyda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Yunusobod", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 74000m, Area = 78, Beds = 3, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.Average, Title = "Yunusobodda 3 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Yunusobod", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 350m, Area = 50, Beds = 2, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.Average, Title = "Yunusobodda 2 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Yunusobod", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 170000m, Area = 120, Beds = 4, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Yunusobodda 4 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Chilonzor", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 43000m, Area = 42, Beds = 1, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.Average, Title = "Chilonzorda 1 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Chilonzor", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 300m, Area = 58, Beds = 2, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.ShellAndCore, Title = "Chilonzorda 2 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Chilonzor", Type = PropertyType.Apartment, ListingType = ListingType.ShortTermRent, Price = 30m, Area = 60, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Chilonzorda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Shayxontohur", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 135000m, Area = 90, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Shayxontohurda 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Shayxontohur", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 700m, Area = 100, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Shayxontohurda 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Olmazor", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 126000m, Area = 120, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Olmazorda 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Olmazor", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 155000m, Area = 120, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Olmazorda 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Olmazor", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 650m, Area = 120, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Olmazorda 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Olmazor", Type = PropertyType.Apartment, ListingType = ListingType.ShortTermRent, Price = 40m, Area = 120, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Olmazorda 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Olmazor", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 53000m, Area = 65, Beds = 2, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.Average, Title = "Olmazorda 2 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Sergeli", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 58000m, Area = 68, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Sergelida 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Sergeli", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 350m, Area = 72, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Sergelida 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Uchtepa", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 49000m, Area = 52, Beds = 2, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.Average, Title = "Uchtepada 2 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Yashnobod", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 76500m, Area = 85, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.ShellAndCore, Title = "Yashnobodda 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Mirzo Ulug'bek", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 220000m, Area = 140, Beds = 4, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Mirzo Ulug'bekda 4 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Mirzo Ulug'bek", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 900m, Area = 90, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Mirzo Ulug'bekda 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Samarqand, City = "Samarqand", District = "Samarqand", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 56000m, Area = 70, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Samarqandda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Samarqand, City = "Samarqand", District = "Samarqand", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 95000m, Area = 100, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Samarqandda 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Samarqand, City = "Samarqand", District = "Samarqand", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 350m, Area = 60, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Samarqandda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Samarqand, City = "Samarqand", District = "Samarqand", Type = PropertyType.Apartment, ListingType = ListingType.ShortTermRent, Price = 35m, Area = 55, Beds = 1, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Samarqandda 1 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Samarqand, City = "Samarqand", District = "Pastdarg'om", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 26000m, Area = 65, Beds = 2, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.Average, Title = "Pastdarg'omda 2 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Samarqand, City = "Samarqand", District = "Bulung'ur", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 22000m, Area = 75, Beds = 3, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.ShellAndCore, Title = "Bulung'urda 3 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Samarqand, City = "Samarqand", District = "Urgut", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 48000m, Area = 90, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Urgutda 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Buxoro, City = "Buxoro", District = "Buxoro", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 44000m, Area = 68, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Buxoroda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Buxoro, City = "Buxoro", District = "Buxoro", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 76000m, Area = 95, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Buxoroda 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Buxoro, City = "Buxoro", District = "Buxoro", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 250m, Area = 55, Beds = 2, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.Average, Title = "Buxoroda 2 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Buxoro, City = "Buxoro", District = "Buxoro", Type = PropertyType.Apartment, ListingType = ListingType.ShortTermRent, Price = 30m, Area = 50, Beds = 1, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Buxoroda 1 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Buxoro, City = "Buxoro", District = "G'ijduvon", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 36000m, Area = 80, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "G'ijduvonda 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentViloyat, City = "Toshkent vil.", District = "Chirchiq", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 28000m, Area = 50, Beds = 2, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.Average, Title = "Chirchiqda 2 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentViloyat, City = "Toshkent vil.", District = "Chirchiq", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 180m, Area = 50, Beds = 2, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.Average, Title = "Chirchiqda 2 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentViloyat, City = "Toshkent vil.", District = "Angren", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 15000m, Area = 60, Beds = 2, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.ShellAndCore, Title = "Angrenda 2 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentViloyat, City = "Toshkent vil.", District = "Qibray", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 63000m, Area = 90, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Qibrayda 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentViloyat, City = "Toshkent vil.", District = "Zangiota", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 54000m, Area = 72, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Zangiotada 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentViloyat, City = "Toshkent vil.", District = "Bo'stonliq (Chorvoq)", Type = PropertyType.Apartment, ListingType = ListingType.ShortTermRent, Price = 60m, Area = 80, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Bo'stonliq (Chorvoq)da 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Fargona, City = "Farg'ona", District = "Farg'ona", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 36000m, Area = 65, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Farg'onada 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Fargona, City = "Farg'ona", District = "Farg'ona", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 58000m, Area = 90, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Farg'onada 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Fargona, City = "Farg'ona", District = "Farg'ona", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 200m, Area = 55, Beds = 2, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.Average, Title = "Farg'onada 2 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Fargona, City = "Farg'ona", District = "Qo'qon", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 38000m, Area = 70, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Qo'qonda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Fargona, City = "Farg'ona", District = "Qo'qon", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 220m, Area = 60, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Qo'qonda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Fargona, City = "Farg'ona", District = "Marg'ilon", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 24000m, Area = 62, Beds = 2, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.Average, Title = "Marg'ilonda 2 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Fargona, City = "Farg'ona", District = "Rishton", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 18000m, Area = 70, Beds = 3, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.ShellAndCore, Title = "Rishtonda 3 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Andijon, City = "Andijon", District = "Andijon", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 39500m, Area = 68, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Andijonda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Andijon, City = "Andijon", District = "Andijon", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 65000m, Area = 100, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Andijonda 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Andijon, City = "Andijon", District = "Andijon", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 250m, Area = 60, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Andijonda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Andijon, City = "Andijon", District = "Asaka", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 27000m, Area = 62, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Asakada 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Andijon, City = "Andijon", District = "Shahrixon", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 25000m, Area = 75, Beds = 3, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.Average, Title = "Shahrixonda 3 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Namangan, City = "Namangan", District = "Namangan", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 37000m, Area = 72, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Namanganda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Namangan, City = "Namangan", District = "Namangan", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 57000m, Area = 95, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Namanganda 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Namangan, City = "Namangan", District = "Namangan", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 180m, Area = 58, Beds = 2, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.Average, Title = "Namanganda 2 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Namangan, City = "Namangan", District = "Chust", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 22000m, Area = 70, Beds = 3, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.Average, Title = "Chustda 3 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Xorazm, City = "Xorazm", District = "Urganch", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 35000m, Area = 64, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Urganchda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Xorazm, City = "Xorazm", District = "Urganch", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 55000m, Area = 90, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Urganchda 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Xorazm, City = "Xorazm", District = "Urganch", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 220m, Area = 60, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Urganchda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Xorazm, City = "Xorazm", District = "Xiva", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 33000m, Area = 55, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Xivada 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Xorazm, City = "Xorazm", District = "Xiva", Type = PropertyType.Apartment, ListingType = ListingType.ShortTermRent, Price = 28m, Area = 50, Beds = 1, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Xivada 1 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Navoiy, City = "Navoiy", District = "Navoiy", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 41000m, Area = 68, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Navoiyda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Navoiy, City = "Navoiy", District = "Navoiy", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 62000m, Area = 88, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Navoiyda 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Navoiy, City = "Navoiy", District = "Navoiy", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 280m, Area = 60, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Navoiyda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Navoiy, City = "Navoiy", District = "Zarafshon", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 32000m, Area = 62, Beds = 2, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.Average, Title = "Zarafshonda 2 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Qashqadaryo, City = "Qashqadaryo", District = "Qarshi", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 31000m, Area = 72, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Qarshida 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Qashqadaryo, City = "Qashqadaryo", District = "Qarshi", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 51000m, Area = 105, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Qarshida 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Qashqadaryo, City = "Qashqadaryo", District = "Qarshi", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 150m, Area = 60, Beds = 2, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.Average, Title = "Qarshida 2 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Qashqadaryo, City = "Qashqadaryo", District = "Shahrisabz", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 28000m, Area = 68, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Shahrisabzda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Qashqadaryo, City = "Qashqadaryo", District = "Shahrisabz", Type = PropertyType.Apartment, ListingType = ListingType.ShortTermRent, Price = 20m, Area = 60, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Shahrisabzda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Surxondaryo, City = "Surxondaryo", District = "Termiz", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 32000m, Area = 70, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Termizda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Surxondaryo, City = "Surxondaryo", District = "Termiz", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 53000m, Area = 98, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Termizda 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Surxondaryo, City = "Surxondaryo", District = "Termiz", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 170m, Area = 62, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Termizda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Surxondaryo, City = "Surxondaryo", District = "Denov", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 34000m, Area = 75, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Denovda 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Jizzax, City = "Jizzax", District = "Jizzax", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 29000m, Area = 68, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Jizzaxda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Jizzax, City = "Jizzax", District = "Jizzax", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 46000m, Area = 90, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Jizzaxda 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Jizzax, City = "Jizzax", District = "Jizzax", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 140m, Area = 58, Beds = 2, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.Average, Title = "Jizzaxda 2 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Sirdaryo, City = "Sirdaryo", District = "Guliston", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 27000m, Area = 65, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Gulistonda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Sirdaryo, City = "Sirdaryo", District = "Guliston", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 43000m, Area = 88, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Gulistonda 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Sirdaryo, City = "Sirdaryo", District = "Guliston", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 130m, Area = 55, Beds = 2, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.Average, Title = "Gulistonda 2 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Sirdaryo, City = "Sirdaryo", District = "Shirin", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 12000m, Area = 60, Beds = 2, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.ShellAndCore, Title = "Shirinda 2 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Qoraqalpogiston, City = "Qoraqalpog'iston", District = "Nukus", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 30000m, Area = 70, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Nukusda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Qoraqalpogiston, City = "Qoraqalpog'iston", District = "Nukus", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 49000m, Area = 100, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Nukusda 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Qoraqalpogiston, City = "Qoraqalpog'iston", District = "Nukus", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 150m, Area = 60, Beds = 2, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.Average, Title = "Nukusda 2 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Qoraqalpogiston, City = "Qoraqalpog'iston", District = "Qo'ng'irot", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 16000m, Area = 68, Beds = 2, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.Average, Title = "Qo'ng'irotda 2 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Bektemir", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 46000m, Area = 58, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Bektemirda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Sergeli", Type = PropertyType.Apartment, ListingType = ListingType.ShortTermRent, Price = 25m, Area = 52, Beds = 1, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Sergelida 1 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent sh.", District = "Yashnobod", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 400m, Area = 62, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Yashnobodda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Samarqand, City = "Samarqand", District = "Samarqand", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 115000m, Area = 120, Beds = 4, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Samarqandda 4 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Buxoro, City = "Buxoro", District = "Buxoro", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 96000m, Area = 120, Beds = 4, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.EuroLux, Title = "Buxoroda 4 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Fargona, City = "Farg'ona", District = "Marg'ilon", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 170m, Area = 65, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Marg'ilonda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Namangan, City = "Namangan", District = "Namangan", Type = PropertyType.Apartment, ListingType = ListingType.ShortTermRent, Price = 20m, Area = 50, Beds = 1, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Namanganda 1 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Andijon, City = "Andijon", District = "Xonobod", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 21000m, Area = 70, Beds = 2, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.Average, Title = "Xonobodda 2 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Xorazm, City = "Xorazm", District = "Urganch", Type = PropertyType.Apartment, ListingType = ListingType.ShortTermRent, Price = 22m, Area = 65, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Urganchda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Navoiy, City = "Navoiy", District = "Karmana", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 28000m, Area = 72, Beds = 3, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.ShellAndCore, Title = "Karmanada 3 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Qashqadaryo, City = "Qashqadaryo", District = "Kitob", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 24000m, Area = 80, Beds = 3, Baths = 1, BuildingType = BuildingType.OldBuilding, RenovationLevel = RenovationLevel.Average, Title = "Kitobda 3 xonali OldBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
            new { Region = UzbekistanRegion.Surxondaryo, City = "Surxondaryo", District = "Qumqo'rg'on", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 22000m, Area = 70, Beds = 2, Baths = 1, BuildingType = BuildingType.NewBuilding, RenovationLevel = RenovationLevel.Average, Title = "Qumqo'rg'onda 2 xonali NewBuilding uy", Desc = "Yaxshi joylashuv", Lat = 41.3, Lon = 69.2 },
        };

        string[] validUnsplashIds = new[] 
        {
            "1600596542815-ffad4c1539a9", "1512917774080-9991f1c4c750", "1600607686527-6fb886090705",
            "1580587771525-78b9dba3b914", "1564013799919-ab600027ffc6", "1449844908441-8829872d2607",
            "1600585154340-be6161a56a0c", "1600566752355-325b9021d0b0", "1600210491369-eaea3650bc23",
            "1484154218962-a197022b5858", "1522708323590-d24dbb6b0267", "1497362943212-0b9f0fcd6cc9"
        };

        var random = new Random();
        var properties = new List<Property>();
        for (int i = existingCount; i < NewTargetPropertyCount; i++)
        {
            var template = realListings[i % realListings.Length];
            Guid propertyId = Guid.NewGuid();

            string photoId = validUnsplashIds[i % validUnsplashIds.Length];
            string demoImgUrl = $"https://images.unsplash.com/photo-{photoId}?auto=format&fit=crop&w=800&q=80";

            decimal? monthlyRent = template.ListingType == ListingType.Rent ? template.Price + (i % 5) * 50m : null;
            decimal? salePrice = template.ListingType == ListingType.Sale ? template.Price + (i % 7) * 2000m : null;
            decimal? pricePerNight = template.ListingType == ListingType.ShortTermRent ? template.Price + (i % 3) * 5m : null;

            properties.Add(new Property
            {
                Id = propertyId,
                Title = template.Title,
                Description = template.Desc,
                Type = template.Type,
                Category = template.Type == PropertyType.Office ? PropertyCategory.Commercial : PropertyCategory.Residential,
                Status = PropertyStatus.Active,
                ListingType = template.ListingType,
                MonthlyRent = monthlyRent * 12600m,
                SalePrice = salePrice * 12600m,
                PricePerNight = pricePerNight * 12600m,
                Price = (salePrice ?? monthlyRent ?? pricePerNight ?? 0) * 12600m,
                SecurityDeposit = template.ListingType == ListingType.Rent ? monthlyRent * 12600m * 1.5m : null,
                Area = template.Area + (i % 3) * 5,
                NumberOfBedrooms = template.Beds,
                NumberOfBathrooms = template.Baths,
                MaxGuests = template.Beds * 2,
                Region = template.Region,
                City = template.City,
                District = template.District,
                Address = $"{template.District} ko'chasi {10 + (i % 40)}",
                Mahalla = "Markaz",
                Latitude = template.Lat + (random.NextDouble() - 0.5) * 0.15,
                Longitude = template.Lon + (random.NextDouble() - 0.5) * 0.15,
                HasWifi = i % 2 == 0,
                HasParking = i % 3 != 0,
                HasPool = template.Type == PropertyType.House && i % 4 == 0,
                PetsAllowed = i % 5 == 0,
                IsInstantBook = template.ListingType == ListingType.ShortTermRent,
                IsVacant = true,
                IsFeatured = i % 6 == 0,
                IsVerified = true,
                HasMetroNearby = template.City == "Toshkent",
                HasBusStop = true,
                HasMarketNearby = true,
                HasSchoolNearby = true,
                HasHospitalNearby = i % 2 == 0,
                DistanceToCityCenter = 1.0 + (i % 8) * 0.5,
                HasElevator = template.Type == PropertyType.Apartment && i % 2 == 0,
                HasSecurity = template.Type == PropertyType.Office || (template.Type == PropertyType.Apartment && i % 4 == 0),
                HasGenerator = i % 10 == 0,
                HasGas = true,
                HasFurniture = template.ListingType != ListingType.Sale || i % 3 == 0,
                IsRenovated = template.RenovationLevel != RenovationLevel.ShellAndCore,
                HasAirConditioning = i % 3 != 0,
                HasHeating = true,
                HasWasher = i % 2 == 0,
                HasKitchen = true,
                HasTV = i % 2 == 0,
                HasWorkspace = i % 5 == 0,
                IsSelfCheckIn = template.ListingType == ListingType.ShortTermRent,
                IsChildFriendly = true,
                IsAccessible = i % 7 == 0,
                BuildingType = template.BuildingType,
                RenovationLevel = template.RenovationLevel,
                Currency = Currency.UZS,
                ExchangeRate = 1.0m,
                HostId = hosts[i % hosts.Count].Id,
                AverageRating = 4.0m + (i % 10) * 0.1m,
                ViewsCount = 50 + (i * 123) % 400,
                FavoritesCount = 5 + (i * 7) % 50,
                CreatedDate = now.AddDays(-i),
                UpdatedDate = now,
                Images = new List<PropertyImage>
                {
                    new PropertyImage
                    {
                        Id = Guid.NewGuid(),
                        PropertyId = propertyId,
                        Url = demoImgUrl,
                        ThumbnailUrl = demoImgUrl,
                        MediumUrl = demoImgUrl,
                        IsPrimary = true,
                        SortOrder = 0,
                        CreatedDate = now,
                        UpdatedDate = now
                    }
                }
            });
        }

        return properties;
    }

    private static List<Booking> CreateBookingsToAdd(int existingCount, IReadOnlyList<Property> properties, IReadOnlyList<User> guests, DateTimeOffset now)
    {
        if (existingCount >= TargetBookingCount || properties.Count == 0)
        {
            return new List<Booking>();
        }

        var bookings = new List<Booking>();
        for (int i = existingCount; i < TargetBookingCount; i++)
        {
            Property property = properties[i % properties.Count];
            User guest = guests[i % guests.Count];
            DateTimeOffset checkIn = new DateTimeOffset(now.UtcDateTime.Date, TimeSpan.Zero).AddDays(i - 5);
            DateTimeOffset checkOut = checkIn.AddDays(2 + (i % 4));
            decimal totalPrice = property.ListingType switch
            {
                ListingType.ShortTermRent => (property.PricePerNight ?? 50m) * (checkOut - checkIn).Days,
                ListingType.Rent => property.MonthlyRent ?? 500m,
                _ => (property.SalePrice ?? 60000m) * 0.02m
            };

            bookings.Add(new Booking
            {
                Id = Guid.NewGuid(),
                PropertyId = property.Id,
                GuestId = guest.Id,
                CheckInDate = checkIn,
                CheckOutDate = checkOut,
                NumberOfGuests = Math.Min(property.MaxGuests, 1 + (i % 4)),
                TotalPrice = Math.Round(totalPrice, 2),
                Status = i % 5 == 0 ? BookingStatus.Pending : i % 4 == 0 ? BookingStatus.Cancelled : BookingStatus.Confirmed,
                Notes = "Demo booking ma'lumoti",
                CreatedDate = now.AddDays(-i),
                UpdatedDate = now
            });
        }

        return bookings;
    }

    private static List<Review> CreateReviewsToAdd(int existingCount, IReadOnlyList<Property> properties, IReadOnlyList<User> guests, DateTimeOffset now)
    {
        if (existingCount >= TargetReviewCount || properties.Count == 0)
        {
            return new List<Review>();
        }

        var reviews = new List<Review>();
        for (int i = existingCount; i < TargetReviewCount; i++)
        {
            decimal rating = 4.0m + (i % 5) * 0.2m;
            reviews.Add(new Review
            {
                Id = Guid.NewGuid(),
                OverallRating = rating,
                CleanlinessRating = rating,
                LocationRating = rating,
                ValueRating = rating - 0.1m,
                CommunicationRating = rating,
                AccuracyRating = rating,
                Comment = "Demo sharh: joylashuv qulay va mezbon tez javob beradi.",
                IsVerifiedStay = true,
                HostResponse = "Rahmat, yana kutib qolamiz.",
                HostRespondedAt = now.AddDays(-(i % 3)),
                ReviewerId = guests[i % guests.Count].Id,
                PropertyId = properties[i % properties.Count].Id,
                HomeRequestId = null,
                CreatedDate = now.AddDays(-i),
                UpdatedDate = now
            });
        }

        return reviews;
    }

    private static List<Discount> CreateDiscountsToAdd(int existingCount, IReadOnlyList<Property> properties, IReadOnlyList<User> guests, DateTimeOffset now)
    {
        if (existingCount >= TargetDiscountCount)
        {
            return new List<Discount>();
        }

        var discounts = new List<Discount>();
        for (int i = existingCount; i < TargetDiscountCount; i++)
        {
            DiscountTarget target = i % 3 == 0
                ? DiscountTarget.AllProperties
                : i % 3 == 1
                    ? DiscountTarget.SpecificProperty
                    : DiscountTarget.SpecificUser;

            discounts.Add(new Discount
            {
                Id = Guid.NewGuid(),
                Code = $"DEMO{i + 1:00}",
                Description = "Demo kampaniya chegirmasi",
                Type = i % 2 == 0 ? DiscountType.Percentage : DiscountType.FixedAmount,
                Target = target,
                Value = i % 2 == 0 ? 10 + i : 12 + i,
                MaxDiscountAmount = i % 2 == 0 ? 40 + i * 5 : null,
                MaxUsageCount = 100,
                UsageCount = 0,
                StartsAt = now.AddDays(-2),
                ExpiresAt = now.AddMonths(2),
                IsActive = true,
                PropertyId = target == DiscountTarget.SpecificProperty && properties.Count > 0
                    ? properties[i % properties.Count].Id
                    : null,
                UserId = target == DiscountTarget.SpecificUser && guests.Count > 0
                    ? guests[i % guests.Count].Id
                    : null,
                CreatedDate = now,
                UpdatedDate = now
            });
        }

        return discounts;
    }
}
