import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HotelSummary, PageResponse } from '../../../core/models/hotel.model';
import { HotelApiService } from '../../../core/services/hotel-api.service';
import {
  addDaysIso,
  extractErrorMessage,
  todayIso,
  validateDateRange
} from '../../../core/utils/date.util';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import {
  AppliedHotelFilters,
  HotelFilterPanelComponent
} from '../hotel-filter-panel/hotel-filter-panel.component';

export type TravelCategoryId =
  | 'all'
  | 'family'
  | 'business'
  | 'couples'
  | 'beach'
  | 'luxury';

interface TravelCategory {
  id: TravelCategoryId;
  label: string;
  subtitle: string;
}

@Component({
  selector: 'app-hotel-search',
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
    ErrorBannerComponent,
    RevealDirective,
    HotelFilterPanelComponent
  ],
  templateUrl: './hotel-search.component.html',
  styleUrl: './hotel-search.component.scss'
})
export class HotelSearchComponent implements OnInit {
  private readonly hotelApi = inject(HotelApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly minDate = todayIso();

  readonly travelCategories: TravelCategory[] = [
    { id: 'all', label: 'All Stays', subtitle: 'Full collection' },
    { id: 'family', label: 'Family Stays', subtitle: '4+ guest suites' },
    { id: 'business', label: 'Business Travel', subtitle: 'Bengaluru hubs' },
    { id: 'couples', label: 'Couples', subtitle: '2-guest getaways' },
    { id: 'beach', label: 'Beach Holidays', subtitle: 'Goa coastline' },
    { id: 'luxury', label: 'Luxury Stays', subtitle: '5-star flagships' }
  ];

  activeCategory: TravelCategoryId = 'all';
  city = '';
  checkIn = addDaysIso(todayIso(), 1);
  checkOut = addDaysIso(todayIso(), 3);
  guests = 2;
  sortOption = 'starRating,desc';
  page = 0;
  readonly pageSize = 5;

  minPrice: number | null = null;
  maxPrice: number | null = null;
  minRating: number | null = null;
  selectedAmenities: string[] = [];

  sliderMin = 0;
  sliderMax = 35000;
  availableAmenities: string[] = [];
  mobileFiltersOpen = false;

  cities: string[] = [];
  allHotels: HotelSummary[] = [];
  hotelPage: PageResponse<HotelSummary> | null = null;
  loading = false;
  errorMessage: string | null = null;

  get recommendedHotels(): HotelSummary[] {
    return this.allHotels.filter((h) => h.starRating >= 5).slice(0, 3);
  }

  get hasActiveFilters(): boolean {
    return (
      !!this.city.trim() ||
      this.minPrice !== null ||
      this.maxPrice !== null ||
      this.minRating !== null ||
      this.selectedAmenities.length > 0 ||
      this.activeCategory !== 'all'
    );
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.city.trim()) count++;
    if (this.minPrice !== null || this.maxPrice !== null) count++;
    if (this.minRating !== null) count++;
    count += this.selectedAmenities.length;
    return count;
  }

  get activePriceLabel(): string | null {
    if (this.minPrice === null && this.maxPrice === null) {
      return null;
    }
    const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
    if (this.minPrice !== null && this.maxPrice !== null) {
      return `Price: ${fmt(this.minPrice)} – ${fmt(this.maxPrice)}`;
    }
    if (this.minPrice !== null) {
      return `Price: From ${fmt(this.minPrice)}`;
    }
    return `Price: Up to ${fmt(this.maxPrice as number)}`;
  }

  ngOnInit(): void {
    this.hotelApi.getCities().subscribe({
      next: (cities) => (this.cities = cities),
      error: () => {}
    });

    this.hotelApi.getFilterMetadata().subscribe({
      next: (meta) => {
        this.availableAmenities = meta.amenities ?? [];
        const maxDb = Number(meta.maxPricePerNight ?? 0);
        if (!Number.isNaN(maxDb) && maxDb > 0) {
          this.sliderMax = Math.max(25000, Math.ceil(maxDb / 1000) * 1000);
        }
      },
      error: () => {}
    });

    this.hotelApi
      .searchHotels({ page: 0, size: 10, sortBy: 'starRating', direction: 'desc' })
      .subscribe({
        next: (res) => (this.allHotels = res.content),
        error: () => {}
      });

    this.route.queryParamMap.subscribe((params) => {
      const qCity = params.get('city');
      const qMin = params.get('minPrice');
      const qMax = params.get('maxPrice');
      const qRating = params.get('minRating');
      const qAmenities = params.getAll('amenities');

      if (qCity !== null) {
        this.city = qCity;
        this.activeCategory = 'all';
      }
      this.minPrice = this.parseOptionalNumber(qMin);
      this.maxPrice = this.parseOptionalNumber(qMax);
      this.minRating = this.parseOptionalNumber(qRating);
      this.selectedAmenities = qAmenities.filter((a) => !!a.trim());
      this.page = 0;

      this.loadHotels();
    });
  }

  onSearch(): void {
    this.activeCategory = 'all';
    this.page = 0;
    this.syncQueryParams();
    this.loadHotels();
  }

  applyPanelFilters(filters: AppliedHotelFilters): void {
    this.minPrice = filters.minPrice;
    this.maxPrice = filters.maxPrice;
    this.minRating = filters.minRating;
    this.selectedAmenities = [...filters.amenities];
    this.activeCategory = 'all';
    this.page = 0;
    this.mobileFiltersOpen = false;
    this.syncQueryParams();
    this.loadHotels();
  }

  clearPriceFilter(): void {
    this.minPrice = null;
    this.maxPrice = null;
    this.page = 0;
    this.syncQueryParams();
    this.loadHotels();
  }

  clearRatingFilter(): void {
    this.minRating = null;
    this.page = 0;
    this.syncQueryParams();
    this.loadHotels();
  }

  clearCityFilter(): void {
    this.city = '';
    this.page = 0;
    this.syncQueryParams();
    this.loadHotels();
  }

  removeAmenityFilter(amenity: string): void {
    this.selectedAmenities = this.selectedAmenities.filter((a) => a !== amenity);
    this.page = 0;
    this.syncQueryParams();
    this.loadHotels();
  }

  clearAllFilters(): void {
    this.activeCategory = 'all';
    this.city = '';
    this.guests = 2;
    this.minPrice = null;
    this.maxPrice = null;
    this.minRating = null;
    this.selectedAmenities = [];
    this.sortOption = 'starRating,desc';
    this.page = 0;
    this.mobileFiltersOpen = false;
    this.syncQueryParams();
    this.loadHotels();
  }

  applyCategory(catId: TravelCategoryId): void {
    this.activeCategory = catId;
    this.page = 0;

    switch (catId) {
      case 'all':
        this.city = '';
        this.guests = 2;
        this.minPrice = null;
        this.maxPrice = null;
        this.minRating = null;
        this.selectedAmenities = [];
        this.sortOption = 'starRating,desc';
        break;
      case 'family':
        this.city = '';
        this.guests = 4;
        this.minRating = null;
        this.sortOption = 'starRating,desc';
        break;
      case 'business':
        this.city = 'Bengaluru';
        this.guests = 1;
        this.minRating = null;
        this.sortOption = 'starRating,desc';
        break;
      case 'couples':
        this.city = '';
        this.guests = 2;
        this.minRating = null;
        this.sortOption = 'starRating,desc';
        break;
      case 'beach':
        this.city = 'Goa';
        this.guests = 2;
        this.minRating = null;
        this.sortOption = 'starRating,desc';
        break;
      case 'luxury':
        this.city = '';
        this.guests = 2;
        this.minRating = 5;
        this.sortOption = 'starRating,desc';
        break;
    }

    this.syncQueryParams();
    this.loadHotels();
  }

  selectDestination(cityName: string): void {
    this.city = this.city.toLowerCase() === cityName.toLowerCase() ? '' : cityName;
    this.activeCategory = 'all';
    this.page = 0;
    this.syncQueryParams();
    this.loadHotels();
    if (typeof document !== 'undefined') {
      document.getElementById('featured-hotels')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  changePage(delta: number): void {
    if (!this.hotelPage) {
      return;
    }
    const next = this.page + delta;
    if (next < 0 || next >= this.hotelPage.totalPages) {
      return;
    }
    this.page = next;
    this.loadHotels();
  }

  viewHotel(hotelId: number): void {
    this.router.navigate(['/hotels', hotelId], {
      queryParams: {
        checkIn: this.checkIn,
        checkOut: this.checkOut,
        guests: this.guests
      }
    });
  }

  bookHotel(hotelId: number): void {
    this.router.navigate(['/hotels', hotelId, 'availability'], {
      queryParams: {
        checkIn: this.checkIn,
        checkOut: this.checkOut,
        guests: this.guests
      }
    });
  }

  openMobileFilters(): void {
    this.mobileFiltersOpen = true;
  }

  closeMobileFilters(): void {
    this.mobileFiltersOpen = false;
  }

  loadHotels(): void {
    const dateError = validateDateRange(this.checkIn, this.checkOut);
    if (dateError) {
      this.errorMessage = dateError;
      return;
    }

    this.errorMessage = null;
    this.loading = true;

    const [sortBy, dirRaw] = this.sortOption.split(',');
    const direction: 'asc' | 'desc' = dirRaw === 'asc' ? 'asc' : 'desc';

    this.hotelApi
      .searchHotels({
        city: this.city,
        checkIn: this.checkIn,
        checkOut: this.checkOut,
        guests: this.guests,
        minPrice: this.minPrice,
        maxPrice: this.maxPrice,
        minRating: this.minRating,
        amenities: this.selectedAmenities,
        page: this.page,
        size: this.pageSize,
        sortBy,
        direction
      })
      .subscribe({
        next: (response) => {
          this.hotelPage = response;
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = extractErrorMessage(err);
          this.loading = false;
        }
      });
  }

  private syncQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        city: this.city.trim() || null,
        minPrice: this.minPrice ?? null,
        maxPrice: this.maxPrice ?? null,
        minRating: this.minRating ?? null,
        amenities: this.selectedAmenities.length ? this.selectedAmenities : null
      },
      replaceUrl: true
    });
  }

  private parseOptionalNumber(raw: string | null): number | null {
    if (raw === null || raw.trim() === '') {
      return null;
    }
    const parsed = Number(raw);
    return !Number.isNaN(parsed) && parsed >= 0 ? parsed : null;
  }
}
