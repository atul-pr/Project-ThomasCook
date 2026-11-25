import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BookingResponse } from '../../../core/models/booking.model';
import { BookingApiService } from '../../../core/services/booking-api.service';
import { extractErrorMessage } from '../../../core/utils/date.util';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';

@Component({
  selector: 'app-manage-booking',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe, RouterLink, ErrorBannerComponent],
  templateUrl: './manage-booking.component.html',
  styleUrl: './manage-booking.component.scss'
})
export class ManageBookingComponent implements OnInit {
  private readonly bookingApi = inject(BookingApiService);
  private readonly route = inject(ActivatedRoute);

  reference = '';
  email = '';

  booking: BookingResponse | null = null;
  loading = false;
  cancelling = false;
  confirmCancelOpen = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  ngOnInit(): void {
    const qRef = this.route.snapshot.queryParamMap.get('reference');
    const qEmail = this.route.snapshot.queryParamMap.get('email');
    if (qRef && qEmail) {
      this.reference = qRef;
      this.email = qEmail;
      this.lookup();
    }
  }

  lookup(): void {
    if (!this.reference.trim() || !this.email.trim()) {
      this.errorMessage = 'Please enter both your booking reference and guest email.';
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    this.confirmCancelOpen = false;
    this.loading = true;

    this.bookingApi.lookupBooking(this.reference, this.email).subscribe({
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

  confirmCancellation(): void {
    if (!this.booking) {
      return;
    }
    this.cancelling = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.bookingApi
      .cancelBooking(this.booking.bookingReference, { email: this.booking.guestEmail })
      .subscribe({
        next: (updated) => {
          this.booking = updated;
          this.cancelling = false;
          this.confirmCancelOpen = false;
          this.successMessage =
            'Booking cancelled successfully. Room availability has been released.';
        },
        error: (err) => {
          this.errorMessage = extractErrorMessage(err);
          this.cancelling = false;
        }
      });
  }
}
