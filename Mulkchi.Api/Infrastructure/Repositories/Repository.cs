using Microsoft.EntityFrameworkCore;
using Mulkchi.Api.Application.Interfaces;
using Mulkchi.Api.Brokers.Storages;
using System.Linq.Expressions;

namespace Mulkchi.Api.Infrastructure.Repositories;

/// <summary>
/// Generic repository implementation
/// BMI: Clean Architecture - Infrastructure Layer
/// </summary>
public class Repository<T> : IRepository<T> where T : class
{
    private readonly StorageBroker _context;
    private readonly DbSet<T> _dbSet;

    public Repository(StorageBroker context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(Guid id)
    {
        return await _dbSet.FindAsync(id);
    }

    public async Task<IEnumerable<T>> GetAllAsync()
    {
        return await _dbSet.ToListAsync();
    }

    public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.Where(predicate).ToListAsync();
    }

    public async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    public async Task UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(T entity)
    {
        _dbSet.Remove(entity);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> ExistsAsync(Guid id)
    {
        return await _dbSet.FindAsync(id) != null;
    }
}
