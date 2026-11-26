import { Injectable, computed, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'stayatlas-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly mediaQuery =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;

  private readonly systemDark = signal<boolean>(this.mediaQuery?.matches ?? false);
  readonly preference = signal<ThemePreference>(this.readStoredPreference());

  readonly resolvedTheme = computed<ResolvedTheme>(() => {
    const pref = this.preference();
    if (pref === 'system') {
      return this.systemDark() ? 'dark' : 'light';
    }
    return pref;
  });

  readonly isDark = computed<boolean>(() => this.resolvedTheme() === 'dark');

  constructor() {
    this.applyToDom(this.resolvedTheme());

    this.mediaQuery?.addEventListener('change', (event) => {
      this.systemDark.set(event.matches);
      if (this.preference() === 'system') {
        this.applyToDom(event.matches ? 'dark' : 'light');
      }
    });
  }

  setPreference(pref: ThemePreference): void {
    this.preference.set(pref);
    this.persistPreference(pref);
    this.applyToDom(this.resolvedTheme());
  }

  toggleLightDark(): void {
    const next: ThemePreference = this.isDark() ? 'light' : 'dark';
    this.setPreference(next);
  }

  private readStoredPreference(): ThemePreference {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {
      // Ignore storage restrictions
    }
    return 'system';
  }

  private persistPreference(pref: ThemePreference): void {
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {
      // Ignore storage restrictions
    }
  }

  private applyToDom(theme: ResolvedTheme): void {
    if (typeof document === 'undefined') {
      return;
    }
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }
}
