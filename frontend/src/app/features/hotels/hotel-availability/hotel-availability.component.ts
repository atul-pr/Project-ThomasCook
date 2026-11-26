import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { PriceSummaryComponent } from '../../../shared/components/price-summary/price-summary.component';

@Component({
  selector: 'app-hotel-availability',
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
    RouterLink,
    BreadcrumbComponent,
    ErrorBannerComponent,
    PriceSummaryComponent
  ],
  templateUrl: './hotel-availability.component.html',
  styleUrl: './hotel-availability.component.scss'
})
export class HotelAvailabilityComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly hotelApi = inject(HotelApiService);

  readonly minDate = todayIso();

  hotelId: number | null = null;
  highlightedRoomId: number | null = null;
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
      {
        label: this.hotel?.name || 'Hotel Details',
        route: this.hotelId ? ['/hotels', this.hotelId] : ['/hotels'],
        queryParams: this.dateQueryParams
      },
      { label: 'Room Availability' }
    ];
  }

  get dateQueryParams(): Record<string, string | number> {
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
      this.highlightedRoomId = parsePositiveIntParam(q.get('roomTypeId'));

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
        this.errorMessage = 'Invalid hotel ID. Please choose a hotel from Explore Hotels.';
        return;
      }

      this.hotelId = parsedId;
      this.errorMessage = null;
      this.loadHotel(parsedId);
      this.refreshAvailability(false);
    });
  }

  refreshAvailability(syncUrl = true): void {
    if (!this.hotelId) {
      return;
    }

    const dateError = validateDateRange(this.checkIn, this.checkOut);
    if (dateError) {
      this.errorMessage = dateError;
      return;
    }

    if (syncUrl) {
      this.syncQueryParams();
    }

    this.errorMessage = null;
    this.loadingRooms = true;

    this.hotelApi
      .getRoomsByHotel(this.hotelId, this.checkIn, this.checkOut, this.guests)
      .subscribe({
        next: (rooms) => {
          this.rooms = rooms;
          this.loadingRooms = false;
        },
        error: (err) => {
          this.errorMessage = extractErrorMessage(err);
          this.loadingRooms = false;
        }
      });
  }

  applyAlternativeDates(altCheckIn: string, altCheckOut: string, targetRoomId: number): void {
    this.checkIn = altCheckIn;
    this.checkOut = altCheckOut;
    this.highlightedRoomId = targetRoomId;
    this.refreshAvailability(true);
  }

  proceedToBooking(room: RoomType): void {
    if (!this.hotelId || !room.canAccommodateGuests || (room.availableRooms ?? 0) <= 0) {
      return;
    }
    this.router.navigate(['/booking', this.hotelId, room.id], {
      queryParams: this.dateQueryParams
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

  private syncQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        ...this.dateQueryParams,
        roomTypeId: this.highlightedRoomId ?? undefined
      },
      replaceUrl: true
    });
  }
}
