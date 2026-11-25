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
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
      padding: 0.85rem 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.95rem;
    }
  `]
})
export class ErrorBannerComponent {
  @Input() message: string | null = null;
}
