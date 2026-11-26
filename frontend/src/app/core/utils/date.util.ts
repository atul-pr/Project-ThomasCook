import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../models/hotel.model';

export function formatDateIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysIso(baseIso: string, days: number): string {
  const [y, m, d] = baseIso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return formatDateIso(dt);
}

export function todayIso(): string {
  return formatDateIso(new Date());
}

export function validateDateRange(checkIn: string, checkOut: string): string | null {
  if (!checkIn || !checkOut) {
    return 'Please select both check-in and check-out dates.';
  }
  const today = todayIso();
  if (checkIn < today) {
    return 'Check-in date cannot be in the past.';
  }
  if (checkOut <= checkIn) {
    return 'Check-out date must be after check-in date.';
  }
  const [y1, m1, d1] = checkIn.split('-').map(Number);
  const [y2, m2, d2] = checkOut.split('-').map(Number);
  const diffDays = Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
  if (diffDays > 30) {
    return 'Maximum stay duration is 30 nights.';
  }
  return null;
}

export function extractErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as Partial<ApiError> | null;
    if (body?.fieldErrors) {
      const firstFieldMsg = Object.values(body.fieldErrors)[0];
      if (firstFieldMsg) {
        return firstFieldMsg;
      }
    }
    if (body?.message) {
      return body.message;
    }
    if (err.status === 0) {
      return 'Cannot reach the booking server. Ensure Spring Boot is running on port 8080.';
    }
    return `Request failed (${err.status}).`;
  }
  return 'An unexpected error occurred.';
}

export function parsePositiveIntParam(raw: string | null): number | null {
  if (!raw || !/^\d+$/.test(raw.trim())) {
    return null;
  }
  const value = Number(raw.trim());
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

const SESSION_BOOKING_EMAIL_PREFIX = 'stayatlas-booking-email:';

export function saveBookingSessionEmail(reference: string, email: string): void {
  const ref = reference.trim().toUpperCase();
  const addr = email.trim();
  if (!ref || !addr || typeof sessionStorage === 'undefined') {
    return;
  }
  try {
    sessionStorage.setItem(`${SESSION_BOOKING_EMAIL_PREFIX}${ref}`, addr);
  } catch {
    // Ignore storage quota / private mode failures
  }
}

export function getBookingSessionEmail(reference: string): string | null {
  const ref = reference.trim().toUpperCase();
  if (!ref || typeof sessionStorage === 'undefined') {
    return null;
  }
  try {
    return sessionStorage.getItem(`${SESSION_BOOKING_EMAIL_PREFIX}${ref}`);
  } catch {
    return null;
  }
}
