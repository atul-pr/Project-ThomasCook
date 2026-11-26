export type BookingStatus = 'CONFIRMED' | 'CANCELLED';

export interface CreateBookingRequest {
  hotelId?: number;
  roomTypeId: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  specialRequests?: string;
}

export interface CancelBookingRequest {
  email: string;
}

export interface BookingResponse {
  bookingReference: string;
  status: BookingStatus;
  hotelId: number;
  hotelName: string;
  hotelCity: string;
  roomTypeId: number;
  roomTypeName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  nights: number;
  pricePerNightSnapshot: number;
  taxAmountSnapshot: number;
  totalAmountSnapshot: number;
  currency: string;
  specialRequests: string | null;
  createdAt: string;
  cancelledAt: string | null;
}
