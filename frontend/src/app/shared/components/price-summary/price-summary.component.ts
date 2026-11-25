import { CurrencyPipe, PercentPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { PriceBreakdown } from '../../../core/models/hotel.model';

@Component({
  selector: 'app-price-summary',
  standalone: true,
  imports: [CurrencyPipe, PercentPipe],
  template: `
    @if (price) {
      <div class="price-box">
        <div class="price-row">
          <span>{{ price.pricePerNight | currency: price.currency : 'symbol' : '1.0-0' }} × {{ price.nights }} night{{ price.nights > 1 ? 's' : '' }}</span>
          <span>{{ price.subtotal | currency: price.currency : 'symbol' : '1.0-0' }}</span>
        </div>
        <div class="price-row">
          <span>GST &amp; Taxes ({{ price.taxRate | percent:'1.0-0' }})</span>
          <span>{{ price.taxAmount | currency: price.currency : 'symbol' : '1.0-2' }}</span>
        </div>
        <div class="price-total">
          <span>Total Payable</span>
          <span>{{ price.totalAmount | currency: price.currency : 'symbol' : '1.0-2' }}</span>
        </div>
      </div>
    }
  `,
  styles: [`
    .price-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.85rem 1rem;
      font-size: 0.88rem;
    }
    .price-row {
      display: flex;
      justify-content: space-between;
      color: #475569;
      margin-bottom: 0.42rem;
    }
    .price-total {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #cbd5e1;
      padding-top: 0.55rem;
      margin-top: 0.45rem;
      font-weight: 700;
      color: #0b1f3a;
      font-size: 0.98rem;
    }
  `]
})
export class PriceSummaryComponent {
  @Input() price: PriceBreakdown | null = null;
}
