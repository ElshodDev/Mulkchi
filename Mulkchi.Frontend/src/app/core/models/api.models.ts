
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

export interface ApiAuthResponse {
  token: string;
  refreshToken?: string;
  expiresAt: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: string;
}
