import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { HotelDetailComponent } from './hotel-detail.component';
import { HotelApiService } from '../../../core/services/hotel-api.service';
import { addDaysIso, todayIso } from '../../../core/utils/date.util';

describe('HotelDetailComponent', () => {
  const tomorrow = addDaysIso(todayIso(), 1);
  const checkout = addDaysIso(todayIso(), 3);

  let hotelApiSpy: jasmine.SpyObj<HotelApiService>;

  beforeEach(async () => {
    hotelApiSpy = jasmine.createSpyObj('HotelApiService', ['getHotelById', 'getRoomsByHotel']);
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
    hotelApiSpy.getRoomsByHotel.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [HotelDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: '1' })),
            snapshot: {
              paramMap: convertToParamMap({ id: '1' }),
              queryParamMap: convertToParamMap({ checkIn: tomorrow, checkOut: checkout, guests: '2' })
            }
          }
        },
        { provide: HotelApiService, useValue: hotelApiSpy }
      ]
    }).compileComponents();
  });

  it('loads hotel overview and navigates to availability route with query params', () => {
    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigate');
    const fixture = TestBed.createComponent(HotelDetailComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.hotel?.name).toBe('The Taj Mahal Palace View');
    component.goToAvailability(10);

    expect(navSpy).toHaveBeenCalledWith(['/hotels', 1, 'availability'], {
      queryParams: {
        checkIn: tomorrow,
        checkOut: checkout,
        guests: 2,
        roomTypeId: 10
      }
    });
  });

  it('shows error message when route id param is invalid', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [HotelDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: 'invalid' })),
            snapshot: {
              paramMap: convertToParamMap({ id: 'invalid' }),
              queryParamMap: convertToParamMap({})
            }
          }
        },
        { provide: HotelApiService, useValue: hotelApiSpy }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(HotelDetailComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.hotelId).toBeNull();
    expect(component.errorMessage).toContain('Invalid hotel ID');
  });
});
