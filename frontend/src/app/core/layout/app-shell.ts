import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AppLoadingService } from '../loading/app-loading.service';
import { RouteLoadingService } from '../loading/route-loading.service';

export interface PrimaryNavigationItem {
  readonly label: string;
  readonly route: string;
  readonly icon: string;
  readonly exact: boolean;
}

export const PRIMARY_NAVIGATION_ITEMS: readonly PrimaryNavigationItem[] = [
  { label: 'Dashboard', route: '/dashboard', icon: 'dashboard', exact: true },
  { label: 'Places', route: '/places', icon: 'yard', exact: false },
  { label: 'Calendar', route: '/calendar', icon: 'calendar_month', exact: false },
  { label: 'Activities', route: '/activities', icon: 'task_alt', exact: false },
  { label: 'Problems', route: '/problems', icon: 'report_problem', exact: false },
  { label: 'Plants', route: '/plants', icon: 'local_florist', exact: false },
  { label: 'Products', route: '/products', icon: 'science', exact: false },
  { label: 'Inventory', route: '/inventory', icon: 'inventory_2', exact: false },
  { label: 'AI Assistant', route: '/ai', icon: 'auto_awesome', exact: false },
  { label: 'Settings', route: '/settings', icon: 'settings', exact: false },
];

const DESKTOP_MEDIA_QUERY = '(min-width: 56rem)';

@Component({
  selector: 'app-shell',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule,
    MatSidenavModule,
    MatToolbarModule,
    MatTooltipModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShell {
  readonly navigationItems = PRIMARY_NAVIGATION_ITEMS;
  readonly mobileNavigationOpen = signal(false);
  readonly loading = inject(AppLoadingService);

  private readonly routeLoading = inject(RouteLoadingService);

  openMobileNavigation(): void {
    this.mobileNavigationOpen.set(true);
  }

  closeMobileNavigation(): void {
    this.mobileNavigationOpen.set(false);
  }

  @HostListener('window:resize')
  closeMobileNavigationAtDesktopBreakpoint(): void {
    if (this.mobileNavigationOpen() && globalThis.matchMedia?.(DESKTOP_MEDIA_QUERY).matches) {
      this.closeMobileNavigation();
    }
  }
}
