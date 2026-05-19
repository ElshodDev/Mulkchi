using Mulkchi.Api.Models.Foundations.Auth;

namespace Mulkchi.Api.Brokers.Storages;

public partial interface IStorageBroker
{
    ValueTask<PhoneOtp> InsertPhoneOtpAsync(PhoneOtp otp);
    ValueTask<PhoneOtp> SelectLatestActivePhoneOtpAsync(string phone);
    ValueTask<PhoneOtp> UpdatePhoneOtpAsync(PhoneOtp otp);
}
