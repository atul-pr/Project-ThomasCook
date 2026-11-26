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
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe,
    RouterLink,
    BreadcrumbComponent,
    ErrorBannerComponent
  ],
  templateUrl: './booking-confirmation.component.html',
  styleUrl: './booking-confirmation.component.scss'
})
export class BookingConfirmationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly bookingApi = inject(BookingApiService);

  reference = '';
  booking: BookingResponse | null = null;
  loading = false;
  needsEmailVerification = false;
  copiedReference = false;
  errorMessage: string | null = null;

  readonly verifyForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  get breadcrumbs(): BreadcrumbItem[] {
    const items: BreadcrumbItem[] = [{ label: 'Explore Hotels', route: ['/hotels'] }];
    if (this.booking) {
      items.push({
        label: this.booking.hotelName,
        route: ['/hotels', this.booking.hotelId]
      });
    }
    items.push({ label: this.reference ? `Confirmation (${this.reference})` : 'Confirmation' });
    return items;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const ref = (params.get('reference') ?? '').trim();
      this.reference = ref;
      this.copiedReference = false;
      this.errorMessage = null;
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
        this.fetchConfirmation(ref, email, false);
      } else if (!this.booking) {
        this.needsEmailVerification = true;
      }
    });
  }

  verifyAndLoad(): void {
    this.verifyForm.markAllAsTouched();
    if (this.verifyForm.invalid || !this.reference) {
      this.errorMessage = 'Please enter the guest email address used for this booking.';
      return;
    }
    const email = (this.verifyForm.controls.email.value ?? '').trim();
    this.fetchConfirmation(this.reference, email, true);
  }

  copyReference(reference: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(reference).then(() => {
        this.copiedReference = true;
        setTimeout(() => (this.copiedReference = false), 2500);
      });
    }
  }

  goToManageBooking(): void {
    if (!this.booking) {
      return;
    }
    this.router.navigate(['/manage-booking', this.booking.bookingReference], {
      queryParams: { email: this.booking.guestEmail },
      state: { booking: this.booking }
    });
  }

  private fetchConfirmation(ref: string, email: string, syncUrl: boolean): void {
    this.loading = !this.booking;
    this.errorMessage = null;

    this.bookingApi.lookupBooking(ref, email).subscribe({
      next: (res) => {
        this.booking = res;
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
}
