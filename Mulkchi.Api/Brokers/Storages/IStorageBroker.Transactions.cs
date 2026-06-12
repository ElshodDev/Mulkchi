using Microsoft.EntityFrameworkCore.Storage;
using System.Threading.Tasks;
using System.Data;

namespace Mulkchi.Api.Brokers.Storages;

public partial interface IStorageBroker
{
    ValueTask<IDbContextTransaction> BeginTransactionAsync();
    ValueTask<IDbContextTransaction> BeginTransactionAsync(IsolationLevel isolationLevel);
    ValueTask SaveChangesAsync();
}
