import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-error-banner',
  standalone: true,
  template: `
    @if (message) {
      <div class="error-banner" role="alert">
        <strong>Error:</strong> {{ message }}
      </div>
    }
  `,
  styles: [`
    .error-banner {
      background: var(--error-bg);
      border: 1px solid var(--error-border);
      color: var(--error-text);
      padding: 0.85rem 1.05rem;
      border-radius: 12px;
      margin-bottom: 1rem;
      font-size: 0.95rem;
      box-shadow: var(--shadow-sm);
      animation: sa-error-in 0.24s ease;
    }
  `]
})
export class ErrorBannerComponent {
  @Input() message: string | null = null;
}
