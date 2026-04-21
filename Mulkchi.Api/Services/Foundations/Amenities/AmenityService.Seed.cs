using Mulkchi.Api.Models.Foundations.Amenities;
using Microsoft.EntityFrameworkCore;

namespace Mulkchi.Api.Services.Foundations.Amenities;

public partial class AmenityService
{
    public async ValueTask SeedDefaultAmenitiesAsync()
    {
        var existingCount = this.storageBroker.SelectAllAmenities().Count();
        if (existingCount > 0) return; // Already seeded

        var now = this.dateTimeBroker.GetCurrentDateTimeOffset();

        var amenities = new List<Amenity>
        {
            // Basic (Asosiy)
            new Amenity { Id = Guid.NewGuid(), Name = "WiFi", NameUz = "WiFi", NameRu = "WiFi", Icon = "wifi", Category = AmenityCategory.Basic, IsActive = true, DisplayOrder = 1, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Electricity", NameUz = "Elektr", NameRu = "Электричество", Icon = "zap", Category = AmenityCategory.Basic, IsActive = true, DisplayOrder = 2, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Water", NameUz = "Suv", NameRu = "Вода", Icon = "droplet", Category = AmenityCategory.Basic, IsActive = true, DisplayOrder = 3, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Gas", NameUz = "Gaz", NameRu = "Газ", Icon = "flame", Category = AmenityCategory.Basic, IsActive = true, DisplayOrder = 4, CreatedDate = now },

            // Comfort (Qulaylik)
            new Amenity { Id = Guid.NewGuid(), Name = "Air Conditioning", NameUz = "Konditsioner", NameRu = "Кондиционер", Icon = "wind", Category = AmenityCategory.Comfort, IsActive = true, DisplayOrder = 5, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Heating", NameUz = "Isitish tizimi", NameRu = "Отопление", Icon = "thermometer", Category = AmenityCategory.Comfort, IsActive = true, DisplayOrder = 6, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Washing Machine", NameUz = "Kir yuvish mashinasi", NameRu = "Стиральная машина", Icon = "archive", Category = AmenityCategory.Comfort, IsActive = true, DisplayOrder = 7, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Dryer", NameUz = "Kuritish mashinasi", NameRu = "Сушильная машина", Icon = "wind", Category = AmenityCategory.Comfort, IsActive = true, DisplayOrder = 8, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Iron", NameUz = "Dazmol", NameRu = "Утюг", Icon = "triangle", Category = AmenityCategory.Comfort, IsActive = true, DisplayOrder = 9, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Hair Dryer", NameUz = "Soch quritgich", NameRu = "Фен", Icon = "wind", Category = AmenityCategory.Comfort, IsActive = true, DisplayOrder = 10, CreatedDate = now },

            // Kitchen (Oshxona)
            new Amenity { Id = Guid.NewGuid(), Name = "Refrigerator", NameUz = "Muzlatgich", NameRu = "Холодильник", Icon = "box", Category = AmenityCategory.Kitchen, IsActive = true, DisplayOrder = 11, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Dishwasher", NameUz = "Idish yuvish mashinasi", NameRu = "Посудомоечная машина", Icon = "coffee", Category = AmenityCategory.Kitchen, IsActive = true, DisplayOrder = 12, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Microwave", NameUz = "Mikroto'lqinli pech", NameRu = "Микроволновка", Icon = "zap", Category = AmenityCategory.Kitchen, IsActive = true, DisplayOrder = 13, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Oven", NameUz = "Duxovka", NameRu = "Духовка", Icon = "disc", Category = AmenityCategory.Kitchen, IsActive = true, DisplayOrder = 14, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Stove", NameUz = "Oshxona plitasi", NameRu = "Плита", Icon = "circle", Category = AmenityCategory.Kitchen, IsActive = true, DisplayOrder = 15, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Kettle", NameUz = "Choynak", NameRu = "Чайник", Icon = "coffee", Category = AmenityCategory.Kitchen, IsActive = true, DisplayOrder = 16, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Kitchen Utensils", NameUz = "Oshxona anjomlari", NameRu = "Кухонная утварь", Icon = "package", Category = AmenityCategory.Kitchen, IsActive = true, DisplayOrder = 17, CreatedDate = now },

            // Bedroom (Yotoqxona)
            new Amenity { Id = Guid.NewGuid(), Name = "Wardrobe", NameUz = "Kiyim javoni", NameRu = "Шкаф", Icon = "square", Category = AmenityCategory.Bedroom, IsActive = true, DisplayOrder = 18, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "TV", NameUz = "Televizor", NameRu = "Телевизор", Icon = "monitor", Category = AmenityCategory.Bedroom, IsActive = true, DisplayOrder = 19, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Bed Linens", NameUz = "To'shak jihozlari", NameRu = "Постельное белье", Icon = "layout", Category = AmenityCategory.Bedroom, IsActive = true, DisplayOrder = 20, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Hangers", NameUz = "Veshalkalar", NameRu = "Вешалки", Icon = "align-center", Category = AmenityCategory.Bedroom, IsActive = true, DisplayOrder = 21, CreatedDate = now },

            // Building (Bino)
            new Amenity { Id = Guid.NewGuid(), Name = "Elevator", NameUz = "Lift", NameRu = "Лифт", Icon = "arrow-up", Category = AmenityCategory.Building, IsActive = true, DisplayOrder = 22, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Parking", NameUz = "Avtoturargoh", NameRu = "Парковка", Icon = "car", Category = AmenityCategory.Building, IsActive = true, DisplayOrder = 23, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Security", NameUz = "Qo'shimcha xavfsizlik", NameRu = "Охрана", Icon = "shield", Category = AmenityCategory.Building, IsActive = true, DisplayOrder = 24, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Generator", NameUz = "Generator", NameRu = "Генератор", Icon = "battery-charging", Category = AmenityCategory.Building, IsActive = true, DisplayOrder = 25, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Intercom", NameUz = "Domofon", NameRu = "Домофон", Icon = "phone", Category = AmenityCategory.Building, IsActive = true, DisplayOrder = 26, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Video Surveillance", NameUz = "Video kuzatuv", NameRu = "Видеонаблюдение", Icon = "video", Category = AmenityCategory.Building, IsActive = true, DisplayOrder = 27, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Fire Alarm", NameUz = "Yong'in xavfsizligi", NameRu = "Пожарная сигнализация", Icon = "alert-circle", Category = AmenityCategory.Building, IsActive = true, DisplayOrder = 28, CreatedDate = now },

            // Outdoor (Hovli)
            new Amenity { Id = Guid.NewGuid(), Name = "Balcony", NameUz = "Balkon", NameRu = "Балкон", Icon = "square", Category = AmenityCategory.Outdoor, IsActive = true, DisplayOrder = 29, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Garden", NameUz = "Bog'", NameRu = "Сад", Icon = "cloud", Category = AmenityCategory.Outdoor, IsActive = true, DisplayOrder = 30, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Pool", NameUz = "Hovuz", NameRu = "Бассейн", Icon = "droplet", Category = AmenityCategory.Outdoor, IsActive = true, DisplayOrder = 31, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Terrace", NameUz = "Terasa", NameRu = "Терраса", Icon = "layout", Category = AmenityCategory.Outdoor, IsActive = true, DisplayOrder = 32, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Playground", NameUz = "Bolalar maydonchasi", NameRu = "Детская площадка", Icon = "circle", Category = AmenityCategory.Outdoor, IsActive = true, DisplayOrder = 33, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "BBQ Area", NameUz = "Gril maydoni", NameRu = "Зона барбекю", Icon = "flame", Category = AmenityCategory.Outdoor, IsActive = true, DisplayOrder = 34, CreatedDate = now },

            // Policy (Qoidalar)
            new Amenity { Id = Guid.NewGuid(), Name = "Pet Friendly", NameUz = "Uy hayvonlariga ruxsat", NameRu = "Можно с питомцами", Icon = "heart", Category = AmenityCategory.Policy, IsActive = true, DisplayOrder = 35, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Smoking Allowed", NameUz = "Chekilish mumkin", NameRu = "Можно курить", Icon = "cloud", Category = AmenityCategory.Policy, IsActive = true, DisplayOrder = 36, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Events Allowed", NameUz = "Tadbirlarga ruxsat", NameRu = "Можно проводить мероприятия", Icon = "users", Category = AmenityCategory.Policy, IsActive = true, DisplayOrder = 37, CreatedDate = now },
            new Amenity { Id = Guid.NewGuid(), Name = "Child Friendly", NameUz = "Bolalar uchun qulay", NameRu = "Подходит для детей", Icon = "smile", Category = AmenityCategory.Policy, IsActive = true, DisplayOrder = 38, CreatedDate = now }
        };

        foreach (var amenity in amenities)
        {
            await this.storageBroker.InsertAmenityAsync(amenity);
        }
    }
}
