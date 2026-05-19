#nullable disable

using System;
using System.Linq;
using System.Threading.Tasks;
using Mulkchi.Api.Models.Foundations.Auth;
using Microsoft.EntityFrameworkCore;

namespace Mulkchi.Api.Brokers.Storages
{
    public partial class StorageBroker
    {
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

        public async ValueTask<PasswordResetToken> InsertPasswordResetTokenAsync(PasswordResetToken token)
        {
            var entry = await this.PasswordResetTokens.AddAsync(token);
            await this.SaveChangesAsync();
            return entry.Entity;
        }

        public IQueryable<PasswordResetToken> SelectAllPasswordResetTokens() =>
            this.PasswordResetTokens.AsQueryable();

        public async ValueTask<PasswordResetToken> SelectPasswordResetTokenByIdAsync(Guid tokenId)
            => (await this.PasswordResetTokens.FindAsync(tokenId))!;

        public async ValueTask<PasswordResetToken> SelectPasswordResetTokenByTokenAsync(string token)
            => await this.PasswordResetTokens
                .FirstOrDefaultAsync(t => t.Token == token && !t.IsUsed && t.ExpiresAt > DateTimeOffset.UtcNow);

        public async ValueTask<PasswordResetToken> UpdatePasswordResetTokenAsync(PasswordResetToken token)
        {
            this.Entry(token).State = EntityState.Modified;
            await this.SaveChangesAsync();
            return token;
        }

        public async ValueTask<PasswordResetToken> DeletePasswordResetTokenAsync(Guid tokenId)
        {
            PasswordResetToken token = await this.PasswordResetTokens.FindAsync(tokenId);
            if (token is null)
                return null!;

            token.DeletedDate = DateTimeOffset.UtcNow;
            this.Entry(token).State = EntityState.Modified;
            await this.SaveChangesAsync();
            return token;
        }
    }
}
