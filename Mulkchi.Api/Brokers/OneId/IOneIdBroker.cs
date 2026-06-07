using System.Threading.Tasks;

namespace Mulkchi.Api.Brokers.OneId
{
    public interface IOneIdBroker
    {
        ValueTask<OneIdUserInfo?> GetUserInfoAsync(string authCode);
    }

    public class OneIdUserInfo
    {
        public string Pinfl { get; set; }
        public string PassportSeries { get; set; }
        public string PassportNumber { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string MiddleName { get; set; }
    }
}
