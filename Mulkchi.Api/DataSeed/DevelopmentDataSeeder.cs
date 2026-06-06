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

        var realListings = new[]
        {
            // Toshkent - Kvartiralar
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent", District = "Yunusobod", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 4000000m, Area = 45, Beds = 1, Baths = 1, Title = "Yunusobod 4-mavze, 1 xonali evroremont kvartira ijaraga beriladi", Desc = "Mega Planet orqasida joylashgan. Hamma sharoiti bor, faqat oilaga. Kirmashina, xolodilnik, televizor, konditsioner yangi. Makler haqi yo'q.", Lat = 41.3645, Lon = 69.2861 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent", District = "Chilonzor", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 6000000m, Area = 65, Beds = 2, Baths = 1, Title = "Chilonzor 9-kvartal, 2 xonali kvartira (Metroga yaqin)", Desc = "Chilonzor metrosiga 5 minutlik yo'l. Uy toza va ozoda. 2 ta xona, balkon 1.5x3m. Narxini yana ozgina kelishamiz.", Lat = 41.2850, Lon = 69.2030 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent", District = "Mirobod", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 1200000000m, Area = 90, Beds = 3, Baths = 2, Title = "Mirobod (Gospitalniy)da 3 xonali Elitny dom sotiladi", Desc = "Yangi qurilgan dom, 4-qavat. Evroremont qilingan, mebellari bilan birga sotiladi. Ajoyib manzara va qorovulxona mavjud.", Lat = 41.2954, Lon = 69.2804 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent", District = "Yashnobod", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 550000000m, Area = 42, Beds = 1, Baths = 1, Title = "Yashnobodda (Qorasuv) zudlik bilan 1 xonali uy sotiladi", Desc = "Qorasuv 6, 1-qavat. Podvali bor. Yaxshi remont qilingan. Pul zarurligi uchun arzon sotilyapti.", Lat = 41.3200, Lon = 69.3400 },
            
            // Toshkent - Hovlilar
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent", District = "Olmazor", Type = PropertyType.House, ListingType = ListingType.Sale, Price = 2500000000m, Area = 300, Beds = 6, Baths = 3, Title = "Qorasaroyda 3 sotiqli, 6 xonali yangi Hovli sotiladi", Desc = "Qorasaroy ko'chasi. 3 sotiq, 3 qavatli uy (Podval bilan). Pishtgan g'ishtdan qurilgan. Kadastr hujjatlari tayyor.", Lat = 41.3400, Lon = 69.2300 },
            new { Region = UzbekistanRegion.ToshkentShahar, City = "Toshkent", District = "Yakkasaroy", Type = PropertyType.House, ListingType = ListingType.Rent, Price = 15000000m, Area = 200, Beds = 4, Baths = 2, Title = "Rakat mahallada 4 xonali hovli ijaraga beriladi", Desc = "Chet ellik mehmonlarga uzoq muddatga hovli ijaraga beriladi. Basseyn va letniy kuxnyasi bor.", Lat = 41.2800, Lon = 69.2500 },

            // Dacha / Qisqa muddatli
            new { Region = UzbekistanRegion.ToshkentViloyat, City = "Bo'stonliq", District = "Chorvoq", Type = PropertyType.House, ListingType = ListingType.ShortTermRent, Price = 1500000m, Area = 400, Beds = 5, Baths = 3, Title = "Chorvoqda lyuks Dacha ijarasi (Kunlik)", Desc = "Oilaviy dam olish uchun mukammal joy. Qishgi va yozgi basseyn, bilyard, sauna, stol tennisi mavjud. Narx dam olish kunlari o'zgaradi.", Lat = 41.6200, Lon = 70.0200 },
            new { Region = UzbekistanRegion.ToshkentViloyat, City = "Bo'stonliq", District = "Chorvoq", Type = PropertyType.House, ListingType = ListingType.ShortTermRent, Price = 800000m, Area = 200, Beds = 3, Baths = 1, Title = "Chorvoqda arzon va shinam Dacha", Desc = "Faqat oilaga beriladi! Tapchan, toza hovuz va mangal bor. Tog' manzarasi juda chiroyli ko'rinadi.", Lat = 41.6150, Lon = 70.0100 },

            // Samarqand
            new { Region = UzbekistanRegion.Samarqand, City = "Samarqand", District = "Siyob", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 3500000m, Area = 50, Beds = 2, Baths = 1, Title = "Samarqand markazida 2 xonali uy ijarasi (Siyob bozoriga yaqin)", Desc = "Registon maydoniga 10 minutlik masofa. Talaba qizlarga yoki oilaga beriladi. O'rtacha remont.", Lat = 39.6642, Lon = 66.9797 },
            new { Region = UzbekistanRegion.Samarqand, City = "Samarqand", District = "Markaz", Type = PropertyType.House, ListingType = ListingType.Sale, Price = 900000000m, Area = 150, Beds = 4, Baths = 2, Title = "Urgut va Markaz yo'lida 2 sotiqli hovli zudlik bilan sotiladi", Desc = "Darvoza o'rnatilgan, ichi qorasuvaqdan chiqqan. Gaz, suv, svet uzluksiz. Pul zarurligi sabab arzon beriladi.", Lat = 39.6542, Lon = 66.9597 },

            // Buxoro
            new { Region = UzbekistanRegion.Buxoro, City = "Buxoro", District = "Kogon", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 420000000m, Area = 65, Beds = 3, Baths = 1, Title = "Buxoroda 3 xonali kvartira arzon narxda sotiladi", Desc = "Kogon vokzali orqasida. 1990-yilda qurilgan dom, g'ishtli. Remonti o'rtacha. Kadastr tayyor.", Lat = 39.7270, Lon = 64.4550 },

            // Xorazm
            new { Region = UzbekistanRegion.Xorazm, City = "Urganch", District = "Al-Xorazmiy", Type = PropertyType.Apartment, ListingType = ListingType.Rent, Price = 2500000m, Area = 45, Beds = 2, Baths = 1, Title = "Urganch markazida ijara uy", Desc = "UrDU universitetiga yaqin. Hamma o'quv markazlari va magazinlar atrofida joylashgan.", Lat = 41.5500, Lon = 60.6333 },

            // Namangan
            new { Region = UzbekistanRegion.Namangan, City = "Namangan", District = "Davlatobod", Type = PropertyType.House, ListingType = ListingType.Sale, Price = 750000000m, Area = 200, Beds = 5, Baths = 2, Title = "Namanganda 5 xonali hovli sotiladi", Desc = "Eski shahar tomonda, masjid yonida joylashgan hovli sotiladi. Mevali daraxtlari va garaji bor.", Lat = 41.0011, Lon = 71.6673 },

            // Farg'ona
            new { Region = UzbekistanRegion.Fargona, City = "Farg'ona", District = "Yangi", Type = PropertyType.Apartment, ListingType = ListingType.Sale, Price = 380000000m, Area = 55, Beds = 2, Baths = 1, Title = "Farg'ona shahar markazida 2 xonali uy sotiladi", Desc = "Yangi novostroykada olingan, karobka holatida (remont qilinmagan). 3-qavat.", Lat = 40.3894, Lon = 71.7870 },
            
            // Qashqadaryo
            new { Region = UzbekistanRegion.Qashqadaryo, City = "Qarshi", District = "Nasaf", Type = PropertyType.House, ListingType = ListingType.Rent, Price = 3000000m, Area = 180, Beds = 4, Baths = 1, Title = "Qarshida hovli ijaraga beriladi", Desc = "Qarshi davlat universiteti tomonda, toza, shinam hovli. Mevali daraxtlar ekilgan.", Lat = 38.8606, Lon = 65.7888 }
        };

        string[] validUnsplashIds = new[] 
        {
            "1600596542815-ffad4c1539a9", "1512917774080-9991f1c4c750", "1600607686527-6fb886090705",
            "1580587771525-78b9dba3b914", "1564013799919-ab600027ffc6", "1449844908441-8829872d2607",
            "1600585154340-be6161a56a0c", "1600566752355-325b9021d0b0", "1600210491369-eaea3650bc23",
            "1484154218962-a197022b5858", "1522708323590-d24dbb6b0267", "1497362943212-0b9f0fcd6cc9"
        };

        var properties = new List<Property>();
        for (int i = existingCount; i < NewTargetPropertyCount; i++)
        {
            var template = realListings[i % realListings.Length];
            Guid propertyId = Guid.NewGuid();

            string photoId = validUnsplashIds[i % validUnsplashIds.Length];
            string demoImgUrl = $"https://images.unsplash.com/photo-{photoId}?auto=format&fit=crop&w=800&q=80";

            decimal? monthlyRent = template.ListingType == ListingType.Rent ? template.Price + (i % 5) * 500000m : null;
            decimal? salePrice = template.ListingType == ListingType.Sale ? template.Price + (i % 7) * 20000000m : null;
            decimal? pricePerNight = template.ListingType == ListingType.ShortTermRent ? template.Price + (i % 3) * 100000m : null;

            properties.Add(new Property
            {
                Id = propertyId,
                Title = template.Title,
                Description = template.Desc,
                Type = template.Type,
                Category = template.Type == PropertyType.Office ? PropertyCategory.Commercial : PropertyCategory.Residential,
                Status = PropertyStatus.Active,
                ListingType = template.ListingType,
                MonthlyRent = monthlyRent,
                SalePrice = salePrice,
                PricePerNight = pricePerNight,
                Price = salePrice ?? monthlyRent ?? pricePerNight ?? 0,
                SecurityDeposit = template.ListingType == ListingType.Rent ? monthlyRent * 1.5m : null,
                Area = template.Area + (i % 3) * 5,
                NumberOfBedrooms = template.Beds,
                NumberOfBathrooms = template.Baths,
                MaxGuests = template.Beds * 2,
                Region = template.Region,
                City = template.City,
                District = template.District,
                Address = $"{template.District} ko'chasi {10 + (i % 40)}",
                Mahalla = "Markaz",
                Latitude = template.Lat + (i % 10) * 0.005,
                Longitude = template.Lon + (i % 10) * 0.005,
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
                IsRenovated = i % 4 != 0,
                HasAirConditioning = i % 3 != 0,
                HasHeating = true,
                HasWasher = i % 2 == 0,
                HasKitchen = true,
                HasTV = i % 2 == 0,
                HasWorkspace = i % 5 == 0,
                IsSelfCheckIn = template.ListingType == ListingType.ShortTermRent,
                IsChildFriendly = true,
                IsAccessible = i % 7 == 0,
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
