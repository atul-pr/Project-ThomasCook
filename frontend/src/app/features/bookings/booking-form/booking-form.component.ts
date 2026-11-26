import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HotelDetail, RoomType } from '../../../core/models/hotel.model';
import { BookingApiService } from '../../../core/services/booking-api.service';
import { HotelApiService } from '../../../core/services/hotel-api.service';
import {
  addDaysIso,
  extractErrorMessage,
  parsePositiveIntParam,
  saveBookingSessionEmail,
  todayIso,
  validateDateRange
} from '../../../core/utils/date.util';
import {
  BreadcrumbComponent,
  BreadcrumbItem
} from '../../../shared/components/breadcrumb/breadcrumb.component';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';
import { PriceSummaryComponent } from '../../../shared/components/price-summary/price-summary.component';

function bookingDateGroupValidator(group: AbstractControl): ValidationErrors | null {
  const checkIn = group.get('checkIn')?.value as string | null;
  const checkOut = group.get('checkOut')?.value as string | null;
  if (!checkIn || !checkOut) {
    return null;
  }
  const msg = validateDateRange(checkIn, checkOut);
  return msg ? { dateRange: msg } : null;
}

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    RouterLink,
    BreadcrumbComponent,
    ErrorBannerComponent,
    PriceSummaryComponent
  ],
  templateUrl: './booking-form.component.html',
  styleUrl: './booking-form.component.scss'
})
export class BookingFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly hotelApi = inject(HotelApiService);
  private readonly bookingApi = inject(BookingApiService);

  readonly minDate = todayIso();

  hotelId: number | null = null;
  roomTypeId: number | null = null;
  hotel: HotelDetail | null = null;
  selectedRoom: RoomType | null = null;

  checkIn = addDaysIso(todayIso(), 1);
  checkOut = addDaysIso(todayIso(), 3);
  guests = 2;

  private idempotencyKey = '';

  readonly bookingForm = this.fb.group(
    {
      guestName: ['', [Validators.required, Validators.maxLength(120)]],
      guestEmail: ['', [Validators.required, Validators.email, Validators.maxLength(180)]],
      guestPhone: ['', [Validators.maxLength(30)]],
      checkIn: [this.checkIn, [Validators.required]],
      checkOut: [this.checkOut, [Validators.required]],
      guests: [this.guests, [Validators.required, Validators.min(1), Validators.max(10)]],
      specialRequests: ['', [Validators.maxLength(500)]]
    },
    { validators: bookingDateGroupValidator }
  );

  loadingHotel = false;
  loadingRoom = false;
  submittingBooking = false;
  errorMessage: string | null = null;

  get breadcrumbs(): BreadcrumbItem[] {
    return [
      { label: 'Explore Hotels', route: ['/hotels'] },
      {
        label: this.hotel?.name || 'Hotel Details',
        route: this.hotelId ? ['/hotels', this.hotelId] : ['/hotels'],
        queryParams: this.dateQueryParams
      },
      {
        label: 'Availability',
        route: this.hotelId ? ['/hotels', this.hotelId, 'availability'] : ['/hotels'],
        queryParams: this.dateQueryParams
      },
      { label: 'Guest Details & Booking' }
    ];
  }

  get dateQueryParams(): Record<string, string | number> {
    return {
      checkIn: this.checkIn,
      checkOut: this.checkOut,
      guests: this.guests
    };
  }

  get isRoomAvailable(): boolean {
    return (
      !!this.selectedRoom &&
      this.selectedRoom.canAccommodateGuests &&
      (this.selectedRoom.availableRooms ?? 0) > 0
    );
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const parsedHotelId = parsePositiveIntParam(params.get('hotelId'));
      const parsedRoomId = parsePositiveIntParam(params.get('roomTypeId'));
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

      this.bookingForm.patchValue(
        { checkIn: this.checkIn, checkOut: this.checkOut, guests: this.guests },
        { emitEvent: false }
      );

      if (!parsedHotelId || !parsedRoomId) {
        this.hotelId = parsedHotelId;
        this.roomTypeId = parsedRoomId;
        this.hotel = null;
        this.selectedRoom = null;
        this.errorMessage = 'Invalid hotel or room category identifier.';
        return;
      }

      this.hotelId = parsedHotelId;
      this.roomTypeId = parsedRoomId;
      this.idempotencyKey = this.generateIdempotencyKey();
      this.errorMessage = null;
      this.loadHotel(parsedHotelId);
      this.refreshRoomAvailability(false);
    });
  }

  onStayCriteriaChange(): void {
    const rawIn = this.bookingForm.controls.checkIn.value;
    const rawOut = this.bookingForm.controls.checkOut.value;
    const rawGuests = Number(this.bookingForm.controls.guests.value ?? 1);

    if (!rawIn || !rawOut || Number.isNaN(rawGuests)) {
      return;
    }

    const err = validateDateRange(rawIn, rawOut);
    if (err) {
      this.errorMessage = err;
      return;
    }

    this.checkIn = rawIn;
    this.checkOut = rawOut;
    this.guests = rawGuests;
    this.idempotencyKey = this.generateIdempotencyKey();
    this.refreshRoomAvailability(true);
  }

  applyAlternativeDates(altCheckIn: string, altCheckOut: string): void {
    this.checkIn = altCheckIn;
    this.checkOut = altCheckOut;
    this.bookingForm.patchValue(
      { checkIn: altCheckIn, checkOut: altCheckOut },
      { emitEvent: false }
    );
    this.idempotencyKey = this.generateIdempotencyKey();
    this.refreshRoomAvailability(true);
  }

  submitBooking(): void {
    if (!this.hotelId || !this.selectedRoom || this.submittingBooking || !this.isRoomAvailable) {
      return;
    }

    this.bookingForm.markAllAsTouched();
    if (this.bookingForm.invalid) {
      this.errorMessage =
        this.bookingForm.errors?.['dateRange'] ?? 'Please correct the highlighted fields.';
      return;
    }

    const raw = this.bookingForm.getRawValue();
    const checkInDate = raw.checkIn ?? this.checkIn;
    const checkOutDate = raw.checkOut ?? this.checkOut;
    const guestCount = Number(raw.guests ?? this.guests);

    this.errorMessage = null;
    this.submittingBooking = true;

    this.bookingApi
      .createBooking(
        {
          hotelId: this.hotelId,
          roomTypeId: this.selectedRoom.id,
          guestName: (raw.guestName ?? '').trim(),
          guestEmail: (raw.guestEmail ?? '').trim(),
          guestPhone: raw.guestPhone?.trim() || undefined,
          checkInDate,
          checkOutDate,
          guests: guestCount,
          specialRequests: raw.specialRequests?.trim() || undefined
        },
        this.idempotencyKey || this.generateIdempotencyKey()
      )
      .subscribe({
        next: (booking) => {
          this.submittingBooking = false;
          this.idempotencyKey = '';
          saveBookingSessionEmail(booking.bookingReference, booking.guestEmail);
          this.router.navigate(['/booking/confirmation', booking.bookingReference], {
            queryParams: { email: booking.guestEmail },
            state: { booking }
          });
        },
        error: (err) => {
          if (err instanceof HttpErrorResponse && err.status === 409) {
            this.errorMessage = `${extractErrorMessage(err)} Select updated dates or choose another room.`;
            this.idempotencyKey = this.generateIdempotencyKey();
          } else {
            this.errorMessage = extractErrorMessage(err);
          }
          this.submittingBooking = false;
          this.refreshRoomAvailability(false);
        }
      });
  }

  private loadHotel(hotelId: number): void {
    this.loadingHotel = true;
    this.hotel = null;
    this.hotelApi.getHotelById(hotelId).subscribe({
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

  private refreshRoomAvailability(syncUrl: boolean): void {
    if (!this.hotelId || !this.roomTypeId) {
      return;
    }

    const dateError = validateDateRange(this.checkIn, this.checkOut);
    if (dateError) {
      this.errorMessage = dateError;
      return;
    }

    if (syncUrl) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: this.dateQueryParams,
        replaceUrl: true
      });
    }

    this.loadingRoom = true;
    this.errorMessage = null;

    this.hotelApi.getRoomsByHotel(this.hotelId, this.checkIn, this.checkOut, this.guests).subscribe({
      next: (rooms) => {
        const match = rooms.find((r) => r.id === this.roomTypeId) ?? null;
        this.selectedRoom = match;
        if (!match) {
          this.errorMessage = 'Selected room category was not found for this property.';
        }
        this.loadingRoom = false;
      },
      error: (err) => {
        this.errorMessage = extractErrorMessage(err);
        this.loadingRoom = false;
      }
    });
  }

  private generateIdempotencyKey(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `stay-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
