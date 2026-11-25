import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="navbar">
      <div class="container navbar-inner">
        <a routerLink="/hotels" class="brand" (click)="closeMenu()">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/>
            </svg>
          </span>
          <span class="brand-text">
            <strong>StayAtlas</strong>
            <small>India Luxury &amp; Business Stays</small>
          </span>
        </a>

        <nav class="nav-desktop" aria-label="Primary Navigation">
          <a routerLink="/hotels" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            Explore Hotels
          </a>
          <a routerLink="/manage-booking" routerLinkActive="active">
            My Bookings
          </a>
          <a routerLink="/about" routerLinkActive="active">
            About
          </a>
        </nav>

        <div class="nav-actions">
          <button type="button" class="btn btn-primary explore-cta" (click)="goExplore()">
            Explore Stays
          </button>

          <button
            type="button"
            class="hamburger"
            [attr.aria-expanded]="mobileMenuOpen"
            aria-label="Toggle navigation menu"
            (click)="toggleMenu()"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      @if (mobileMenuOpen) {
        <nav class="nav-mobile" aria-label="Mobile Navigation">
          <div class="container mobile-links">
            <a routerLink="/hotels" routerLinkActive="active" (click)="closeMenu()">Explore Hotels</a>
            <a routerLink="/manage-booking" routerLinkActive="active" (click)="closeMenu()">My Bookings</a>
            <a routerLink="/about" routerLinkActive="active" (click)="closeMenu()">About</a>
            <button type="button" class="btn btn-primary mobile-cta" (click)="goExplore()">
              Explore Stays
            </button>
          </div>
        </nav>
      }
    </header>
  `,
  styles: [`
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 40;
    }
    .navbar {
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid #e2e8f0;
      box-shadow: 0 2px 10px rgba(11, 31, 58, 0.04);
    }
    .navbar-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 74px;
      gap: 1.5rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.72rem;
      text-decoration: none;
      color: #0b1f3a;
    }
    .brand-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 11px;
      background: linear-gradient(135deg, #0b1f3a, #1d4ed8);
      color: #ffffff;
      box-shadow: 0 4px 10px rgba(29, 78, 216, 0.22);
    }
    .brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1.15;

      strong {
        font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
        font-size: 1.2rem;
        font-weight: 800;
        color: #0b1f3a;
        letter-spacing: -0.025em;
      }

      small {
        font-size: 0.72rem;
        color: #64748b;
        font-weight: 500;
      }
    }
    .nav-desktop {
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }
    .nav-desktop a {
      color: #334155;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.94rem;
      padding: 0.5rem 0.9rem;
      border-radius: 8px;
      transition: background 0.15s, color 0.15s;
    }
    .nav-desktop a:hover {
      color: #0b1f3a;
      background: #f1f5f9;
    }
    .nav-desktop a.active {
      color: #1d4ed8;
      background: #eff6ff;
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .explore-cta {
      padding: 0.58rem 1.15rem;
      font-size: 0.88rem;
      border-radius: 999px;
    }
    .hamburger {
      display: none;
      flex-direction: column;
      justify-content: center;
      gap: 5px;
      width: 40px;
      height: 40px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      border-radius: 8px;
      cursor: pointer;
      padding: 0 9px;

      span {
        display: block;
        width: 100%;
        height: 2px;
        background: #0b1f3a;
        border-radius: 2px;
      }
    }
    .nav-mobile {
      border-top: 1px solid #e2e8f0;
      background: #ffffff;
      padding: 0.9rem 0 1.1rem;
    }
    .mobile-links {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;

      a {
        text-decoration: none;
        color: #1e293b;
        font-weight: 600;
        padding: 0.65rem 0.8rem;
        border-radius: 8px;
      }

      a.active {
        background: #eff6ff;
        color: #1d4ed8;
      }
    }
    .mobile-cta {
      margin-top: 0.45rem;
      width: 100%;
    }
    @media (max-width: 820px) {
      .nav-desktop,
      .explore-cta {
        display: none;
      }
      .hamburger {
        display: flex;
      }
    }
  `]
})
export class NavbarComponent {
  mobileMenuOpen = false;

  constructor(private readonly router: Router) {}

  toggleMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMenu(): void {
    this.mobileMenuOpen = false;
  }

  goExplore(): void {
    this.closeMenu();
    this.router.navigate(['/hotels'], { fragment: 'search-panel' });
  }
}
