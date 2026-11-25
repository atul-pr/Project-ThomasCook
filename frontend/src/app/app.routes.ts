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
    path: 'hotels/:id',
    loadComponent: () =>
      import('./features/hotels/hotel-detail/hotel-detail.component').then(
        (m) => m.HotelDetailComponent
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
