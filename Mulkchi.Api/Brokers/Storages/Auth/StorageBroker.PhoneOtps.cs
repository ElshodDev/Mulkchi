#nullable disable

using System;
using System.Threading.Tasks;
using Mulkchi.Api.Models.Foundations.Auth;
using Microsoft.EntityFrameworkCore;

namespace Mulkchi.Api.Brokers.Storages
{
    public partial class StorageBroker
    {
        public DbSet<PhoneOtp> PhoneOtps { get; set; }

        public async ValueTask<PhoneOtp> InsertPhoneOtpAsync(PhoneOtp otp)
        {
            var entry = await this.PhoneOtps.AddAsync(otp);
            await this.SaveChangesAsync();
            return entry.Entity;
        }

        public async ValueTask<PhoneOtp> SelectLatestActivePhoneOtpAsync(string phone)
            => await this.PhoneOtps
                .Where(o => o.Phone == phone && !o.IsUsed && o.ExpiresAt > DateTimeOffset.UtcNow)
                .OrderByDescending(o => o.CreatedDate)
                .FirstOrDefaultAsync();

        public async ValueTask<PhoneOtp> UpdatePhoneOtpAsync(PhoneOtp otp)
        {
            this.Entry(otp).State = EntityState.Modified;
            await this.SaveChangesAsync();
            return otp;
        }
    }
}
