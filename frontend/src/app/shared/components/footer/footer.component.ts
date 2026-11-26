import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="site-footer">
      <div class="container footer-grid">
        <div class="footer-brand">
          <a routerLink="/hotels" class="footer-logo">
            <span class="logo-monogram">A</span>
            <strong>AtulStays</strong>
          </a>
          <p class="footer-about">
            An editorial collection of heritage palaces, coastal resorts, and metropolitan business
            hotels across India—backed by live room inventory, transparent INR pricing, and instant
            confirmation.
          </p>
        </div>

        <div class="footer-col">
          <h4>Explore Destinations</h4>
          <ul>
            <li><a [routerLink]="['/hotels']" [queryParams]="{ city: 'Mumbai' }">Mumbai</a></li>
            <li><a [routerLink]="['/hotels']" [queryParams]="{ city: 'Goa' }">Goa</a></li>
            <li><a [routerLink]="['/hotels']" [queryParams]="{ city: 'Jaipur' }">Jaipur</a></li>
            <li><a [routerLink]="['/hotels']" [queryParams]="{ city: 'Bengaluru' }">Bengaluru</a></li>
            <li><a [routerLink]="['/hotels']" [queryParams]="{ city: 'New Delhi' }">New Delhi</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Guest Services</h4>
          <ul>
            <li><a routerLink="/hotels">Explore All Hotels</a></li>
            <li><a routerLink="/manage-booking">Manage Booking</a></li>
            <li><a routerLink="/about">About AtulStays</a></li>
            <li><a routerLink="/privacy">Privacy Policy</a></li>
            <li><a routerLink="/terms">Terms &amp; Conditions</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Concierge</h4>
          <ul class="contact-list">
            <li><a href="mailto:concierge@atulstays.in">concierge&#64;atulstays.in</a></li>
            <li><a href="tel:+912248902100">+91 22 4890 2100</a></li>
            <li>Colaba, Mumbai · 24×7 Support</li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="container bottom-inner">
          <span>© 2026 AtulStays Hospitality Pvt. Ltd. All rights reserved.</span>
          <span>All rates in Indian Rupees (INR ₹) · Authoritative backend pricing</span>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .site-footer {
      background: var(--footer-bg);
      color: #d4d4d8;
      margin-top: auto;
      border-top: 1px solid var(--border-hairline);
      transition: background-color 0.2s ease, border-color 0.2s ease;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 1.7fr 1fr 1fr 1.15fr;
      gap: 2.5rem;
      padding: 3.5rem 1.5rem 2.75rem;
    }
    .footer-logo {
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
      color: #ffffff;
      text-decoration: none;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 1.3rem;
      margin-bottom: 0.9rem;
    }
    .logo-monogram {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: 7px;
      background: #9a5b13;
      color: #ffffff;
      font-size: 1rem;
      font-weight: 700;
    }
    .footer-about {
      margin: 0;
      font-size: 0.88rem;
      line-height: 1.7;
      color: #9ca3af;
      max-width: 360px;
    }
    .footer-col h4 {
      color: #faf8f5;
      font-size: 0.82rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin: 0 0 1rem;
    }
    .footer-col ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.58rem;
      font-size: 0.88rem;
    }
    .footer-col a {
      color: #9ca3af;
      text-decoration: none;
      transition: color 0.15s;

      &:hover {
        color: #ffffff;
      }
    }
    .contact-list li {
      color: #9ca3af;
    }
    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: var(--footer-bottom-bg);
    }
    .bottom-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
      padding: 1.1rem 1.5rem;
      font-size: 0.8rem;
      color: #6b7280;
    }
    @media (max-width: 900px) {
      .footer-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    @media (max-width: 560px) {
      .footer-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class FooterComponent {}
