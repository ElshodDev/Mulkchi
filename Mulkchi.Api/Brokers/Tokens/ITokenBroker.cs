using System.Threading.Tasks;
using Mulkchi.Api.Models.Foundations.Users;

namespace Mulkchi.Api.Brokers.Tokens
{
    public interface ITokenBroker
    {
        string GenerateToken(User user);
        string GenerateRefreshToken();
    }
}
