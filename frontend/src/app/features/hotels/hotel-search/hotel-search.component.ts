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
  imports: [FormsModule, CurrencyPipe, ErrorBannerComponent],
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

  cities: string[] = [];
  allHotels: HotelSummary[] = [];
  hotelPage: PageResponse<HotelSummary> | null = null;
  loading = false;
  errorMessage: string | null = null;

  get recommendedHotels(): HotelSummary[] {
    return this.allHotels.filter((h) => h.starRating >= 5).slice(0, 3);
  }

  ngOnInit(): void {
    this.hotelApi.getCities().subscribe({
      next: (cities) => (this.cities = cities),
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
      if (qCity !== null) {
        this.city = qCity;
        this.activeCategory = 'all';
        this.page = 0;
      }
      this.loadHotels();
    });
  }

  onSearch(): void {
    this.activeCategory = 'all';
    this.page = 0;
    this.loadHotels();
  }

  applyCategory(catId: TravelCategoryId): void {
    this.activeCategory = catId;
    this.page = 0;

    switch (catId) {
      case 'all':
        this.city = '';
        this.guests = 2;
        this.sortOption = 'starRating,desc';
        break;
      case 'family':
        this.city = '';
        this.guests = 4;
        this.sortOption = 'starRating,desc';
        break;
      case 'business':
        this.city = 'Bengaluru';
        this.guests = 1;
        this.sortOption = 'starRating,desc';
        break;
      case 'couples':
        this.city = '';
        this.guests = 2;
        this.sortOption = 'starRating,desc';
        break;
      case 'beach':
        this.city = 'Goa';
        this.guests = 2;
        this.sortOption = 'starRating,desc';
        break;
      case 'luxury':
        this.city = '';
        this.guests = 2;
        this.sortOption = 'starRating,desc';
        break;
    }

    this.loadHotels();
  }

  selectDestination(cityName: string): void {
    this.city = this.city.toLowerCase() === cityName.toLowerCase() ? '' : cityName;
    this.activeCategory = 'all';
    this.page = 0;
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
}
