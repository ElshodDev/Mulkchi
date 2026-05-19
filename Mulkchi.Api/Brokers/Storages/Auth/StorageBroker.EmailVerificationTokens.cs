#nullable disable

using System;
using System.Threading.Tasks;
using Mulkchi.Api.Models.Foundations.Auth;
using Microsoft.EntityFrameworkCore;

namespace Mulkchi.Api.Brokers.Storages
{
    public partial class StorageBroker
    {
        public DbSet<EmailVerificationToken> EmailVerificationTokens { get; set; }

        public async ValueTask<EmailVerificationToken> InsertEmailVerificationTokenAsync(EmailVerificationToken token)
        {
            var entry = await this.EmailVerificationTokens.AddAsync(token);
            await this.SaveChangesAsync();
            return entry.Entity;
        }

        public async ValueTask<EmailVerificationToken> SelectEmailVerificationTokenByTokenAsync(string token)
            => await this.EmailVerificationTokens
                .FirstOrDefaultAsync(t => t.Token == token && !t.IsUsed && t.ExpiresAt > DateTimeOffset.UtcNow);

        public async ValueTask<EmailVerificationToken> UpdateEmailVerificationTokenAsync(EmailVerificationToken token)
        {
            this.Entry(token).State = EntityState.Modified;
            await this.SaveChangesAsync();
            return token;
        }
    }
}
