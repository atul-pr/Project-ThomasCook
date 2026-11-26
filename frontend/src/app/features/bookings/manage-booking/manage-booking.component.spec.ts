import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router';
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
    bookingApiSpy = jasmine.createSpyObj('BookingApiService', ['lookupBooking', 'cancelBooking']);

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

  it('opens confirmation dialog and refreshes status after cancellation', () => {
    const cancelledBooking = {
      ...sampleBooking,
      status: 'CANCELLED' as const,
      cancelledAt: new Date().toISOString()
    };
    bookingApiSpy.lookupBooking.and.returnValues(of(sampleBooking), of(cancelledBooking));
    bookingApiSpy.cancelBooking.and.returnValue(of(cancelledBooking));

    const fixture = TestBed.createComponent(ManageBookingComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.lookupForm.setValue({ reference: 'HTL-TEST1234', email: 'atul@example.com' });
    component.lookup();
    expect(component.booking?.status).toBe('CONFIRMED');

    component.openCancelDialog();
    expect(component.cancelDialogOpen).toBeTrue();

    component.confirmCancellation();
    expect(bookingApiSpy.cancelBooking).toHaveBeenCalledWith('HTL-TEST1234', {
      email: 'atul@example.com'
    });
    expect(component.booking?.status).toBe('CANCELLED');
    expect(component.cancelDialogOpen).toBeFalse();
  });
});
