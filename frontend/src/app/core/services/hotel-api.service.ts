import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HotelDetail, HotelSummary, PageResponse, RoomType } from '../models/hotel.model';

export interface HotelSearchParams {
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class HotelApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/hotels`;

  searchHotels(filters: HotelSearchParams): Observable<PageResponse<HotelSummary>> {
    let params = new HttpParams()
      .set('guests', String(filters.guests ?? 1))
      .set('page', String(filters.page ?? 0))
      .set('size', String(filters.size ?? 5))
      .set('sortBy', filters.sortBy ?? 'starRating')
      .set('direction', filters.direction ?? 'desc');

    if (filters.city?.trim()) {
      params = params.set('city', filters.city.trim());
    }
    if (filters.checkIn && filters.checkOut) {
      params = params.set('checkIn', filters.checkIn).set('checkOut', filters.checkOut);
    }

    return this.http.get<PageResponse<HotelSummary>>(this.baseUrl, { params });
  }

  getCities(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/cities`);
  }

  getHotelById(hotelId: number): Observable<HotelDetail> {
    return this.http.get<HotelDetail>(`${this.baseUrl}/${hotelId}`);
  }

  getRoomsByHotel(
    hotelId: number,
    checkIn?: string,
    checkOut?: string,
    guests = 1
  ): Observable<RoomType[]> {
    let params = new HttpParams().set('guests', String(guests));
    if (checkIn && checkOut) {
      params = params.set('checkIn', checkIn).set('checkOut', checkOut);
    }
    return this.http.get<RoomType[]>(`${this.baseUrl}/${hotelId}/rooms`, { params });
  }
}
