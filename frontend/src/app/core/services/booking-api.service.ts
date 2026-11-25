import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BookingResponse,
  CancelBookingRequest,
  CreateBookingRequest
} from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/bookings`;

  createBooking(payload: CreateBookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(this.baseUrl, payload);
  }

  lookupBooking(reference: string, email: string): Observable<BookingResponse> {
    const params = new HttpParams()
      .set('reference', reference.trim())
      .set('email', email.trim());
    return this.http.get<BookingResponse>(`${this.baseUrl}/lookup`, { params });
  }

  cancelBooking(reference: string, payload: CancelBookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(
      `${this.baseUrl}/${encodeURIComponent(reference.trim())}/cancel`,
      payload
    );
  }
}
