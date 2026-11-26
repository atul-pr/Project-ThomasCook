import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { HotelSearchComponent } from './hotel-search.component';
import { HotelApiService } from '../../../core/services/hotel-api.service';

describe('HotelSearchComponent', () => {
  let hotelApiSpy: jasmine.SpyObj<HotelApiService>;

  beforeEach(async () => {
    hotelApiSpy = jasmine.createSpyObj('HotelApiService', [
      'searchHotels',
      'getCities',
      'getFilterMetadata'
    ]);

    hotelApiSpy.getCities.and.returnValue(of(['Mumbai', 'Goa', 'Jaipur']));
    hotelApiSpy.getFilterMetadata.and.returnValue(
      of({
        minPricePerNight: 5800,
        maxPricePerNight: 32000,
        currency: 'INR',
        amenities: ['Free Wi-Fi', 'Pool', 'Spa']
      })
    );
    hotelApiSpy.searchHotels.and.returnValue(
      of({
        content: [],
        page: 0,
        size: 5,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true
      })
    );

    await TestBed.configureTestingModule({
      imports: [HotelSearchComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(convertToParamMap({})),
            snapshot: { queryParamMap: convertToParamMap({}) }
          }
        },
        { provide: HotelApiService, useValue: hotelApiSpy }
      ]
    }).compileComponents();
  });

  it('derives dynamic slider bounds from filter metadata and forwards combined filters to API', () => {
    const fixture = TestBed.createComponent(HotelSearchComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.sliderMax).toBe(32000);
    expect(component.availableAmenities).toEqual(['Free Wi-Fi', 'Pool', 'Spa']);

    component.city = 'Goa';
    component.applyPanelFilters({
      minPrice: 5000,
      maxPrice: 10000,
      minRating: 5,
      amenities: ['Pool']
    });

    const lastCall = hotelApiSpy.searchHotels.calls.mostRecent().args[0];
    expect(lastCall.city).toBe('Goa');
    expect(lastCall.minPrice).toBe(5000);
    expect(lastCall.maxPrice).toBe(10000);
    expect(lastCall.minRating).toBe(5);
    expect(lastCall.amenities).toEqual(['Pool']);

    component.clearAllFilters();
    const resetCall = hotelApiSpy.searchHotels.calls.mostRecent().args[0];
    expect(resetCall.city).toBe('');
    expect(resetCall.minPrice).toBeNull();
    expect(resetCall.maxPrice).toBeNull();
    expect(resetCall.minRating).toBeNull();
    expect(resetCall.amenities).toEqual([]);
  });
});
