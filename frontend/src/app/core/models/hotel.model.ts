export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: Record<string, string>;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface PriceBreakdown {
  nights: number;
  pricePerNight: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
}

export interface HotelSummary {
  id: number;
  name: string;
  city: string;
  country: string;
  address: string;
  description: string;
  starRating: number;
  amenities: string[];
  imageUrl: string | null;
  startingPricePerNight: number;
  currency: string;
  matchingRoomTypesCount: number;
  totalAvailableRooms: number | null;
}

export interface HotelDetail {
  id: number;
  name: string;
  city: string;
  country: string;
  address: string;
  description: string;
  starRating: number;
  amenities: string[];
  imageUrl: string | null;
}

export interface AlternativeDateSuggestion {
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  availableRooms: number;
  priceBreakdown: PriceBreakdown;
}

export interface RoomType {
  id: number;
  hotelId: number;
  name: string;
  description: string;
  basePricePerNight: number;
  currency: string;
  maxGuests: number;
  totalRooms: number;
  availableRooms: number | null;
  canAccommodateGuests: boolean;
  amenities: string[];
  priceBreakdown: PriceBreakdown | null;
  alternativeDates: AlternativeDateSuggestion[];
}
