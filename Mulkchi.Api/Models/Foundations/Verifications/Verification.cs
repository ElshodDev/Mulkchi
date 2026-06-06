#nullable disable

using Mulkchi.Api.Models.Foundations.Users;

namespace Mulkchi.Api.Models.Foundations.Verifications;

public class Verification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; }
    
    public string DocumentUrl { get; set; }
    public string SelfieUrl { get; set; }
    
    public VerificationStatus Status { get; set; }
    public string RejectionReason { get; set; }
    public double AiConfidenceScore { get; set; }
    
    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset UpdatedDate { get; set; }
    public DateTimeOffset? DeletedDate { get; set; }
}
