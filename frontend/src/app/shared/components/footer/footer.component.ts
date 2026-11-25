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
            <span class="logo-dot"></span>
            <strong>StayAtlas</strong>
          </a>
          <p class="footer-about">
            StayAtlas curates verified heritage palaces, coastal resorts, and metropolitan business
            hotels across India with transparent INR pricing, real-time room inventory, and instant
            booking confirmation.
          </p>
        </div>

        <div class="footer-col">
          <h4>Platform</h4>
          <ul>
            <li><a routerLink="/hotels">Explore Hotels</a></li>
            <li><a routerLink="/manage-booking">Manage Booking</a></li>
            <li><a routerLink="/about">About StayAtlas</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Legal</h4>
          <ul>
            <li><a routerLink="/privacy">Privacy Policy</a></li>
            <li><a routerLink="/terms">Terms &amp; Conditions</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Guest Concierge</h4>
          <ul class="contact-list">
            <li><a href="mailto:concierge@stayatlas.in">concierge&#64;stayatlas.in</a></li>
            <li><a href="tel:+912248902100">+91 22 4890 2100</a></li>
            <li>Colaba, Mumbai · 24×7 Support</li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="container bottom-inner">
          <span>© 2026 StayAtlas Hospitality Pvt. Ltd. All rights reserved.</span>
          <span>All prices displayed in Indian Rupees (INR ₹) · Taxes calculated transparently</span>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .site-footer {
      background: #081529;
      color: #cbd5e1;
      margin-top: auto;
      border-top: 1px solid #132f57;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 1.7fr 1fr 1fr 1.2fr;
      gap: 2.25rem;
      padding: 3rem 1.25rem 2.5rem;
    }
    .footer-logo {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      color: #ffffff;
      text-decoration: none;
      font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
      font-size: 1.25rem;
      margin-bottom: 0.8rem;
    }
    .logo-dot {
      width: 11px;
      height: 11px;
      border-radius: 3px;
      background: #3b82f6;
      display: inline-block;
    }
    .footer-about {
      margin: 0;
      font-size: 0.88rem;
      line-height: 1.65;
      color: #94a3b8;
      max-width: 360px;
    }
    .footer-col h4 {
      color: #ffffff;
      font-size: 0.9rem;
      font-weight: 700;
      margin: 0 0 0.85rem;
      letter-spacing: 0.02em;
    }
    .footer-col ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
      font-size: 0.88rem;
    }
    .footer-col a {
      color: #94a3b8;
      text-decoration: none;
      transition: color 0.15s;

      &:hover {
        color: #ffffff;
      }
    }
    .contact-list li {
      color: #94a3b8;
    }
    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: #061020;
    }
    .bottom-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      font-size: 0.8rem;
      color: #64748b;
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
