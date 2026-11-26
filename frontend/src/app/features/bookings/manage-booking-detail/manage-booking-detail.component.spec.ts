import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { ManageBookingDetailComponent } from './manage-booking-detail.component';
import { BookingApiService } from '../../../core/services/booking-api.service';

describe('ManageBookingDetailComponent', () => {
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
      imports: [ManageBookingDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ reference: 'HTL-TEST1234' })),
            snapshot: {
              paramMap: convertToParamMap({ reference: 'HTL-TEST1234' }),
              queryParamMap: convertToParamMap({ email: 'atul@example.com' })
            }
          }
        },
        { provide: BookingApiService, useValue: bookingApiSpy }
      ]
    }).compileComponents();
  });

  it('loads booking by reference and confirms cancellation on the dedicated page', () => {
    const cancelledBooking = {
      ...sampleBooking,
      status: 'CANCELLED' as const,
      cancelledAt: new Date().toISOString()
    };
    bookingApiSpy.lookupBooking.and.returnValues(of(sampleBooking), of(cancelledBooking));
    bookingApiSpy.cancelBooking.and.returnValue(of(cancelledBooking));

    const fixture = TestBed.createComponent(ManageBookingDetailComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.booking?.status).toBe('CONFIRMED');

    component.requestCancelStep();
    expect(component.confirmingCancel).toBeTrue();

    component.confirmCancellation();
    expect(bookingApiSpy.cancelBooking).toHaveBeenCalledWith('HTL-TEST1234', {
      email: 'atul@example.com'
    });
    expect(component.booking?.status).toBe('CANCELLED');
    expect(component.confirmingCancel).toBeFalse();
  });
});
