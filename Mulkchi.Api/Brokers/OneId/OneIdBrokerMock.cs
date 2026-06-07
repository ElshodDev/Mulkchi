using System.Threading.Tasks;

namespace Mulkchi.Api.Brokers.OneId
{
    public class OneIdBrokerMock : IOneIdBroker
    {
        public ValueTask<OneIdUserInfo?> GetUserInfoAsync(string authCode)
        {
            // Simulate API call to OneID
            if (authCode == "invalid_code")
                return new ValueTask<OneIdUserInfo?>((OneIdUserInfo?)null);

            return new ValueTask<OneIdUserInfo?>(new OneIdUserInfo
            {
                Pinfl = "31201950000001",
                PassportSeries = "AA",
                PassportNumber = "1234567",
                FirstName = "Eshmat",
                LastName = "Toshmatov",
                MiddleName = "Eshmat o'g'li"
            });
        }
    }
}
