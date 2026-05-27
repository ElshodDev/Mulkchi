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

        using var scope = app.Services.CreateScope();
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
        const int NewTargetPropertyCount = 70;

        if (existingCount >= NewTargetPropertyCount)
        {
            return new List<Property>();
        }

        var cityTemplates = new[]
        {
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent", District = "Chilonzor", Latitude = 41.2850, Longitude = 69.2030, BaseRent = 8000000m, BaseSale = 1100000000m, Metro = true },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent", District = "Yunusobod", Latitude = 41.3645, Longitude = 69.2861, BaseRent = 9000000m, BaseSale = 1300000000m, Metro = true },
            
            new { Region = UzbekistanRegion.Samarqand, City = "Samarqand", District = "Markaz", Latitude = 39.6542, Longitude = 66.9597, BaseRent = 6000000m, BaseSale = 850000000m, Metro = false },
            new { Region = UzbekistanRegion.Samarqand, City = "Samarqand", District = "Siyob", Latitude = 39.6642, Longitude = 66.9797, BaseRent = 5500000m, BaseSale = 750000000m, Metro = false },
            
            new { Region = UzbekistanRegion.Buxoro, City = "Buxoro", District = "Kogon", Latitude = 39.7670, Longitude = 64.4550, BaseRent = 5000000m, BaseSale = 700000000m, Metro = false },
            
            new { Region = UzbekistanRegion.Fargona, City = "Farg'ona", District = "Yangi", Latitude = 40.3894, Longitude = 71.7870, BaseRent = 4500000m, BaseSale = 600000000m, Metro = false },
            new { Region = UzbekistanRegion.Namangan, City = "Namangan", District = "Davlatobod", Latitude = 41.0011, Longitude = 71.6673, BaseRent = 4500000m, BaseSale = 620000000m, Metro = false },
            new { Region = UzbekistanRegion.Andijon, City = "Andijon", District = "Bobur", Latitude = 40.7821, Longitude = 72.3442, BaseRent = 4500000m, BaseSale = 580000000m, Metro = false },
            
            new { Region = UzbekistanRegion.ToshkentViloyat, City = "Chirchiq", District = "Markaz", Latitude = 41.4689, Longitude = 69.5822, BaseRent = 5000000m, BaseSale = 650000000m, Metro = false },
            new { Region = UzbekistanRegion.Qashqadaryo, City = "Qarshi", District = "Nasaf", Latitude = 38.8606, Longitude = 65.7888, BaseRent = 4000000m, BaseSale = 550000000m, Metro = false },
            new { Region = UzbekistanRegion.Xorazm, City = "Urganch", District = "Al-Xorazmiy", Latitude = 41.5500, Longitude = 60.6333, BaseRent = 4000000m, BaseSale = 550000000m, Metro = false },
            new { Region = UzbekistanRegion.Navoiy, City = "Navoiy", District = "Karmana", Latitude = 40.0844, Longitude = 65.3792, BaseRent = 4500000m, BaseSale = 600000000m, Metro = false },
            
            new { Region = UzbekistanRegion.Jizzax, City = "Jizzax", District = "Sharof Rashidov", Latitude = 40.1158, Longitude = 67.8422, BaseRent = 3500000m, BaseSale = 450000000m, Metro = false },
            new { Region = UzbekistanRegion.Sirdaryo, City = "Guliston", District = "Sayxunobod", Latitude = 40.4897, Longitude = 68.7842, BaseRent = 3000000m, BaseSale = 400000000m, Metro = false },
            new { Region = UzbekistanRegion.Surxondaryo, City = "Termiz", District = "Markaz", Latitude = 37.2242, Longitude = 67.2783, BaseRent = 3500000m, BaseSale = 500000000m, Metro = false },
            new { Region = UzbekistanRegion.Qoraqalpogiston, City = "Nukus", District = "Xo'jayli", Latitude = 42.4619, Longitude = 59.6166, BaseRent = 3000000m, BaseSale = 450000000m, Metro = false }
        };

        var properties = new List<Property>();
        for (int i = existingCount; i < NewTargetPropertyCount; i++)
        {
            var city = cityTemplates[i % cityTemplates.Length];
            ListingType listingType = (ListingType)(i % 3);
            PropertyType type = i % 5 == 0 ? PropertyType.House : i % 4 == 0 ? PropertyType.Office : PropertyType.Apartment;
            bool isCommercial = type == PropertyType.Office;
            Guid propertyId = Guid.NewGuid();

            string[] validUnsplashIds = new[] 
            {
                "1600596542815-ffad4c1539a9", "1512917774080-9991f1c4c750", "1600607686527-6fb886090705",
                "1580587771525-78b9dba3b914", "1564013799919-ab600027ffc6", "1449844908441-8829872d2607",
                "1600585154340-be6161a56a0c", "1600566752355-325b9021d0b0", "1600210491369-eaea3650bc23"
            };
            string photoId = validUnsplashIds[i % validUnsplashIds.Length];
            string demoImgUrl = $"https://images.unsplash.com/photo-{photoId}?auto=format&fit=crop&w=800&q=80";

            decimal? monthlyRent = listingType == ListingType.Rent ? city.BaseRent + (i * 200000) : null;
            decimal? salePrice = listingType == ListingType.Sale ? city.BaseSale + (i * 15000000) : null;
            decimal? pricePerNight = listingType == ListingType.ShortTermRent ? 400000 + (i * 20000) : null;

            properties.Add(new Property
            {
                Id = propertyId,
                Title = $"{city.City}da {(type == PropertyType.Office ? "biznes" : "zamonaviy")} {type.ToString().ToLowerInvariant()}",
                Description = $"{city.City}, {city.District} hududida joylashgan juda qulay va barcha sharoitlarga ega mulk. BMI doirasida demo listing sifatida yaratilgan.",
                Type = type,
                Category = isCommercial ? PropertyCategory.Commercial : PropertyCategory.Residential,
                Status = PropertyStatus.Active,
                ListingType = listingType,
                MonthlyRent = monthlyRent,
                SalePrice = salePrice,
                PricePerNight = pricePerNight,
                Price = salePrice ?? monthlyRent ?? pricePerNight ?? 0,
                SecurityDeposit = listingType == ListingType.Rent ? monthlyRent * 1.5m : null,
                Area = 45 + (i % 6) * 25,
                NumberOfBedrooms = type == PropertyType.Office ? 0 : 1 + (i % 4),
                NumberOfBathrooms = 1 + (i % 3),
                MaxGuests = type == PropertyType.Office ? 8 + (i % 6) : 2 + (i % 5),
                Region = city.Region,
                City = city.City,
                District = city.District,
                Address = $"{city.District} ko'chasi {10 + i}",
                Mahalla = "Mulkchi Mahalla",
                Latitude = city.Latitude + i * 0.001,
                Longitude = city.Longitude + i * 0.001,
                HasWifi = true,
                HasParking = i % 2 == 0,
                HasPool = i % 7 == 0,
                PetsAllowed = i % 3 == 0,
                IsInstantBook = listingType == ListingType.ShortTermRent,
                IsVacant = true,
                IsFeatured = i % 6 == 0,
                IsVerified = i % 4 != 0,
                HasMetroNearby = city.Metro,
                HasBusStop = true,
                HasMarketNearby = true,
                HasSchoolNearby = !isCommercial,
                HasHospitalNearby = true,
                DistanceToCityCenter = 1.5 + (i % 8) * 1.1,
                HasElevator = type != PropertyType.House,
                HasSecurity = i % 5 == 0 || isCommercial,
                HasGenerator = i % 9 == 0,
                HasGas = !isCommercial,
                HasFurniture = i % 2 == 0,
                IsRenovated = i % 3 != 0,
                HasAirConditioning = true,
                HasHeating = true,
                HasWasher = !isCommercial,
                HasKitchen = !isCommercial,
                HasTV = !isCommercial,
                HasWorkspace = isCommercial || i % 4 == 0,
                IsSelfCheckIn = listingType == ListingType.ShortTermRent,
                IsChildFriendly = !isCommercial,
                IsAccessible = i % 5 == 0,
                Currency = Currency.UZS,
                ExchangeRate = 1.0m,
                HostId = hosts[i % hosts.Count].Id,
                AverageRating = 4.3m + (i % 6) * 0.1m,
                ViewsCount = 40 + i * 17,
                FavoritesCount = 3 + (i % 9),
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
