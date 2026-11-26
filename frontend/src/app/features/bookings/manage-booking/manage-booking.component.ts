import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BookingResponse } from '../../../core/models/booking.model';
import { BookingApiService } from '../../../core/services/booking-api.service';
import { extractErrorMessage } from '../../../core/utils/date.util';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';

@Component({
  selector: 'app-manage-booking',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, RouterLink, ErrorBannerComponent],
  templateUrl: './manage-booking.component.html',
  styleUrl: './manage-booking.component.scss'
})
export class ManageBookingComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly bookingApi = inject(BookingApiService);
  private readonly route = inject(ActivatedRoute);

  readonly lookupForm = this.fb.group({
    reference: ['', [Validators.required, Validators.minLength(4)]],
    email: ['', [Validators.required, Validators.email]]
  });

  booking: BookingResponse | null = null;
  loading = false;
  cancelling = false;
  cancelDialogOpen = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  ngOnInit(): void {
    const qRef = this.route.snapshot.queryParamMap.get('reference');
    const qEmail = this.route.snapshot.queryParamMap.get('email');
    if (qRef && qEmail) {
      this.lookupForm.patchValue({ reference: qRef, email: qEmail });
      this.lookup();
    }
  }

  lookup(): void {
    this.lookupForm.markAllAsTouched();
    if (this.lookupForm.invalid) {
      this.errorMessage = 'Please enter a valid booking reference and guest email address.';
      return;
    }

    const reference = (this.lookupForm.controls.reference.value ?? '').trim();
    const email = (this.lookupForm.controls.email.value ?? '').trim();

    this.errorMessage = null;
    this.successMessage = null;
    this.cancelDialogOpen = false;
    this.loading = true;

    this.bookingApi.lookupBooking(reference, email).subscribe({
      next: (res) => {
        this.booking = res;
        this.loading = false;
      },
      error: (err) => {
        this.booking = null;
        this.errorMessage = extractErrorMessage(err);
        this.loading = false;
      }
    });
  }

  openCancelDialog(): void {
    this.cancelDialogOpen = true;
  }

  closeCancelDialog(): void {
    if (!this.cancelling) {
      this.cancelDialogOpen = false;
    }
  }

  confirmCancellation(): void {
    if (!this.booking || this.cancelling) {
      return;
    }
    const ref = this.booking.bookingReference;
    const email = this.booking.guestEmail;

    this.cancelling = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.bookingApi.cancelBooking(ref, { email }).subscribe({
      next: (updated) => {
        this.booking = updated;
        this.cancelling = false;
        this.cancelDialogOpen = false;
        this.successMessage =
          'Booking cancelled successfully. Room availability has been released immediately.';
        this.bookingApi.lookupBooking(ref, email).subscribe({
          next: (refreshed) => (this.booking = refreshed),
          error: () => {}
        });
      },
      error: (err) => {
        this.errorMessage = extractErrorMessage(err);
        this.cancelling = false;
        this.cancelDialogOpen = false;
      }
    });
  }
}
