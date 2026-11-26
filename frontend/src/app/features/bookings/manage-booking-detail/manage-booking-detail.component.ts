import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BookingResponse } from '../../../core/models/booking.model';
import { BookingApiService } from '../../../core/services/booking-api.service';
import {
  extractErrorMessage,
  getBookingSessionEmail,
  saveBookingSessionEmail
} from '../../../core/utils/date.util';
import {
  BreadcrumbComponent,
  BreadcrumbItem
} from '../../../shared/components/breadcrumb/breadcrumb.component';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';

@Component({
  selector: 'app-manage-booking-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe,
    RouterLink,
    BreadcrumbComponent,
    ErrorBannerComponent
  ],
  templateUrl: './manage-booking-detail.component.html',
  styleUrl: './manage-booking-detail.component.scss'
})
export class ManageBookingDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly bookingApi = inject(BookingApiService);

  reference = '';
  booking: BookingResponse | null = null;
  loading = false;
  needsEmailVerification = false;
  confirmingCancel = false;
  cancelling = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  readonly verifyForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  get breadcrumbs(): BreadcrumbItem[] {
    return [
      { label: 'Explore Hotels', route: ['/hotels'] },
      { label: 'Manage Booking', route: ['/manage-booking'] },
      { label: this.reference || 'Booking Details' }
    ];
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const ref = (params.get('reference') ?? '').trim();
      this.reference = ref;
      this.errorMessage = null;
      this.successMessage = null;
      this.confirmingCancel = false;
      this.needsEmailVerification = false;

      if (!ref || ref.length < 4) {
        this.booking = null;
        this.errorMessage = 'Invalid booking reference format.';
        return;
      }

      const navStateBooking =
        typeof history !== 'undefined'
          ? ((history.state?.booking as BookingResponse | undefined) ?? null)
          : null;

      if (
        navStateBooking &&
        navStateBooking.bookingReference.toUpperCase() === ref.toUpperCase()
      ) {
        this.booking = navStateBooking;
        saveBookingSessionEmail(navStateBooking.bookingReference, navStateBooking.guestEmail);
      }

      const email =
        this.route.snapshot.queryParamMap.get('email')?.trim() ||
        navStateBooking?.guestEmail?.trim() ||
        getBookingSessionEmail(ref) ||
        '';

      if (email) {
        this.loadBooking(ref, email, false);
      } else if (!this.booking) {
        this.needsEmailVerification = true;
      }
    });
  }

  verifyAndLoad(): void {
    this.verifyForm.markAllAsTouched();
    if (this.verifyForm.invalid || !this.reference) {
      this.errorMessage = 'Please enter a valid guest email address.';
      return;
    }
    const email = (this.verifyForm.controls.email.value ?? '').trim();
    this.loadBooking(this.reference, email, true);
  }

  requestCancelStep(): void {
    this.confirmingCancel = true;
    this.errorMessage = null;
  }

  keepBooking(): void {
    if (!this.cancelling) {
      this.confirmingCancel = false;
    }
  }

  confirmCancellation(): void {
    if (!this.booking || this.cancelling || this.booking.status === 'CANCELLED') {
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
        this.syncHistoryState(updated);
        this.cancelling = false;
        this.confirmingCancel = false;
        this.successMessage =
          'Booking cancelled successfully. Room availability has been released immediately.';
        this.bookingApi.lookupBooking(ref, email).subscribe({
          next: (refreshed) => {
            this.booking = refreshed;
            this.syncHistoryState(refreshed);
          },
          error: () => {}
        });
      },
      error: (err) => {
        this.errorMessage = extractErrorMessage(err);
        this.cancelling = false;
        this.confirmingCancel = false;
      }
    });
  }

  private loadBooking(ref: string, email: string, syncUrl: boolean): void {
    this.loading = !this.booking;
    this.errorMessage = null;

    this.bookingApi.lookupBooking(ref, email).subscribe({
      next: (res) => {
        this.booking = res;
        this.syncHistoryState(res);
        this.loading = false;
        this.needsEmailVerification = false;
        saveBookingSessionEmail(res.bookingReference, res.guestEmail);
        if (syncUrl) {
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { email: res.guestEmail },
            replaceUrl: true
          });
        }
      },
      error: (err) => {
        this.booking = null;
        this.loading = false;
        this.errorMessage = extractErrorMessage(err);
      }
    });
  }

  private syncHistoryState(booking: BookingResponse): void {
    if (typeof history !== 'undefined' && typeof history.replaceState === 'function') {
      const currentState =
        history.state && typeof history.state === 'object' ? history.state : {};
      history.replaceState({ ...currentState, booking }, '');
    }
  }
}
