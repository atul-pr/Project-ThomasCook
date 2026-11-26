import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="navbar">
      <div class="container navbar-inner">
        <a routerLink="/hotels" class="brand" (click)="closeMenu()">
          <span class="brand-mark" aria-hidden="true">A</span>
          <span class="brand-text">
            <strong>AtulStays</strong>
            <small>Curated Stays · India</small>
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
          <div class="theme-control" role="group" aria-label="Color theme">
            <button
              type="button"
              class="theme-btn"
              (click)="themeService.toggleLightDark()"
              [attr.aria-label]="themeService.isDark() ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
              [title]="themeService.isDark() ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
            >
              @if (themeService.isDark()) {
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                </svg>
              } @else {
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>
                </svg>
              }
            </button>
            <button
              type="button"
              class="theme-auto-btn"
              [class.active]="themeService.preference() === 'system'"
              (click)="themeService.setPreference('system')"
              aria-label="Use system default theme"
              title="Use system default theme"
            >
              Auto
            </button>
          </div>

          <button type="button" class="btn btn-primary explore-cta" (click)="goExplore()">
            Explore Stays
          </button>

          <button
            type="button"
            class="hamburger"
            [class.open]="mobileMenuOpen"
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

            <div class="mobile-theme-row" role="group" aria-label="Select theme">
              <button
                type="button"
                class="mobile-theme-opt"
                [class.active]="themeService.preference() === 'light'"
                (click)="themeService.setPreference('light')"
              >
                Light
              </button>
              <button
                type="button"
                class="mobile-theme-opt"
                [class.active]="themeService.preference() === 'dark'"
                (click)="themeService.setPreference('dark')"
              >
                Dark
              </button>
              <button
                type="button"
                class="mobile-theme-opt"
                [class.active]="themeService.preference() === 'system'"
                (click)="themeService.setPreference('system')"
              >
                System
              </button>
            </div>

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
      background: var(--navbar-bg);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-hairline);
      transition: background-color 0.2s ease, border-color 0.2s ease;
    }
    .navbar-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 76px;
      gap: 1.25rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: var(--ink-950);
    }
    .brand:hover .brand-mark {
      transform: translateY(-1px) scale(1.03);
      box-shadow: var(--shadow-sm);
    }
    .brand-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: var(--btn-primary-gradient);
      color: #ffffff;
      font-family: Georgia, serif;
      font-size: 1.2rem;
      font-weight: 700;
      transition: transform 0.18s ease, box-shadow 0.18s ease;
    }
    .brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1.15;

      strong {
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--ink-950);
        letter-spacing: -0.02em;
      }

      small {
        font-size: 0.68rem;
        color: var(--accent-bronze);
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
    }
    .nav-desktop {
      display: flex;
      align-items: center;
      gap: 0.55rem;
    }
    .nav-desktop a {
      color: var(--ink-700);
      text-decoration: none;
      font-weight: 500;
      font-size: 0.93rem;
      padding: 0.48rem 0.92rem;
      border-radius: 999px;
      border: 1px solid transparent;
      transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
    }
    .nav-desktop a:hover {
      color: var(--ink-950);
      background: var(--surface-muted);
      border-color: var(--border-hairline);
    }
    .nav-desktop a.active {
      color: var(--ink-950);
      background: var(--surface-hover);
      border-color: var(--border-hairline);
      font-weight: 600;
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .theme-control {
      display: inline-flex;
      align-items: center;
      background: var(--surface-card);
      border: 1px solid var(--border-input);
      border-radius: 999px;
      padding: 2px;
    }
    .theme-btn,
    .theme-auto-btn {
      border: none;
      background: transparent;
      color: var(--ink-700);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      transition: background-color 0.15s, color 0.15s;
    }
    .theme-btn {
      width: 32px;
      height: 32px;
      &:hover {
        background: var(--surface-muted);
        color: var(--ink-950);
      }
    }
    .theme-auto-btn {
      height: 28px;
      padding: 0 0.58rem;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      &.active {
        background: var(--btn-primary-bg);
        color: #ffffff;
      }
    }
    .explore-cta {
      padding: 0.56rem 1.2rem;
      font-size: 0.86rem;
      border-radius: 999px;
    }
    .hamburger {
      display: none;
      flex-direction: column;
      justify-content: center;
      gap: 5px;
      width: 40px;
      height: 40px;
      border: 1px solid var(--border-input);
      background: var(--surface-card);
      border-radius: 8px;
      cursor: pointer;
      padding: 0 9px;

      span {
        display: block;
        width: 100%;
        height: 2px;
        background: var(--ink-950);
        border-radius: 2px;
        transition: transform 0.2s ease, opacity 0.2s ease;
      }

      &.open span:nth-child(1) {
        transform: translateY(7px) rotate(45deg);
      }
      &.open span:nth-child(2) {
        opacity: 0;
      }
      &.open span:nth-child(3) {
        transform: translateY(-7px) rotate(-45deg);
      }
    }
    .nav-mobile {
      border-top: 1px solid var(--border-hairline);
      background: var(--ivory-bg);
      padding: 0.9rem 0 1.2rem;
      animation: nav-drop 0.2s ease;
    }
    @keyframes nav-drop {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .mobile-links {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;

      a {
        text-decoration: none;
        color: var(--ink-900);
        font-weight: 600;
        padding: 0.65rem 0.85rem;
        border-radius: 8px;
      }

      a.active {
        background: var(--surface-hover);
      }
    }
    .mobile-theme-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.4rem;
      padding: 0.35rem 0;
    }
    .mobile-theme-opt {
      padding: 0.48rem;
      border-radius: 8px;
      border: 1px solid var(--border-input);
      background: var(--surface-card);
      color: var(--ink-700);
      font-weight: 600;
      font-size: 0.82rem;
      cursor: pointer;
      &.active {
        background: var(--btn-primary-bg);
        border-color: var(--btn-primary-bg);
        color: #ffffff;
      }
    }
    .mobile-cta {
      margin-top: 0.35rem;
      width: 100%;
    }
    @media (max-width: 860px) {
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
  readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  mobileMenuOpen = false;

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
