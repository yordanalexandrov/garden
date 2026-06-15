import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthSessionService } from '../auth/auth-session.service';
import { AppLoadingService } from '../loading/app-loading.service';
import { RouteLoadingService } from '../loading/route-loading.service';

export interface PrimaryNavigationItem {
  readonly label: string;
  readonly route: string;
  readonly icon: string;
  readonly exact: boolean;
}

export interface NavigationSection {
  readonly label: string;
  readonly items: readonly PrimaryNavigationItem[];
}

export const NAVIGATION_SECTIONS: readonly NavigationSection[] = [
  {
    label: 'Garden',
    items: [
      { label: 'Dashboard', route: '/dashboard', icon: 'dashboard', exact: true },
      { label: 'Places', route: '/places', icon: 'yard', exact: false },
      { label: 'Plants', route: '/plants', icon: 'local_florist', exact: false },
    ],
  },
  {
    label: 'Planning',
    items: [
      { label: 'Calendar', route: '/calendar', icon: 'calendar_month', exact: false },
      { label: 'Tasks', route: '/tasks', icon: 'event_available', exact: false },
      { label: 'Activities', route: '/activities', icon: 'task_alt', exact: false },
      { label: 'Problems', route: '/problems', icon: 'report_problem', exact: false },
    ],
  },
  {
    label: 'Supplies',
    items: [
      { label: 'Products', route: '/products', icon: 'science', exact: false },
      { label: 'Inventory', route: '/inventory', icon: 'inventory_2', exact: false },
    ],
  },
  {
    label: 'Tools',
    items: [
      { label: 'AI Assistant', route: '/ai', icon: 'auto_awesome', exact: false },
      { label: 'Settings', route: '/settings', icon: 'settings', exact: false },
    ],
  },
];

export const PRIMARY_NAVIGATION_ITEMS: readonly PrimaryNavigationItem[] =
  NAVIGATION_SECTIONS.flatMap((section) => section.items);

const DESKTOP_MEDIA_QUERY = '(min-width: 56rem)';

@Component({
  selector: 'app-shell',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
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
  readonly navigationSections = NAVIGATION_SECTIONS;
  readonly mobileNavigationOpen = signal(false);
  readonly loading = inject(AppLoadingService);
  readonly authSession = inject(AuthSessionService);

  private readonly router = inject(Router);
  private readonly routeLoading = inject(RouteLoadingService);

  openMobileNavigation(): void {
    this.mobileNavigationOpen.set(true);
  }

  closeMobileNavigation(): void {
    this.mobileNavigationOpen.set(false);
  }

  async signOut(): Promise<void> {
    this.closeMobileNavigation();
    await this.authSession.signOut();
    void this.router.navigate(['/login']);
  }

  @HostListener('window:resize')
  closeMobileNavigationAtDesktopBreakpoint(): void {
    if (this.mobileNavigationOpen() && globalThis.matchMedia?.(DESKTOP_MEDIA_QUERY).matches) {
      this.closeMobileNavigation();
    }
  }
}
