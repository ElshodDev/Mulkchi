// Backend API modeliga mos interfeysler
// C# modeli: PascalCase, majburiy maydonlar

export interface ApiRegisterRequest {
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  Password: string;
  PreferredLanguage?: string;
}

export interface ApiLoginRequest {
  Email: string;
  Password: string;
}

// Backend response (camelCase - actual format from API)
export interface ApiAuthResponse {
  token: string;
  refreshToken?: string;
  expiresAt: string; // ISO date string
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: string;
}
