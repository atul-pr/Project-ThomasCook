import { TestBed } from '@angular/core/testing';
import { HotelFilterPanelComponent, PRICE_PRESETS } from './hotel-filter-panel.component';

describe('HotelFilterPanelComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelFilterPanelComponent]
    }).compileComponents();
  });

  it('prevents applying invalid range when minPrice exceeds maxPrice', () => {
    const fixture = TestBed.createComponent(HotelFilterPanelComponent);
    const component = fixture.componentInstance;
    const applySpy = spyOn(component.filtersApply, 'emit');
    fixture.detectChanges();

    component.draftMinPrice = 15000;
    component.draftMaxPrice = 5000;
    component.onManualPriceInput();

    expect(component.validationError).toContain('Minimum price cannot exceed maximum price');
    component.apply();
    expect(applySpy).not.toHaveBeenCalled();
  });

  it('emits min-only, max-only, combined range, rating, and amenities filters', () => {
    const fixture = TestBed.createComponent(HotelFilterPanelComponent);
    const component = fixture.componentInstance;
    const applySpy = spyOn(component.filtersApply, 'emit');
    fixture.detectChanges();

    component.draftMinPrice = 6000;
    component.draftMaxPrice = 12000;
    component.selectRating(5);
    component.toggleAmenity('Pool');
    component.apply();

    expect(applySpy).toHaveBeenCalledWith({
      minPrice: 6000,
      maxPrice: 12000,
      minRating: 5,
      amenities: ['Pool']
    });
  });

  it('applies quick price preset chips and resets cleanly', () => {
    const fixture = TestBed.createComponent(HotelFilterPanelComponent);
    const component = fixture.componentInstance;
    const applySpy = spyOn(component.filtersApply, 'emit');
    const resetSpy = spyOn(component.filtersReset, 'emit');
    fixture.detectChanges();

    const preset = PRICE_PRESETS[2]; // ₹5,000–₹10,000
    component.selectPreset(preset);
    expect(component.draftMinPrice).toBe(5000);
    expect(component.draftMaxPrice).toBe(10000);
    expect(applySpy).toHaveBeenCalledWith({
      minPrice: 5000,
      maxPrice: 10000,
      minRating: null,
      amenities: []
    });

    component.reset();
    expect(component.draftMinPrice).toBeNull();
    expect(component.draftMaxPrice).toBeNull();
    expect(resetSpy).toHaveBeenCalled();
  });
});
