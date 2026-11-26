import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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

  createBooking(payload: CreateBookingRequest, idempotencyKey?: string): Observable<BookingResponse> {
    let headers = new HttpHeaders();
    if (idempotencyKey?.trim()) {
      headers = headers.set('Idempotency-Key', idempotencyKey.trim());
    }
    return this.http.post<BookingResponse>(this.baseUrl, payload, { headers });
  }

  lookupBooking(reference: string, email: string): Observable<BookingResponse> {
    const params = new HttpParams().set('email', email.trim());
    return this.http.get<BookingResponse>(
      `${this.baseUrl}/${encodeURIComponent(reference.trim())}`,
      { params }
    );
  }

  cancelBooking(reference: string, payload: CancelBookingRequest): Observable<BookingResponse> {
    return this.http.patch<BookingResponse>(
      `${this.baseUrl}/${encodeURIComponent(reference.trim())}/cancel`,
      payload
    );
  }
}
