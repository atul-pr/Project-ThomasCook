import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingApiService } from '../../../core/services/booking-api.service';
import { extractErrorMessage, saveBookingSessionEmail } from '../../../core/utils/date.util';
import {
  BreadcrumbComponent,
  BreadcrumbItem
} from '../../../shared/components/breadcrumb/breadcrumb.component';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';

@Component({
  selector: 'app-manage-booking',
  standalone: true,
  imports: [ReactiveFormsModule, BreadcrumbComponent, ErrorBannerComponent],
  templateUrl: './manage-booking.component.html',
  styleUrl: './manage-booking.component.scss'
})
export class ManageBookingComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly bookingApi = inject(BookingApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Explore Hotels', route: ['/hotels'] },
    { label: 'Manage Booking' }
  ];

  readonly lookupForm = this.fb.group({
    reference: ['', [Validators.required, Validators.minLength(4)]],
    email: ['', [Validators.required, Validators.email]]
  });

  loading = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    const qRef = this.route.snapshot.queryParamMap.get('reference');
    const qEmail = this.route.snapshot.queryParamMap.get('email');
    if (qRef && qEmail) {
      this.lookupForm.patchValue({ reference: qRef, email: qEmail });
      this.lookup();
    } else if (qRef) {
      this.lookupForm.patchValue({ reference: qRef });
    }
  }

  lookup(): void {
    this.lookupForm.markAllAsTouched();
    if (this.lookupForm.invalid) {
      this.errorMessage = 'Please enter a valid booking reference and guest email address.';
      return;
    }

    const reference = (this.lookupForm.controls.reference.value ?? '').trim().toUpperCase();
    const email = (this.lookupForm.controls.email.value ?? '').trim();

    this.errorMessage = null;
    this.loading = true;

    this.bookingApi.lookupBooking(reference, email).subscribe({
      next: (booking) => {
        this.loading = false;
        saveBookingSessionEmail(booking.bookingReference, booking.guestEmail);
        this.router.navigate(['/manage-booking', booking.bookingReference], {
          queryParams: { email: booking.guestEmail },
          state: { booking }
        });
      },
      error: (err) => {
        this.errorMessage = extractErrorMessage(err);
        this.loading = false;
      }
    });
  }
}
