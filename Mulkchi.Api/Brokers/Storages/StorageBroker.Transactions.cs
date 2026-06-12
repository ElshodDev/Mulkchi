using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using System.Data;

namespace Mulkchi.Api.Brokers.Storages;

public partial class StorageBroker
{
    public async ValueTask<IDbContextTransaction> BeginTransactionAsync()
    {
        return await this.Database.BeginTransactionAsync();
    }

    public async ValueTask<IDbContextTransaction> BeginTransactionAsync(IsolationLevel isolationLevel)
    {
        return await this.Database.BeginTransactionAsync(isolationLevel);
    }

    public async ValueTask SaveChangesAsync()
    {
        await base.SaveChangesAsync();
    }
}

