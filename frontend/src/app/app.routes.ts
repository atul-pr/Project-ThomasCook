import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'hotels'
  },
  {
    path: 'hotels',
    loadComponent: () =>
      import('./features/hotels/hotel-search/hotel-search.component').then(
        (m) => m.HotelSearchComponent
      )
  },
  {
    path: 'hotels/:id/availability',
    loadComponent: () =>
      import('./features/hotels/hotel-availability/hotel-availability.component').then(
        (m) => m.HotelAvailabilityComponent
      )
  },
  {
    path: 'hotels/:id',
    loadComponent: () =>
      import('./features/hotels/hotel-detail/hotel-detail.component').then(
        (m) => m.HotelDetailComponent
      )
  },
  {
    path: 'booking/confirmation/:reference',
    loadComponent: () =>
      import('./features/bookings/booking-confirmation/booking-confirmation.component').then(
        (m) => m.BookingConfirmationComponent
      )
  },
  {
    path: 'booking/:hotelId/:roomTypeId',
    loadComponent: () =>
      import('./features/bookings/booking-form/booking-form.component').then(
        (m) => m.BookingFormComponent
      )
  },
  {
    path: 'manage-booking/:reference',
    loadComponent: () =>
      import('./features/bookings/manage-booking-detail/manage-booking-detail.component').then(
        (m) => m.ManageBookingDetailComponent
      )
  },
  {
    path: 'manage-booking',
    loadComponent: () =>
      import('./features/bookings/manage-booking/manage-booking.component').then(
        (m) => m.ManageBookingComponent
      )
  },
  {
    path: 'about',
    data: { kind: 'about' },
    loadComponent: () =>
      import('./features/info/info-page.component').then((m) => m.InfoPageComponent)
  },
  {
    path: 'privacy',
    data: { kind: 'privacy' },
    loadComponent: () =>
      import('./features/info/info-page.component').then((m) => m.InfoPageComponent)
  },
  {
    path: 'terms',
    data: { kind: 'terms' },
    loadComponent: () =>
      import('./features/info/info-page.component').then((m) => m.InfoPageComponent)
  },
  {
    path: '**',
    redirectTo: 'hotels'
  }
];
