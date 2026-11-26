import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

type InfoPageKind = 'about' | 'privacy' | 'terms';

@Component({
  selector: 'app-info-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="card info-card">
      @if (kind === 'about') {
        <span class="badge badge-neutral">About StayAtlas</span>
        <h1>Curated Hospitality Across India</h1>
        <p class="lead">
          StayAtlas connects discerning leisure and business travelers with flagship hotels in Mumbai,
          Bengaluru, Goa, Jaipur, and New Delhi—combining live room inventory, transparent INR pricing,
          and transaction-safe reservations.
        </p>
        <div class="info-grid">
          <div class="info-block">
            <h3>Real-Time Inventory Protection</h3>
            <p>Every reservation is confirmed against live database capacity with row-level locking so your room is guaranteed on arrival.</p>
          </div>
          <div class="info-block">
            <h3>Transparent INR Pricing</h3>
            <p>Nightly rates and 12% GST are calculated authoritatively on our server and locked in as an immutable booking snapshot.</p>
          </div>
          <div class="info-block">
            <h3>Smart Alternative Dates</h3>
            <p>When your preferred dates are full, StayAtlas automatically checks the next 7 days and suggests available stays matching your trip duration.</p>
          </div>
        </div>
      } @else if (kind === 'privacy') {
        <span class="badge badge-neutral">Legal</span>
        <h1>Privacy Policy</h1>
        <p class="lead">How StayAtlas handles guest reservation information.</p>
        <ul class="policy-list">
          <li><strong>Reservation Data:</strong> We collect your name, email address, optional phone number, and stay preferences solely to confirm, retrieve, and manage your hotel booking.</li>
          <li><strong>Reference Verification:</strong> Bookings can be retrieved or cancelled only by providing both the unique booking reference (e.g., <code>HTL-XXXXXXXX</code>) and the matching guest email address.</li>
          <li><strong>No Third-Party Ad Tracking:</strong> StayAtlas does not sell guest contact information to external brokers or third-party advertising networks.</li>
        </ul>
      } @else {
        <span class="badge badge-neutral">Legal</span>
        <h1>Terms &amp; Conditions</h1>
        <p class="lead">Standard reservation, check-in, and cancellation policies.</p>
        <ul class="policy-list">
          <li><strong>Check-in &amp; Check-out:</strong> Check-in dates are inclusive and check-out dates are exclusive. Standard stay length is between 1 and 30 nights per reservation.</li>
          <li><strong>Pricing &amp; Taxes:</strong> Final room charges and applicable 12% GST are calculated in Indian Rupees (INR ₹) by the backend at the time of booking confirmation.</li>
          <li><strong>Cancellations:</strong> Confirmed reservations may be cancelled via <a routerLink="/manage-booking">Manage Booking</a> using your reference and email, immediately releasing room capacity.</li>
        </ul>
      }

      <div class="info-actions">
        <a routerLink="/hotels" class="btn btn-primary">Explore Hotels</a>
        <a routerLink="/manage-booking" class="btn btn-secondary">Manage Booking</a>
      </div>
    </section>
  `,
  styles: [`
    .info-card {
      padding: 2rem;
    }
    h1 {
      margin: 0.75rem 0 0.5rem;
      font-size: 1.9rem;
    }
    .lead {
      color: var(--ink-700);
      font-size: 1.02rem;
      max-width: 760px;
      margin: 0 0 1.5rem;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
      margin-bottom: 1.75rem;
    }
    .info-block {
      background: var(--surface-elevated);
      border: 1px solid var(--border-hairline);
      border-radius: 12px;
      padding: 1.2rem;

      h3 {
        margin: 0 0 0.45rem;
        font-size: 1.02rem;
      }

      p {
        margin: 0;
        font-size: 0.9rem;
        color: var(--ink-700);
      }
    }
    .policy-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      padding-left: 1.25rem;
      color: var(--ink-700);
      margin: 0 0 1.75rem;
      a {
        color: var(--accent-blue);
      }
    }
    .info-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    @media (max-width: 820px) {
      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class InfoPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  kind: InfoPageKind = 'about';

  ngOnInit(): void {
    const dataKind = this.route.snapshot.data['kind'] as InfoPageKind | undefined;
    if (dataKind) {
      this.kind = dataKind;
    }
  }
}
