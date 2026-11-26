import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HotelDetail, RoomType } from '../../../core/models/hotel.model';
import { HotelApiService } from '../../../core/services/hotel-api.service';
import {
  addDaysIso,
  extractErrorMessage,
  parsePositiveIntParam,
  todayIso,
  validateDateRange
} from '../../../core/utils/date.util';
import {
  BreadcrumbComponent,
  BreadcrumbItem
} from '../../../shared/components/breadcrumb/breadcrumb.component';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';

@Component({
  selector: 'app-hotel-detail',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, BreadcrumbComponent, ErrorBannerComponent],
  templateUrl: './hotel-detail.component.html',
  styleUrl: './hotel-detail.component.scss'
})
export class HotelDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly hotelApi = inject(HotelApiService);

  hotelId: number | null = null;
  hotel: HotelDetail | null = null;
  rooms: RoomType[] = [];

  checkIn = addDaysIso(todayIso(), 1);
  checkOut = addDaysIso(todayIso(), 3);
  guests = 2;

  loadingHotel = false;
  loadingRooms = false;
  errorMessage: string | null = null;

  get breadcrumbs(): BreadcrumbItem[] {
    return [
      { label: 'Explore Hotels', route: ['/hotels'] },
      { label: this.hotel?.name || 'Hotel Details' }
    ];
  }

  get availabilityQueryParams(): Record<string, string | number> {
    return {
      checkIn: this.checkIn,
      checkOut: this.checkOut,
      guests: this.guests
    };
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const parsedId = parsePositiveIntParam(params.get('id'));
      const q = this.route.snapshot.queryParamMap;
      const qIn = q.get('checkIn');
      const qOut = q.get('checkOut');
      const qGuests = Number(q.get('guests'));

      if (qIn && qOut && !validateDateRange(qIn, qOut)) {
        this.checkIn = qIn;
        this.checkOut = qOut;
      }
      if (!Number.isNaN(qGuests) && qGuests >= 1 && qGuests <= 10) {
        this.guests = qGuests;
      }

      if (!parsedId) {
        this.hotelId = null;
        this.hotel = null;
        this.rooms = [];
        this.errorMessage = 'Invalid hotel ID. Please choose a property from Explore Hotels.';
        return;
      }

      this.hotelId = parsedId;
      this.errorMessage = null;
      this.loadHotel(parsedId);
      this.loadRoomCategories(parsedId);
    });
  }

  goToAvailability(roomTypeId?: number): void {
    if (!this.hotelId) {
      return;
    }
    this.router.navigate(['/hotels', this.hotelId, 'availability'], {
      queryParams: roomTypeId
        ? { ...this.availabilityQueryParams, roomTypeId }
        : this.availabilityQueryParams
    });
  }

  private loadHotel(id: number): void {
    this.loadingHotel = true;
    this.hotel = null;
    this.hotelApi.getHotelById(id).subscribe({
      next: (hotel) => {
        this.hotel = hotel;
        this.loadingHotel = false;
      },
      error: (err) => {
        this.errorMessage = extractErrorMessage(err);
        this.loadingHotel = false;
      }
    });
  }

  private loadRoomCategories(id: number): void {
    this.loadingRooms = true;
    this.rooms = [];
    this.hotelApi.getRoomsByHotel(id, this.checkIn, this.checkOut, this.guests).subscribe({
      next: (rooms) => {
        this.rooms = rooms;
        this.loadingRooms = false;
      },
      error: () => {
        this.loadingRooms = false;
      }
    });
  }
}
