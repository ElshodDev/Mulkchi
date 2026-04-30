#nullable disable

namespace Mulkchi.Api.Domain.Entities;

/// <summary>
/// Base entity class for all domain entities
/// BMI: Domain-Driven Design - Entity base class
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset UpdatedDate { get; set; }
    public DateTimeOffset? DeletedDate { get; set; }
    
    protected BaseEntity()
    {
        Id = Guid.NewGuid();
        CreatedDate = DateTimeOffset.UtcNow;
        UpdatedDate = DateTimeOffset.UtcNow;
    }
}
