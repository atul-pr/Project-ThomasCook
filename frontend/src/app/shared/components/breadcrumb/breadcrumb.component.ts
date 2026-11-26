import { Component, Input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  route?: (string | number)[];
  queryParams?: Params;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-nav-bar">
      @if (backRoute) {
        <a [routerLink]="backRoute" [queryParams]="backQueryParams" class="back-btn">
          <span aria-hidden="true">←</span>
          <span>{{ backLabel || 'Back' }}</span>
        </a>
      }

      <nav class="breadcrumb-nav" aria-label="Breadcrumb">
        <ol class="breadcrumb-list">
          @for (item of items; track $index; let last = $last) {
            <li class="breadcrumb-item">
              @if (item.route && !last) {
                <a [routerLink]="item.route" [queryParams]="item.queryParams">{{ item.label }}</a>
                <span class="sep" aria-hidden="true">/</span>
              } @else {
                <span class="current" [attr.aria-current]="last ? 'page' : null">{{ item.label }}</span>
              }
            </li>
          }
        </ol>
      </nav>
    </div>
  `,
  styles: [`
    .page-nav-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem 1.25rem;
      margin-bottom: 1.25rem;
    }
    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.42rem 0.85rem;
      border-radius: 999px;
      border: 1px solid var(--border-input);
      background: var(--btn-secondary-bg);
      color: var(--ink-950);
      text-decoration: none;
      font-size: 0.84rem;
      font-weight: 600;
      transition: background-color 0.15s, border-color 0.15s;

      &:hover {
        background: var(--btn-secondary-hover);
      }
    }
    .breadcrumb-list {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.35rem;
      list-style: none;
      margin: 0;
      padding: 0;
      font-size: 0.84rem;
    }
    .breadcrumb-item {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;

      a {
        color: var(--blue-600);
        text-decoration: none;
        font-weight: 500;
        &:hover {
          text-decoration: underline;
        }
      }
      .sep {
        color: var(--ink-500);
      }
      .current {
        color: var(--ink-700);
        font-weight: 600;
      }
    }
  `]
})
export class BreadcrumbComponent {
  @Input({ required: true }) items: BreadcrumbItem[] = [];
  @Input() backRoute?: (string | number)[];
  @Input() backQueryParams?: Params;
  @Input() backLabel?: string;
}
