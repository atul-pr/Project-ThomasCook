import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BookingResponse } from '../../../core/models/booking.model';
import { HotelDetail, RoomType } from '../../../core/models/hotel.model';
import { BookingApiService } from '../../../core/services/booking-api.service';
import { HotelApiService } from '../../../core/services/hotel-api.service';
import {
  addDaysIso,
  extractErrorMessage,
  todayIso,
  validateDateRange
} from '../../../core/utils/date.util';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';
import { PriceSummaryComponent } from '../../../shared/components/price-summary/price-summary.component';

@Component({
  selector: 'app-hotel-detail',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, RouterLink, ErrorBannerComponent, PriceSummaryComponent],
  templateUrl: './hotel-detail.component.html',
  styleUrl: './hotel-detail.component.scss'
})
export class HotelDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly hotelApi = inject(HotelApiService);
  private readonly bookingApi = inject(BookingApiService);

  readonly minDate = todayIso();

  hotelId = 0;
  hotel: HotelDetail | null = null;
  rooms: RoomType[] = [];

  checkIn = addDaysIso(todayIso(), 1);
  checkOut = addDaysIso(todayIso(), 3);
  guests = 2;

  selectedRoom: RoomType | null = null;
  guestName = '';
  guestEmail = '';
  guestPhone = '';
  specialRequests = '';

  loadingHotel = false;
  loadingRooms = false;
  submittingBooking = false;
  errorMessage: string | null = null;
  confirmedBooking: BookingResponse | null = null;

  ngOnInit(): void {
    this.hotelId = Number(this.route.snapshot.paramMap.get('id'));
    const qIn = this.route.snapshot.queryParamMap.get('checkIn');
    const qOut = this.route.snapshot.queryParamMap.get('checkOut');
    const qGuests = Number(this.route.snapshot.queryParamMap.get('guests'));

    if (qIn && qOut && !validateDateRange(qIn, qOut)) {
      this.checkIn = qIn;
      this.checkOut = qOut;
    }
    if (!Number.isNaN(qGuests) && qGuests >= 1 && qGuests <= 10) {
      this.guests = qGuests;
    }

    this.loadHotel();
    this.refreshAvailability();
  }

  loadHotel(): void {
    this.loadingHotel = true;
    this.hotelApi.getHotelById(this.hotelId).subscribe({
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

  refreshAvailability(): void {
    const dateError = validateDateRange(this.checkIn, this.checkOut);
    if (dateError) {
      this.errorMessage = dateError;
      return;
    }

    this.errorMessage = null;
    this.loadingRooms = true;

    this.hotelApi.getRoomsByHotel(this.hotelId, this.checkIn, this.checkOut, this.guests).subscribe({
      next: (rooms) => {
        this.rooms = rooms;
        if (this.selectedRoom) {
          this.selectedRoom = rooms.find((r) => r.id === this.selectedRoom?.id) ?? null;
        }
        this.loadingRooms = false;
      },
      error: (err) => {
        this.errorMessage = extractErrorMessage(err);
        this.loadingRooms = false;
      }
    });
  }

  selectRoomForBooking(room: RoomType): void {
    this.confirmedBooking = null;
    this.errorMessage = null;
    this.selectedRoom = room;
  }

  applyAlternativeDates(altCheckIn: string, altCheckOut: string, targetRoomId: number): void {
    this.checkIn = altCheckIn;
    this.checkOut = altCheckOut;
    this.confirmedBooking = null;
    this.errorMessage = null;
    this.loadingRooms = true;

    this.hotelApi.getRoomsByHotel(this.hotelId, this.checkIn, this.checkOut, this.guests).subscribe({
      next: (rooms) => {
        this.rooms = rooms;
        const target = rooms.find((r) => r.id === targetRoomId && (r.availableRooms ?? 0) > 0) ?? null;
        this.selectedRoom = target;
        this.loadingRooms = false;
      },
      error: (err) => {
        this.errorMessage = extractErrorMessage(err);
        this.loadingRooms = false;
      }
    });
  }

  cancelSelection(): void {
    this.selectedRoom = null;
  }

  submitBooking(): void {
    if (!this.selectedRoom) {
      return;
    }
    const dateError = validateDateRange(this.checkIn, this.checkOut);
    if (dateError) {
      this.errorMessage = dateError;
      return;
    }
    if (!this.guestName.trim() || !this.guestEmail.trim()) {
      this.errorMessage = 'Guest name and email are required.';
      return;
    }

    this.errorMessage = null;
    this.submittingBooking = true;

    this.bookingApi
      .createBooking({
        roomTypeId: this.selectedRoom.id,
        guestName: this.guestName.trim(),
        guestEmail: this.guestEmail.trim(),
        guestPhone: this.guestPhone.trim() || undefined,
        checkInDate: this.checkIn,
        checkOutDate: this.checkOut,
        guests: this.guests,
        specialRequests: this.specialRequests.trim() || undefined
      })
      .subscribe({
        next: (booking) => {
          this.confirmedBooking = booking;
          this.submittingBooking = false;
          this.selectedRoom = null;
          this.guestName = '';
          this.guestPhone = '';
          this.specialRequests = '';
          this.refreshAvailability();
        },
        error: (err) => {
          this.errorMessage = extractErrorMessage(err);
          this.submittingBooking = false;
          this.refreshAvailability();
        }
      });
  }
}
