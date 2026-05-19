export enum BookingStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Cancelled = 'Cancelled',
  Completed = 'Completed',
  Refunded = 'Refunded'
}

export interface Booking {
  id: string;
  propertyId: string;
  guestId: string;
  property?: PropertySummary;
  guest?: GuestSummary;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  totalPrice: number;
  status: BookingStatus;
  notes?: string;
  createdDate: Date;
  updatedDate: Date;
  deletedDate?: Date;
}

export interface PropertySummary {
  id: string;
  title: string;
  mainImageUrl?: string;
  city: string;
  district: string;
}

export interface GuestSummary {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  phone?: string;
}

export interface CreateBookingRequest {
  propertyId: string;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  notes?: string;
}

export interface BookingHold {
  id: string;
  propertyId: string;
  guestId: string;
  checkInDate: Date;
  checkOutDate: Date;
  expiresAt: Date;
  createdDate: Date;
}

export interface CreateHoldRequest {
  propertyId: string;
  checkInDate: Date;
  checkOutDate: Date;
}
