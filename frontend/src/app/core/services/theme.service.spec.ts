import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  const storageKey = 'atulstays-theme';

  beforeEach(() => {
    localStorage.removeItem(storageKey);
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.removeItem(storageKey);
    document.documentElement.removeAttribute('data-theme');
  });

  it('should default to system preference when nothing is stored', () => {
    const service = TestBed.inject(ThemeService);
    expect(service.preference()).toBe('system');
    expect(['light', 'dark']).toContain(service.resolvedTheme());
    expect(document.documentElement.getAttribute('data-theme')).toBe(service.resolvedTheme());
  });

  it('should apply and persist light and dark preferences', () => {
    const service = TestBed.inject(ThemeService);

    service.setPreference('dark');
    expect(service.preference()).toBe('dark');
    expect(service.resolvedTheme()).toBe('dark');
    expect(service.isDark()).toBeTrue();
    expect(localStorage.getItem(storageKey)).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    service.setPreference('light');
    expect(service.preference()).toBe('light');
    expect(service.resolvedTheme()).toBe('light');
    expect(service.isDark()).toBeFalse();
    expect(localStorage.getItem(storageKey)).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('should toggle between light and dark modes', () => {
    const service = TestBed.inject(ThemeService);
    service.setPreference('light');

    service.toggleLightDark();
    expect(service.resolvedTheme()).toBe('dark');
    expect(localStorage.getItem(storageKey)).toBe('dark');

    service.toggleLightDark();
    expect(service.resolvedTheme()).toBe('light');
    expect(localStorage.getItem(storageKey)).toBe('light');
  });

  it('should restore saved preference from localStorage on initialization', () => {
    localStorage.setItem(storageKey, 'dark');
    const service = TestBed.inject(ThemeService);
    expect(service.preference()).toBe('dark');
    expect(service.resolvedTheme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
