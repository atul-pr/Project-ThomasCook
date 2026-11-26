import { CurrencyPipe } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface PricePreset {
  id: string;
  label: string;
  minPrice: number | null;
  maxPrice: number | null;
}

export interface AppliedHotelFilters {
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number | null;
  amenities: string[];
}

export const PRICE_PRESETS: PricePreset[] = [
  { id: 'under-2000', label: 'Under ₹2,000', minPrice: null, maxPrice: 2000 },
  { id: '2000-5000', label: '₹2,000–₹5,000', minPrice: 2000, maxPrice: 5000 },
  { id: '5000-10000', label: '₹5,000–₹10,000', minPrice: 5000, maxPrice: 10000 },
  { id: '10000-20000', label: '₹10,000–₹20,000', minPrice: 10000, maxPrice: 20000 },
  { id: 'above-20000', label: 'Above ₹20,000', minPrice: 20000, maxPrice: null }
];

@Component({
  selector: 'app-hotel-filter-panel',
  standalone: true,
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './hotel-filter-panel.component.html',
  styleUrl: './hotel-filter-panel.component.scss'
})
export class HotelFilterPanelComponent implements OnChanges {
  readonly presets = PRICE_PRESETS;
  readonly ratingOptions: { label: string; value: number | null }[] = [
    { label: 'Any Rating', value: null },
    { label: '4★ & Up', value: 4 },
    { label: '5★ Only', value: 5 }
  ];

  @Input() sliderMin = 0;
  @Input() sliderMax = 35000;
  @Input() availableAmenities: string[] = [];
  @Input() appliedMinPrice: number | null = null;
  @Input() appliedMaxPrice: number | null = null;
  @Input() appliedMinRating: number | null = null;
  @Input() appliedAmenities: string[] = [];
  @Input() inDrawer = false;
  @Input() loading = false;

  @Output() filtersApply = new EventEmitter<AppliedHotelFilters>();
  @Output() filtersReset = new EventEmitter<void>();
  @Output() closeDrawer = new EventEmitter<void>();

  draftMinPrice: number | null = null;
  draftMaxPrice: number | null = null;
  draftMinRating: number | null = null;
  draftAmenities: string[] = [];
  validationError: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['appliedMinPrice'] ||
      changes['appliedMaxPrice'] ||
      changes['appliedMinRating'] ||
      changes['appliedAmenities']
    ) {
      this.draftMinPrice = this.appliedMinPrice;
      this.draftMaxPrice = this.appliedMaxPrice;
      this.draftMinRating = this.appliedMinRating;
      this.draftAmenities = [...(this.appliedAmenities ?? [])];
      this.validateDraft();
    }
  }

  get effectiveSliderMin(): number {
    if (this.draftMinPrice === null || this.draftMinPrice <= this.sliderMin) {
      return this.sliderMin;
    }
    return Math.min(this.draftMinPrice, this.sliderMax);
  }

  get effectiveSliderMax(): number {
    if (this.draftMaxPrice === null || this.draftMaxPrice >= this.sliderMax) {
      return this.sliderMax;
    }
    return Math.max(this.draftMaxPrice, this.sliderMin);
  }

  get rangeLeftPct(): number {
    const span = Math.max(1, this.sliderMax - this.sliderMin);
    return Math.max(0, Math.min(100, ((this.effectiveSliderMin - this.sliderMin) / span) * 100));
  }

  get rangeWidthPct(): number {
    const span = Math.max(1, this.sliderMax - this.sliderMin);
    const rightPct = Math.max(0, Math.min(100, ((this.effectiveSliderMax - this.sliderMin) / span) * 100));
    return Math.max(0, rightPct - this.rangeLeftPct);
  }

  onMinSliderChange(rawVal: string | number): void {
    const num = Number(rawVal);
    if (Number.isNaN(num)) {
      return;
    }
    const maxBound = this.draftMaxPrice ?? this.sliderMax;
    const clamped = Math.min(num, maxBound);
    this.draftMinPrice = clamped <= this.sliderMin ? null : clamped;
    this.validateDraft();
  }

  onMaxSliderChange(rawVal: string | number): void {
    const num = Number(rawVal);
    if (Number.isNaN(num)) {
      return;
    }
    const minBound = this.draftMinPrice ?? this.sliderMin;
    const clamped = Math.max(num, minBound);
    this.draftMaxPrice = clamped >= this.sliderMax ? null : clamped;
    this.validateDraft();
  }

  onManualPriceInput(): void {
    if (this.draftMinPrice !== null && String(this.draftMinPrice).trim() === '') {
      this.draftMinPrice = null;
    }
    if (this.draftMaxPrice !== null && String(this.draftMaxPrice).trim() === '') {
      this.draftMaxPrice = null;
    }
    this.validateDraft();
  }

  isPresetActive(preset: PricePreset): boolean {
    return this.draftMinPrice === preset.minPrice && this.draftMaxPrice === preset.maxPrice;
  }

  selectPreset(preset: PricePreset): void {
    if (this.isPresetActive(preset)) {
      this.draftMinPrice = null;
      this.draftMaxPrice = null;
    } else {
      this.draftMinPrice = preset.minPrice;
      this.draftMaxPrice = preset.maxPrice;
    }
    this.validationError = null;
    this.apply();
  }

  selectRating(value: number | null): void {
    this.draftMinRating = this.draftMinRating === value ? null : value;
  }

  hasAmenity(amenity: string): boolean {
    return this.draftAmenities.includes(amenity);
  }

  toggleAmenity(amenity: string): void {
    if (this.hasAmenity(amenity)) {
      this.draftAmenities = this.draftAmenities.filter((a) => a !== amenity);
    } else {
      this.draftAmenities = [...this.draftAmenities, amenity];
    }
  }

  apply(): void {
    if (!this.validateDraft()) {
      return;
    }
    this.filtersApply.emit({
      minPrice: this.draftMinPrice,
      maxPrice: this.draftMaxPrice,
      minRating: this.draftMinRating,
      amenities: [...this.draftAmenities]
    });
  }

  reset(): void {
    this.draftMinPrice = null;
    this.draftMaxPrice = null;
    this.draftMinRating = null;
    this.draftAmenities = [];
    this.validationError = null;
    this.filtersReset.emit();
  }

  private validateDraft(): boolean {
    if (this.draftMinPrice !== null && this.draftMinPrice < 0) {
      this.validationError = 'Minimum price cannot be negative.';
      return false;
    }
    if (this.draftMaxPrice !== null && this.draftMaxPrice < 0) {
      this.validationError = 'Maximum price cannot be negative.';
      return false;
    }
    if (
      this.draftMinPrice !== null &&
      this.draftMaxPrice !== null &&
      this.draftMinPrice > this.draftMaxPrice
    ) {
      this.validationError = 'Minimum price cannot exceed maximum price.';
      return false;
    }
    this.validationError = null;
    return true;
  }
}
