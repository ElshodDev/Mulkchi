export enum PropertyType {
  Apartment = 'Apartment',
  House = 'House',
  Office = 'Office',
  Land = 'Land',
  Villa = 'Villa',
  Cottage = 'Cottage',
  Commercial = 'Commercial',
}

export enum PropertyCategory {
  Residential = 'Residential',
  Commercial = 'Commercial',
  Industrial = 'Industrial',
}

export enum PropertyStatus {
  Draft = 'Draft',
  Active = 'Active',
  Sold = 'Sold',
  Rented = 'Rented',
  Archived = 'Archived',
}

export enum ListingType {
  Sale = 'Sale',
  Rent = 'Rent',
  ShortTermRent = 'ShortTermRent',
}

export enum Currency {
  UZS = 'UZS',
  USD = 'USD',
  EUR = 'EUR',
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
  Nukus = 'Nukus',
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

  hasWifi: boolean;
  hasParking: boolean;
  hasPool: boolean;
  petsAllowed: boolean;
  isInstantBook: boolean;
  isVacant: boolean;
  isFeatured: boolean;
  isVerified: boolean;

  hasMetroNearby: boolean;
  hasBusStop: boolean;
  hasMarketNearby: boolean;
  hasSchoolNearby: boolean;
  hasHospitalNearby: boolean;
  distanceToCityCenter: number;

  hasElevator: boolean;
  hasSecurity: boolean;
  hasGenerator: boolean;
  hasGas: boolean;
  hasFurniture: boolean;
  isRenovated: boolean;

  hasAirConditioning: boolean;
  hasHeating: boolean;
  hasWasher: boolean;
  hasKitchen: boolean;
  hasTV: boolean;
  hasWorkspace: boolean;
  isSelfCheckIn: boolean;
  isChildFriendly: boolean;
  isAccessible: boolean;

  averageRating: number;
  viewsCount: number;
  favoritesCount: number;

  hostId: string;
  hostName?: string;
  hostAvatarUrl?: string;
  virtualTourUrl?: string;
  currency: Currency;
  exchangeRate: number;

  createdDate: Date;
  updatedDate: Date;
  deletedDate?: Date;

  images?: PropertyImage[];

  imageUrl?: string;
  mainImageUrl?: string;
  thumbnailUrl?: string;
}

export interface PropertyResponse extends Property {
  floor?: number;
  totalFloors?: number;
}

export interface PropertyImage {
  id: string;
  propertyId: string;
  url: string;
  mediumUrl: string;
  thumbnailUrl: string;
  caption?: string;
  sortOrder: number;
  isPrimary: boolean;
  createdDate: Date;
  imageUrl?: string;
  isMain?: boolean;
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

  hasWifi?: boolean;
  hasParking?: boolean;
  hasPool?: boolean;
  petsAllowed?: boolean;
  isInstantBook?: boolean;

  hasMetroNearby?: boolean;
  hasBusStop?: boolean;
  hasMarketNearby?: boolean;
  hasSchoolNearby?: boolean;
  hasHospitalNearby?: boolean;
  distanceToCityCenter?: number;

  hasElevator?: boolean;
  hasSecurity?: boolean;
  hasGenerator?: boolean;
  hasGas?: boolean;
  hasFurniture?: boolean;
  isRenovated?: boolean;

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
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  sortBy?: string;
  region?: UzbekistanRegion;
  isFeatured?: boolean;
  isVerified?: boolean;
  search?: string;
}

import { ApiAuthResponse } from './api.models';

export interface PropertyCreateResponse {
  property: Property;
  tokens?: ApiAuthResponse;
}
