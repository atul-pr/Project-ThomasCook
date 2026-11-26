import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { HotelDetailComponent } from './hotel-detail.component';
import { HotelApiService } from '../../../core/services/hotel-api.service';
import { BookingApiService } from '../../../core/services/booking-api.service';
import { addDaysIso, todayIso } from '../../../core/utils/date.util';

describe('HotelDetailComponent', () => {
  const tomorrow = addDaysIso(todayIso(), 1);
  const checkout = addDaysIso(todayIso(), 3);

  const mockRoom = {
    id: 1,
    hotelId: 1,
    name: 'Deluxe City Room',
    description: 'King bed',
    basePricePerNight: 11500,
    currency: 'INR',
    maxGuests: 2,
    totalRooms: 4,
    availableRooms: 4,
    canAccommodateGuests: true,
    amenities: ['Wi-Fi'],
    priceBreakdown: {
      nights: 2,
      pricePerNight: 11500,
      subtotal: 23000,
      taxRate: 0.12,
      taxAmount: 2760,
      totalAmount: 25760,
      currency: 'INR'
    },
    alternativeDates: []
  };

  let hotelApiSpy: jasmine.SpyObj<HotelApiService>;
  let bookingApiSpy: jasmine.SpyObj<BookingApiService>;

  beforeEach(async () => {
    hotelApiSpy = jasmine.createSpyObj('HotelApiService', ['getHotelById', 'getRoomsByHotel']);
    bookingApiSpy = jasmine.createSpyObj('BookingApiService', ['createBooking']);

    hotelApiSpy.getHotelById.and.returnValue(
      of({
        id: 1,
        name: 'The Taj Mahal Palace View',
        city: 'Mumbai',
        country: 'India',
        address: 'Colaba',
        description: 'Heritage hotel',
        starRating: 5,
        amenities: ['Pool'],
        imageUrl: '/assets/images/hotel-mumbai.jpg'
      })
    );
    hotelApiSpy.getRoomsByHotel.and.returnValue(of([mockRoom]));

    await TestBed.configureTestingModule({
      imports: [HotelDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: '1' }),
              queryParamMap: convertToParamMap({ checkIn: tomorrow, checkOut: checkout, guests: '2' })
            }
          }
        },
        { provide: HotelApiService, useValue: hotelApiSpy },
        { provide: BookingApiService, useValue: bookingApiSpy }
      ]
    }).compileComponents();
  });

  it('validates reactive booking form fields before calling createBooking', () => {
    const fixture = TestBed.createComponent(HotelDetailComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.selectRoomForBooking(mockRoom);
    component.submitBooking();

    expect(component.bookingForm.invalid).toBeTrue();
    expect(bookingApiSpy.createBooking).not.toHaveBeenCalled();
  });

  it('submits valid booking with hotelId and Idempotency-Key header', () => {
    bookingApiSpy.createBooking.and.returnValue(
      of({
        bookingReference: 'HTL-TEST1234',
        status: 'CONFIRMED',
        hotelId: 1,
        hotelName: 'The Taj Mahal Palace View',
        hotelCity: 'Mumbai',
        roomTypeId: 1,
        roomTypeName: 'Deluxe City Room',
        guestName: 'Atul Prajapati',
        guestEmail: 'atul@example.com',
        guestPhone: null,
        checkInDate: tomorrow,
        checkOutDate: checkout,
        guests: 2,
        nights: 2,
        pricePerNightSnapshot: 11500,
        taxAmountSnapshot: 2760,
        totalAmountSnapshot: 25760,
        currency: 'INR',
        specialRequests: null,
        createdAt: new Date().toISOString(),
        cancelledAt: null
      })
    );

    const fixture = TestBed.createComponent(HotelDetailComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.selectRoomForBooking(mockRoom);
    component.bookingForm.patchValue({
      guestName: 'Atul Prajapati',
      guestEmail: 'atul@example.com'
    });
    component.submitBooking();

    expect(bookingApiSpy.createBooking).toHaveBeenCalledTimes(1);
    const [payload, idemKey] = bookingApiSpy.createBooking.calls.mostRecent().args;
    expect(payload.hotelId).toBe(1);
    expect(payload.roomTypeId).toBe(1);
    expect(idemKey).toBeTruthy();
    expect(component.confirmedBooking?.bookingReference).toBe('HTL-TEST1234');
  });
});
