export enum UserRole {
  Guest = 'Guest',
  Host = 'Host',
  Admin = 'Admin',
  SuperAdmin = 'SuperAdmin',
}

export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other',
}

export enum HostBadge {
  New = 'New',
  Rising = 'Rising',
  Super = 'Super',
  Legend = 'Legend',
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  address?: string;
  dateOfBirth?: Date;
  gender: Gender;
  isVerified: boolean;
  emailConfirmed: boolean;
  role: UserRole;
  currentMode?: UserRole; // For Single Identity: Guest/Host switch
  badge: HostBadge;
  rating: number;
  responseRate: number;
  responseTimeMinutes: number;
  totalListings: number;
  totalBookings: number;
  hostSince?: Date;
  preferredLanguage: string;
  createdDate: Date;
  updatedDate: Date;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  expiresAt: Date;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: UserRole;
  currentMode?: UserRole; // Current active mode for Single Identity
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string; // Required for backend
  password: string;
  confirmPassword: string; // Frontend validation only
  role?: UserRole; // Optional - defaults to Guest on backend
}

export interface SwitchModeRequest {
  targetMode: UserRole.Guest | UserRole.Host;
}

export interface GoogleLoginRequest {
  idToken: string;
}
