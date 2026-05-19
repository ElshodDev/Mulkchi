using System;

namespace Mulkchi.Api.Services.Foundations.Auth;

public interface ICurrentUserService
{
    Guid? GetCurrentUserId();
    bool IsCurrentUser(Guid userId);
    bool IsInRole(string role);
}
