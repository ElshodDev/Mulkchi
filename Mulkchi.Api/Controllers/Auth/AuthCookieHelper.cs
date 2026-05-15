using System.Security.Cryptography;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.WebUtilities;
using Mulkchi.Api.Models.Foundations.Auth;

namespace Mulkchi.Api.Controllers.Auth;

internal static class AuthCookieHelper
{
    internal const string AccessTokenCookie = "access_token";
    internal const string RefreshTokenCookie = "refresh_token";
    internal const string XsrfTokenCookie = "XSRF-TOKEN";
    internal const string XsrfHeaderName = "X-XSRF-TOKEN";

    internal static void SetAuthCookies(HttpResponse response, AuthResponse authResponse)
    {
        var authCookieOptions = CreateAuthCookieOptions(authResponse.ExpiresAt);
        var refreshCookieOptions = CreateRefreshCookieOptions(
            authResponse.RefreshExpiresAt == default ? authResponse.ExpiresAt : authResponse.RefreshExpiresAt);
        var xsrfToken = GenerateXsrfToken();
        var xsrfCookieOptions = CreateXsrfCookieOptions(
            authResponse.RefreshExpiresAt == default ? authResponse.ExpiresAt : authResponse.RefreshExpiresAt);

        response.Cookies.Append(AccessTokenCookie, authResponse.Token, authCookieOptions);
        response.Cookies.Append(RefreshTokenCookie, authResponse.RefreshToken, refreshCookieOptions);
        response.Cookies.Append(XsrfTokenCookie, xsrfToken, xsrfCookieOptions);
    }

    internal static void ClearAuthCookies(HttpResponse response)
    {
        var expiredCookieOptions = new CookieOptions
        {
            Path = "/",
            HttpOnly = false,
            Secure = false,
            SameSite = SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddDays(-1)
        };

        response.Cookies.Delete(AccessTokenCookie, expiredCookieOptions);
        response.Cookies.Delete(RefreshTokenCookie, expiredCookieOptions);
        response.Cookies.Delete(XsrfTokenCookie, expiredCookieOptions);
    }

    internal static bool ValidateXsrfToken(HttpRequest request)
    {
        if (!request.Cookies.TryGetValue(XsrfTokenCookie, out var cookieToken) ||
            string.IsNullOrWhiteSpace(cookieToken) ||
            !request.Headers.TryGetValue(XsrfHeaderName, out var headerValues))
        {
            return false;
        }

        var headerToken = headerValues.ToString();
        if (string.IsNullOrWhiteSpace(headerToken))
        {
            return false;
        }

        if (cookieToken.Length != headerToken.Length)
        {
            return false;
        }

        return CryptographicOperations.FixedTimeEquals(
            System.Text.Encoding.UTF8.GetBytes(cookieToken),
            System.Text.Encoding.UTF8.GetBytes(headerToken));
    }

    private static CookieOptions CreateAuthCookieOptions(DateTimeOffset expiresAt) => new()
    {
        Path = "/",
        HttpOnly = true,
        Secure = false,
        SameSite = SameSiteMode.Lax,
        Expires = expiresAt
    };

    private static CookieOptions CreateXsrfCookieOptions(DateTimeOffset expiresAt) => new()
    {
        Path = "/",
        HttpOnly = false,
        Secure = false,
        SameSite = SameSiteMode.Lax,
        Expires = expiresAt
    };

    private static CookieOptions CreateRefreshCookieOptions(DateTimeOffset expiresAt) => new()
    {
        Path = "/",
        HttpOnly = true,
        Secure = false,
        SameSite = SameSiteMode.Lax,
        Expires = expiresAt
    };

    private static string GenerateXsrfToken()
    {
        Span<byte> bytes = stackalloc byte[32];
        RandomNumberGenerator.Fill(bytes);
        return WebEncoders.Base64UrlEncode(bytes);
    }
}
