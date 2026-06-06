using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Properties;
using Mulkchi.Api.Models.Foundations.PropertyImages;
using Mulkchi.Api.Models.Foundations.Users;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Mulkchi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestSeederController : ControllerBase
    {
        private readonly StorageBroker _storageBroker;

        public TestSeederController(StorageBroker storageBroker)
        {
            _storageBroker = storageBroker;
        }

        [HttpPost("seed-properties")]
        public async Task<IActionResult> SeedPropertiesAsync()
        {
            var targetEmails = new[] { "elshodibadullayev28@gmail.com", "elshodibodullayev8@gmail.com" };
            var users = new List<User>();

            // 1. Find or create the users
            foreach (var email in targetEmails)
            {
                var user = await _storageBroker.Users.FirstOrDefaultAsync(u => u.Email == email);
                if (user == null)
                {
                    user = new User
                    {
                        Id = Guid.NewGuid(),
                        FirstName = "Elshod",
                        LastName = "Ibodullayev",
                        Email = email,
                        Phone = "+998901234567",
                        IsVerified = true,
                        EmailConfirmed = true,
                        Role = UserRole.Host,
                        CurrentMode = UserRole.Host,
                        PasswordHash = "SeededUserPasswordHash", // Dummy
                        CreatedDate = DateTimeOffset.UtcNow,
                        UpdatedDate = DateTimeOffset.UtcNow
                    };
                    _storageBroker.Users.Add(user);
                }
                users.Add(user);
            }
            await _storageBroker.SaveChangesAsync();

            // 2. Define regions and districts
            var locations = new Dictionary<UzbekistanRegion, string[]>
            {
                { UzbekistanRegion.ToshkentShahar, new[] { "Chilonzor", "Yunusobod", "Mirzo Ulug'bek", "Yakkasaroy", "Mirobod", "Shayxontohur" } },
                { UzbekistanRegion.Qashqadaryo, new[] { "Qamashi", "Qarshi", "Kitob", "Shahrisabz", "Yakkabog'", "G'uzor", "Koson" } },
                { UzbekistanRegion.Samarqand, new[] { "Samarqand shahar", "Urgut", "Toyloq", "Jomboy", "Oqdaryo" } },
                { UzbekistanRegion.Buxoro, new[] { "Buxoro shahar", "G'ijduvon", "Vobkent", "Kogon" } },
                { UzbekistanRegion.Fargona, new[] { "Farg'ona shahar", "Marg'ilon", "Qo'qon", "Rishton" } },
                { UzbekistanRegion.Andijon, new[] { "Andijon shahar", "Asaka", "Shahrixon" } },
                { UzbekistanRegion.Xorazm, new[] { "Urganch", "Xiva", "Xonqa" } },
            };

            var propertyImages = new[]
            {
                "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1502672260266-1c1de2d9d150?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80"
            };

            var random = new Random();
            var newProperties = new List<Property>();

            // 3. Generate properties
            foreach (var loc in locations)
            {
                var region = loc.Key;
                var districts = loc.Value;

                foreach (var district in districts)
                {
                    // Add 1 to 3 properties per district
                    int count = random.Next(1, 4);
                    for (int i = 0; i < count; i++)
                    {
                        var user = users[random.Next(users.Count)];
                        var type = (PropertyType)random.Next(0, 5); // Assuming 0-4 are valid enum types (Apartment, House, Office, Villa, Commercial)
                        var listingType = (ListingType)random.Next(0, 3); // Rent, Sale, ShortTermRent

                        var rooms = random.Next(1, 6);
                        var price = random.Next(20, 200) * 10000000m; // 200mln to 2bln

                        var property = new Property
                        {
                            Id = Guid.NewGuid(),
                            HostId = user.Id,
                            Title = $"{district}da ajoyib {type.ToString().ToLower()}",
                            Description = $"{region} viloyati, {district} tumanida joylashgan barcha qulayliklarga ega zamonaviy {type.ToString().ToLower()}. Maktab, bog'cha va bekatlarga yaqin.",
                            Region = region,
                            City = region.ToString(),
                            District = district,
                            Address = $"{district} tumani, Markaziy ko'cha, {random.Next(1, 100)}-uy",
                            Type = type,
                            ListingType = listingType,
                            Price = price,
                            SalePrice = listingType == ListingType.Sale ? price : null,
                            MonthlyRent = listingType == ListingType.Rent ? price / 100 : null,
                            PricePerNight = listingType == ListingType.ShortTermRent ? price / 3000 : null,
                            Rooms = rooms,
                            Bathrooms = random.Next(1, 3),
                            Area = random.Next(40, 300),
                            Floor = random.Next(1, 10),
                            TotalFloors = random.Next(1, 15),
                            HasWifi = random.NextDouble() > 0.3,
                            HasParking = random.NextDouble() > 0.2,
                            HasAirConditioning = random.NextDouble() > 0.4,
                            IsVacant = true,
                            Status = PropertyStatus.Active,
                            Category = PropertyCategory.Residential,
                            CreatedDate = DateTimeOffset.UtcNow,
                            UpdatedDate = DateTimeOffset.UtcNow,
                            Images = new List<PropertyImage>()
                        };

                        // Add 2-4 images
                        int imageCount = random.Next(2, 5);
                        for (int imgIdx = 0; imgIdx < imageCount; imgIdx++)
                        {
                            property.Images.Add(new PropertyImage
                            {
                                Id = Guid.NewGuid(),
                                PropertyId = property.Id,
                                Url = propertyImages[random.Next(propertyImages.Length)],
                                IsPrimary = imgIdx == 0,
                                CreatedDate = DateTimeOffset.UtcNow,
                                UpdatedDate = DateTimeOffset.UtcNow
                            });
                        }

                        newProperties.Add(property);
                    }
                }
            }

            _storageBroker.Properties.AddRange(newProperties);
            await _storageBroker.SaveChangesAsync();

            return Ok(new { Message = $"Successfully seeded {newProperties.Count} properties across {locations.Count} regions.", PropertiesCount = newProperties.Count });
        }
    }
}
