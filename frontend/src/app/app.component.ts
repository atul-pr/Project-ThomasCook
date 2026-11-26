import { Component, OnDestroy, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { FooterComponent } from './shared/components/footer/footer.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly navSub: Subscription;
  private animTimeout: ReturnType<typeof setTimeout> | null = null;

  title = 'StayAtlas Hotel Booking Portal';
  readonly routeEntering = signal(true);

  constructor() {
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.triggerRouteTransition());
  }

  private triggerRouteTransition(): void {
    this.routeEntering.set(false);
    if (this.animTimeout) {
      clearTimeout(this.animTimeout);
    }
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        this.routeEntering.set(true);
      });
    } else {
      this.routeEntering.set(true);
    }
  }

  ngOnDestroy(): void {
    this.navSub.unsubscribe();
    if (this.animTimeout) {
      clearTimeout(this.animTimeout);
    }
  }
}
