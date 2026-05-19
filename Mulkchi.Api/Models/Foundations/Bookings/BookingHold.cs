using System;

namespace Mulkchi.Api.Models.Foundations.Bookings;

/// <summary>
/// 10-daqiqalik pessimistik bloklash (phantom booking himoyasi).
/// Foydalanuvchi bron qilish jarayonini boshlaganda ushbu yozuv yaratiladi.
/// ExpiresAt dan keyin bloklash muddati tugaydi va slot bo'shaydi.
/// </summary>
public class BookingHold
{
    public Guid Id { get; set; }
    public Guid PropertyId { get; set; }
    public Guid UserId { get; set; }
    public DateTimeOffset CheckInDate { get; set; }
    public DateTimeOffset CheckOutDate { get; set; }
    /// <summary>Hold 10 daqiqa amal qiladi.</summary>
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
}
