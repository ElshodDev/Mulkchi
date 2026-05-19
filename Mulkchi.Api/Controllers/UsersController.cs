using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Mulkchi.Api.Models.Foundations.Common;
using Mulkchi.Api.Models.Foundations.Users;
using Mulkchi.Api.Models.Foundations.Users.Exceptions;
using Mulkchi.Api.Services.Foundations.Users;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService userService;

    public sealed class CreateUserRequest
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string Password { get; set; } = string.Empty;
        public UserRole Role { get; set; } = UserRole.Guest;
    }

    public sealed class UpdateUserRequest
    {
        public Guid Id { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; }
        public UserRole? Role { get; set; }
    }

    public UsersController(IUserService userService)
    {
        this.userService = userService;
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserResponse>> GetCurrentUserAsync()
    {
        try
        {
            UserResponse userResponse = await this.userService.RetrieveCurrentUserAsync();
            return Ok(userResponse);
        }
        catch (UserDependencyValidationException userDependencyValidationException)
            when (userDependencyValidationException.InnerException is NotFoundUserException)
        {
            return NotFound(userDependencyValidationException.InnerException.Message);
        }
        catch (UserValidationException userValidationException)
        {
            return BadRequest(userValidationException.InnerException.Message);
        }
        catch (UserServiceException userServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, userServiceException.InnerException.Message);
        }
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<ActionResult<UserResponse>> UpdateProfileAsync([FromBody] UserUpdateDto dto)
    {
        try
        {
            UserResponse userResponse = await this.userService.ModifyUserProfileAsync(dto);
            return Ok(userResponse);
        }
        catch (UserDependencyValidationException userDependencyValidationException)
            when (userDependencyValidationException.InnerException is NotFoundUserException)
        {
            return NotFound(userDependencyValidationException.InnerException.Message);
        }
        catch (UserValidationException userValidationException)
        {
            return BadRequest(userValidationException.InnerException.Message);
        }
        catch (UserServiceException userServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, userServiceException.InnerException.Message);
        }
    }

    [HttpPut("me/avatar")]
    [Authorize]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<UserResponse>> UploadAvatarAsync(IFormFile avatarFile)
    {
        try
        {
            UserResponse userResponse = await this.userService.ModifyUserAvatarAsync(avatarFile);
            return Ok(userResponse);
        }
        catch (UserDependencyValidationException userDependencyValidationException)
            when (userDependencyValidationException.InnerException is NotFoundUserException)
        {
            return NotFound(userDependencyValidationException.InnerException.Message);
        }
        catch (UserValidationException userValidationException)
        {
            return BadRequest(userValidationException.InnerException.Message);
        }
        catch (UserServiceException userServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, userServiceException.InnerException.Message);
        }
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<UserResponse>> GetUserByIdAsync(Guid id)
    {
        try
        {
            UserResponse userResponse = await this.userService.RetrieveUserByIdAsync(id);
            return Ok(userResponse);
        }
        catch (UserDependencyValidationException userDependencyValidationException)
            when (userDependencyValidationException.InnerException is NotFoundUserException)
        {
            return NotFound(userDependencyValidationException.InnerException.Message);
        }
        catch (UserValidationException userValidationException)
        {
            return BadRequest(userValidationException.InnerException.Message);
        }
        catch (UserServiceException userServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, userServiceException.InnerException.Message);
        }
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public ActionResult<PagedResult<UserResponse>> GetAllUsersAsync([FromQuery] PaginationParams pagination, [FromQuery] string? role = null, [FromQuery] string? status = null)
    {
        try
        {
            var users = this.userService.RetrieveAllUsers();

            if (!string.IsNullOrWhiteSpace(role) && Enum.TryParse<UserRole>(role, true, out var parsedRole))
            {
                users = users.Where(user => user.Role == parsedRole);
            }

            if (!string.IsNullOrWhiteSpace(status) && status.Equals("blocked", StringComparison.OrdinalIgnoreCase))
            {
                users = users.Where(user => user.DeletedDate.HasValue);
            }
            else
            {
                users = users.Where(user => !user.DeletedDate.HasValue);
            }

            int totalCount = users.Count();
            var pageItems = users
                .OrderByDescending(user => user.CreatedDate)
                .Skip((pagination.Page - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .Select(user => new UserResponse
                {
                    Id = user.Id,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email,
                    PhoneNumber = user.Phone,
                    AvatarUrl = user.AvatarUrl,
                    Bio = user.Bio,
                    Role = user.Role.ToString(),
                    IsVerified = user.IsVerified,
                    CreatedDate = user.CreatedDate,
                    PropertiesCount = user.TotalListings,
                    AverageRating = user.Rating,
                    PreferredLanguage = user.PreferredLanguage
                })
                .ToList();

            return Ok(new PagedResult<UserResponse>
            {
                Items = pageItems,
                TotalCount = totalCount,
                Page = pagination.Page,
                PageSize = pagination.PageSize
            });
        }
        catch (UserServiceException userServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, userServiceException.InnerException.Message);
        }
    }

    [HttpGet("search")]
    [Authorize(Roles = "Admin")]
    public ActionResult<PagedResult<UserResponse>> SearchUsers([FromQuery] string q, [FromQuery] PaginationParams pagination)
    {
        try
        {
            var users = this.userService.RetrieveAllUsers()
                .Where(user =>
                    user.FirstName.Contains(q) ||
                    user.LastName.Contains(q) ||
                    user.Email.Contains(q));

            int totalCount = users.Count();
            var pageItems = users
                .OrderByDescending(user => user.CreatedDate)
                .Skip((pagination.Page - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .Select(user => new UserResponse
                {
                    Id = user.Id,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email,
                    PhoneNumber = user.Phone,
                    AvatarUrl = user.AvatarUrl,
                    Bio = user.Bio,
                    Role = user.Role.ToString(),
                    IsVerified = user.IsVerified,
                    CreatedDate = user.CreatedDate,
                    PropertiesCount = user.TotalListings,
                    AverageRating = user.Rating,
                    PreferredLanguage = user.PreferredLanguage
                })
                .ToList();

            return Ok(new PagedResult<UserResponse>
            {
                Items = pageItems,
                TotalCount = totalCount,
                Page = pagination.Page,
                PageSize = pagination.PageSize
            });
        }
        catch (UserServiceException userServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, userServiceException.InnerException.Message);
        }
    }

    [HttpGet("statistics")]
    [Authorize(Roles = "Admin")]
    public ActionResult<object> GetUserStatistics()
    {
        try
        {
            var users = this.userService.RetrieveAllUsers().ToList();
            var now = DateTimeOffset.UtcNow;

            var usersByRole = users
                .GroupBy(user => user.Role)
                .Select(group => new { role = group.Key, count = group.Count() })
                .ToList();

            var usersByRegion = users
                .GroupBy(user => string.IsNullOrWhiteSpace(user.Address) ? "Unknown" : user.Address)
                .Select(group => new { region = group.Key, count = group.Count() })
                .ToList();

            return Ok(new
            {
                totalUsers = users.Count,
                activeUsers = users.Count(user => !user.DeletedDate.HasValue),
                blockedUsers = users.Count(user => user.DeletedDate.HasValue),
                adminsCount = users.Count(user => user.Role == UserRole.Admin),
                hostsCount = users.Count(user => user.Role == UserRole.Host),
                regularUsersCount = users.Count(user => user.Role == UserRole.Guest),
                newUsersThisMonth = users.Count(user => user.CreatedDate.Year == now.Year && user.CreatedDate.Month == now.Month),
                usersByRegion,
                usersByRole
            });
        }
        catch (UserServiceException userServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, userServiceException.InnerException.Message);
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<User>> CreateUserAsync([FromBody] CreateUserRequest request)
    {
        try
        {
            var user = new User
            {
                Id = Guid.NewGuid(),
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                Phone = request.PhoneNumber ?? string.Empty,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                AvatarUrl = string.Empty,
                Bio = string.Empty,
                Address = string.Empty,
                Gender = Gender.Other,
                IsVerified = true,
                Role = request.Role,
                Badge = HostBadge.None,
                PreferredLanguage = "uz"
            };

            User addedUser = await this.userService.AddUserAsync(user);
            return Created($"api/users/{addedUser.Id}", addedUser);
        }
        catch (UserValidationException userValidationException)
        {
            return BadRequest(userValidationException.InnerException?.Message ?? "An error occurred.");
        }
        catch (UserDependencyValidationException userDependencyValidationException)
        {
            return BadRequest(userDependencyValidationException.InnerException?.Message ?? "An error occurred.");
        }
        catch (UserServiceException userServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, userServiceException.InnerException?.Message ?? "Internal server error.");
        }
    }

    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<User>> UpdateUserAsync([FromBody] UpdateUserRequest request)
    {
        try
        {
            User? existingUser = this.userService.RetrieveAllUsers().FirstOrDefault(user => user.Id == request.Id);
            if (existingUser is null)
            {
                return NotFound("User not found.");
            }

            existingUser.FirstName = string.IsNullOrWhiteSpace(request.FirstName) ? existingUser.FirstName : request.FirstName;
            existingUser.LastName = string.IsNullOrWhiteSpace(request.LastName) ? existingUser.LastName : request.LastName;
            existingUser.Phone = string.IsNullOrWhiteSpace(request.PhoneNumber) ? existingUser.Phone : request.PhoneNumber;

            if (request.Role.HasValue)
            {
                existingUser.Role = request.Role.Value;
            }

            User modifiedUser = await this.userService.ModifyUserAsync(existingUser);
            return Ok(modifiedUser);
        }
        catch (UserValidationException userValidationException)
        {
            return BadRequest(userValidationException.InnerException?.Message ?? "An error occurred.");
        }
        catch (UserDependencyValidationException userDependencyValidationException)
        {
            return BadRequest(userDependencyValidationException.InnerException?.Message ?? "An error occurred.");
        }
        catch (UserServiceException userServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, userServiceException.InnerException?.Message ?? "Internal server error.");
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteUserAsync(Guid id)
    {
        try
        {
            User removedUser = await this.userService.RemoveUserByIdAsync(id);
            return NoContent();
        }
        catch (UserDependencyValidationException userDependencyValidationException)
            when (userDependencyValidationException.InnerException is NotFoundUserException)
        {
            return NotFound(userDependencyValidationException.InnerException.Message);
        }
        catch (UserValidationException userValidationException)
        {
            return BadRequest(userValidationException.InnerException.Message);
        }
        catch (UserServiceException userServiceException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, userServiceException.InnerException.Message);
        }
    }
}
