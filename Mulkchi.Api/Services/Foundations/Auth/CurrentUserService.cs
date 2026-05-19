using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace Mulkchi.Api.Services.Foundations.Auth;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        this.httpContextAccessor = httpContextAccessor;
    }

    public Guid? GetCurrentUserId()
    {
        var userIdClaim = httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid userId))
            return null;

        return userId;
    }

    public bool IsCurrentUser(Guid userId)
    {
        var currentUserId = GetCurrentUserId();
        return currentUserId.HasValue && currentUserId.Value == userId;
    }

    public bool IsInRole(string role)
    {
        return httpContextAccessor.HttpContext?.User?.IsInRole(role) ?? false;
    }
}
