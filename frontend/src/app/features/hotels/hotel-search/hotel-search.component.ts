import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HotelSummary, PageResponse } from '../../../core/models/hotel.model';
import { HotelApiService } from '../../../core/services/hotel-api.service';
import {
  addDaysIso,
  extractErrorMessage,
  todayIso,
  validateDateRange
} from '../../../core/utils/date.util';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner.component';

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

  readonly minDate = todayIso();

  city = '';
  checkIn = addDaysIso(todayIso(), 1);
  checkOut = addDaysIso(todayIso(), 3);
  guests = 2;
  sortBy = 'starRating';
  direction: 'asc' | 'desc' = 'desc';
  page = 0;
  readonly pageSize = 5;

  cities: string[] = [];
  hotelPage: PageResponse<HotelSummary> | null = null;
  loading = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.hotelApi.getCities().subscribe({
      next: (cities) => (this.cities = cities),
      error: () => {}
    });
    this.loadHotels();
  }

  onSearch(): void {
    this.page = 0;
    this.loadHotels();
  }

  selectCity(cityName: string): void {
    this.city = this.city === cityName ? '' : cityName;
    this.page = 0;
    this.loadHotels();
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

  loadHotels(): void {
    const dateError = validateDateRange(this.checkIn, this.checkOut);
    if (dateError) {
      this.errorMessage = dateError;
      return;
    }

    this.errorMessage = null;
    this.loading = true;

    this.hotelApi
      .searchHotels({
        city: this.city,
        checkIn: this.checkIn,
        checkOut: this.checkOut,
        guests: this.guests,
        page: this.page,
        size: this.pageSize,
        sortBy: this.sortBy,
        direction: this.direction
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
