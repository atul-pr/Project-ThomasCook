import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
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
  selector: 'app-hotel-detail',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CurrencyPipe,
    RouterLink,
    ErrorBannerComponent,
    PriceSummaryComponent
  ],
  templateUrl: './hotel-detail.component.html',
  styleUrl: './hotel-detail.component.scss'
})
export class HotelDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
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
  private idempotencyKey = '';

  readonly bookingForm = this.fb.group(
    {
      guestName: ['', [Validators.required, Validators.maxLength(120)]],
      guestEmail: ['', [Validators.required, Validators.email, Validators.maxLength(180)]],
      guestPhone: ['', [Validators.maxLength(30)]],
      checkIn: [this.checkIn, [Validators.required]],
      checkOut: [this.checkOut, [Validators.required]],
      specialRequests: ['', [Validators.maxLength(500)]]
    },
    { validators: bookingDateGroupValidator }
  );

  loadingHotel = false;
  loadingRooms = false;
  submittingBooking = false;
  copiedReference = false;
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
      this.bookingForm.patchValue({ checkIn: qIn, checkOut: qOut }, { emitEvent: false });
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

    this.bookingForm.patchValue(
      { checkIn: this.checkIn, checkOut: this.checkOut },
      { emitEvent: false }
    );
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

  onBookingFormDateChange(): void {
    const formIn = this.bookingForm.controls.checkIn.value;
    const formOut = this.bookingForm.controls.checkOut.value;
    if (!formIn || !formOut) {
      return;
    }
    const err = validateDateRange(formIn, formOut);
    if (err) {
      return;
    }
    this.checkIn = formIn;
    this.checkOut = formOut;
    this.idempotencyKey = this.generateIdempotencyKey();
    this.refreshAvailability();
  }

  selectRoomForBooking(room: RoomType): void {
    this.confirmedBooking = null;
    this.errorMessage = null;
    this.copiedReference = false;
    this.selectedRoom = room;
    this.idempotencyKey = this.generateIdempotencyKey();
    this.bookingForm.patchValue({
      checkIn: this.checkIn,
      checkOut: this.checkOut
    });
  }

  applyAlternativeDates(altCheckIn: string, altCheckOut: string, targetRoomId: number): void {
    this.checkIn = altCheckIn;
    this.checkOut = altCheckOut;
    this.confirmedBooking = null;
    this.errorMessage = null;
    this.copiedReference = false;
    this.loadingRooms = true;
    this.idempotencyKey = this.generateIdempotencyKey();
    this.bookingForm.patchValue({ checkIn: altCheckIn, checkOut: altCheckOut });

    this.hotelApi.getRoomsByHotel(this.hotelId, this.checkIn, this.checkOut, this.guests).subscribe({
      next: (rooms) => {
        this.rooms = rooms;
        this.selectedRoom =
          rooms.find((r) => r.id === targetRoomId && (r.availableRooms ?? 0) > 0) ?? null;
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
    if (!this.selectedRoom || this.submittingBooking) {
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
          guests: this.guests,
          specialRequests: raw.specialRequests?.trim() || undefined
        },
        this.idempotencyKey
      )
      .subscribe({
        next: (booking) => {
          this.confirmedBooking = booking;
          this.submittingBooking = false;
          this.selectedRoom = null;
          this.idempotencyKey = '';
          this.bookingForm.reset({
            guestName: '',
            guestEmail: '',
            guestPhone: '',
            checkIn: this.checkIn,
            checkOut: this.checkOut,
            specialRequests: ''
          });
          this.refreshAvailability();
        },
        error: (err) => {
          if (err instanceof HttpErrorResponse && err.status === 409) {
            this.errorMessage = `${extractErrorMessage(err)} Check updated availability or select an alternative date below.`;
            this.idempotencyKey = this.generateIdempotencyKey();
          } else {
            this.errorMessage = extractErrorMessage(err);
          }
          this.submittingBooking = false;
          this.refreshAvailability();
        }
      });
  }

  copyReference(reference: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(reference).then(() => {
        this.copiedReference = true;
        setTimeout(() => (this.copiedReference = false), 2500);
      });
    }
  }

  private generateIdempotencyKey(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `stay-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
