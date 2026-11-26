import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { ManageBookingComponent } from './manage-booking.component';
import { BookingApiService } from '../../../core/services/booking-api.service';

describe('ManageBookingComponent', () => {
  let bookingApiSpy: jasmine.SpyObj<BookingApiService>;

  const sampleBooking = {
    bookingReference: 'HTL-TEST1234',
    status: 'CONFIRMED' as const,
    hotelId: 1,
    hotelName: 'The Taj Mahal Palace View',
    hotelCity: 'Mumbai',
    roomTypeId: 1,
    roomTypeName: 'Deluxe City Room',
    guestName: 'Atul Prajapati',
    guestEmail: 'atul@example.com',
    guestPhone: null,
    checkInDate: '2026-12-10',
    checkOutDate: '2026-12-12',
    guests: 2,
    nights: 2,
    pricePerNightSnapshot: 11500,
    taxAmountSnapshot: 2760,
    totalAmountSnapshot: 25760,
    currency: 'INR',
    specialRequests: null,
    createdAt: new Date().toISOString(),
    cancelledAt: null
  };

  beforeEach(async () => {
    bookingApiSpy = jasmine.createSpyObj('BookingApiService', ['lookupBooking']);

    await TestBed.configureTestingModule({
      imports: [ManageBookingComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } }
        },
        { provide: BookingApiService, useValue: bookingApiSpy }
      ]
    }).compileComponents();
  });

  it('looks up booking and navigates to manage-booking/:reference', () => {
    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigate');
    bookingApiSpy.lookupBooking.and.returnValue(of(sampleBooking));

    const fixture = TestBed.createComponent(ManageBookingComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.lookupForm.setValue({ reference: 'htl-test1234', email: 'atul@example.com' });
    component.lookup();

    expect(bookingApiSpy.lookupBooking).toHaveBeenCalledWith('HTL-TEST1234', 'atul@example.com');
    expect(navSpy).toHaveBeenCalledWith(['/manage-booking', 'HTL-TEST1234'], {
      queryParams: { email: 'atul@example.com' },
      state: { booking: sampleBooking }
    });
  });
});
