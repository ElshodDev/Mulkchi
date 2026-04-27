export enum PropertyType {
  Apartment = 'Apartment',
  House = 'House',
  Office = 'Office',
  Land = 'Land',
  Villa = 'Villa',
  Cottage = 'Cottage',
  Commercial = 'Commercial'
}

export enum PropertyCategory {
  Residential = 'Residential',
  Commercial = 'Commercial',
  Industrial = 'Industrial'
}

export enum PropertyStatus {
  Draft = 'Draft',
  Active = 'Active',
  Sold = 'Sold',
  Rented = 'Rented',
  Archived = 'Archived'
}

export enum ListingType {
  Sale = 'Sale',
  Rent = 'Rent',
  ShortTermRent = 'ShortTermRent'
}

export enum Currency {
  UZS = 'UZS',
  USD = 'USD',
  EUR = 'EUR'
}

export enum UzbekistanRegion {
  Toshkent = 'Toshkent',
  ToshkentViloyati = 'ToshkentViloyati',
  Samarqand = 'Samarqand',
  Buxoro = 'Buxoro',
  Andijon = 'Andijon',
  Fargona = 'Fargona',
  Namangan = 'Namangan',
  Xorazm = 'Xorazm',
  Navoi = 'Navoi',
  Jizzax = 'Jizzax',
  Sirdaryo = 'Sirdaryo',
  Surxondaryo = 'Surxondaryo',
  Qashqadaryo = 'Qashqadaryo',
  Guliston = 'Guliston',
  Nukus = 'Nukus'
}

export interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  category: PropertyCategory;
  status: PropertyStatus;
  listingType: ListingType;
  monthlyRent?: number;
  salePrice?: number;
  pricePerNight?: number;
  securityDeposit?: number;
  area: number;
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  maxGuests: number;
  region: UzbekistanRegion;
  city: string;
  district: string;
  address: string;
  mahalla?: string;
  latitude?: number;
  longitude?: number;
  
  // Amenities
  hasWifi: boolean;
  hasParking: boolean;
  hasPool: boolean;
  petsAllowed: boolean;
  isInstantBook: boolean;
  isVacant: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  
  // Infrastructure
  hasMetroNearby: boolean;
  hasBusStop: boolean;
  hasMarketNearby: boolean;
  hasSchoolNearby: boolean;
  hasHospitalNearby: boolean;
  distanceToCityCenter: number;
  
  // Comfort
  hasElevator: boolean;
  hasSecurity: boolean;
  hasGenerator: boolean;
  hasGas: boolean;
  hasFurniture: boolean;
  isRenovated: boolean;
  
  // International standards
  hasAirConditioning: boolean;
  hasHeating: boolean;
  hasWasher: boolean;
  hasKitchen: boolean;
  hasTV: boolean;
  hasWorkspace: boolean;
  isSelfCheckIn: boolean;
  isChildFriendly: boolean;
  isAccessible: boolean;
  
  // Stats
  averageRating: number;
  viewsCount: number;
  favoritesCount: number;
  
  // Relations
  hostId: string;
  currency: Currency;
  exchangeRate: number;
  
  createdDate: Date;
  updatedDate: Date;
  deletedDate?: Date;
  
  // Navigation
  images?: PropertyImage[];
  
  // Additional image properties for API responses
  imageUrl?: string;
  mainImageUrl?: string;
  thumbnailUrl?: string;
}

export interface PropertyResponse extends Property {
  // Additional properties specific to responses if any
  floor?: number;
  totalFloors?: number;
}

export interface PropertyImage {
  id: string;
  propertyId: string;
  imageUrl: string;
  url?: string; // Alternative property for image URL
  caption?: string;
  sortOrder: number;
  isMain: boolean;
  createdDate: Date;
}

export interface PropertyCreateRequest {
  title: string;
  description: string;
  type: PropertyType;
  category: PropertyCategory;
  listingType: ListingType;
  monthlyRent?: number;
  salePrice?: number;
  pricePerNight?: number;
  area: number;
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  maxGuests: number;
  region: UzbekistanRegion;
  city: string;
  district: string;
  address: string;
  mahalla?: string;
  latitude?: number;
  longitude?: number;
  
  // Amenities
  hasWifi?: boolean;
  hasParking?: boolean;
  hasPool?: boolean;
  petsAllowed?: boolean;
  isInstantBook?: boolean;
  
  // Infrastructure
  hasMetroNearby?: boolean;
  hasBusStop?: boolean;
  hasMarketNearby?: boolean;
  hasSchoolNearby?: boolean;
  hasHospitalNearby?: boolean;
  distanceToCityCenter?: number;
  
  // Comfort
  hasElevator?: boolean;
  hasSecurity?: boolean;
  hasGenerator?: boolean;
  hasGas?: boolean;
  hasFurniture?: boolean;
  isRenovated?: boolean;
  
  // International standards
  hasAirConditioning?: boolean;
  hasHeating?: boolean;
  hasWasher?: boolean;
  hasKitchen?: boolean;
  hasTV?: boolean;
  hasWorkspace?: boolean;
  isSelfCheckIn?: boolean;
  isChildFriendly?: boolean;
  isAccessible?: boolean;
}

export interface PropertySearchParams {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: PropertyType;
  listingType?: ListingType;
  amenities?: string[];
  availableFrom?: Date;
  availableTo?: Date;
  page?: number;
  pageSize?: number;
}

import { ApiAuthResponse } from './api.models';

/**
 * Response returned when creating a new property listing.
 * Includes the created property and new authentication tokens (if user was upgraded to Host).
 */
export interface PropertyCreateResponse {
  /** The newly created property listing */
  property: Property;
  /** 
   * New authentication tokens (only present if user was upgraded from Guest to Host).
   * When present, frontend should update stored tokens to access Host-only endpoints.
   */
  tokens?: ApiAuthResponse;
}
