namespace Mulkchi.Api.Application.Interfaces;

/// <summary>
/// Unit of Work pattern - transaction management
/// BMI: Clean Architecture - Application Layer
/// </summary>
public interface IUnitOfWork : IDisposable
{
    IRepository<T> Repository<T>() where T : class;
    Task<int> SaveChangesAsync();
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
}
