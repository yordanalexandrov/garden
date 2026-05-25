import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AppShell } from './core/layout/app-shell';
import { ArchiveConfirmationService } from './shared/components/confirm-dialog/confirm-dialog';
import { InventoryApiService } from './features/inventory/inventory-api.service';
import { ProductsApiService, ProductRulesApiService } from './features/products/products-api.service';
import { PlantsApiService } from './features/plants/plants-api.service';
import { SnackbarService } from './core/notifications/snackbar.service';
import { routes } from './app.routes';

describe('app routes', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppShell],
      providers: [
        provideNoopAnimations(),
        provideRouter(routes),
        {
          provide: ProductsApiService,
          useValue: {
            list: () => of({ items: [], page: 1, pageSize: 20, total: 0 }),
            get: () => of(productDetail()),
          },
        },
        {
          provide: ProductRulesApiService,
          useValue: {
            listByProduct: () => of({ items: [] }),
            get: () => of(productRuleDetail()),
          },
        },
        {
          provide: InventoryApiService,
          useValue: {
            list: () => of({ items: [], page: 1, pageSize: 20, total: 0 }),
            listLots: () => of({ items: [], page: 1, pageSize: 20, total: 0 }),
            listMovements: () => of({ items: [], page: 1, pageSize: 20, total: 0 }),
          },
        },
        {
          provide: PlantsApiService,
          useValue: { list: () => of({ items: [], page: 1, pageSize: 20, total: 0 }) },
        },
        { provide: ArchiveConfirmationService, useValue: { confirmArchive: () => of(false) } },
        { provide: SnackbarService, useValue: { showMessage: vi.fn(), showError: vi.fn() } },
      ],
    }).compileComponents();
  });

  const renderPath = async (path: string) => {
    const fixture = TestBed.createComponent(AppShell);
    const router = TestBed.inject(Router);

    fixture.detectChanges();
    await router.navigateByUrl(path);
    await fixture.whenStable();
    fixture.detectChanges();

    return {
      compiled: fixture.nativeElement as HTMLElement,
      fixture,
      router,
    };
  };

  const expectHeading = (compiled: HTMLElement, heading: string) => {
    const title = compiled.querySelector('h1');
    const labelledSection = compiled.querySelector('section[aria-labelledby]');

    expect(title?.textContent?.trim()).toBe(heading);
    expect(title?.id).toBeTruthy();
    expect(labelledSection?.getAttribute('aria-labelledby')).toBe(title?.id);
  };

  it('redirects the root route to dashboard', async () => {
    const { compiled, fixture, router } = await renderPath('/');

    expect(router.url).toBe('/dashboard');
    expectHeading(compiled, 'Dashboard');

    fixture.destroy();
  });

  it('renders primary routes', async () => {
    const primaryRoutes = [
      ['/dashboard', 'Dashboard'],
      ['/calendar', 'Calendar'],
      ['/activities', 'Activities'],
      ['/problems', 'Problems'],
      ['/products', 'Products'],
      ['/inventory', 'Inventory'],
      ['/ai', 'AI Assistant'],
      ['/settings', 'Settings'],
    ] as const;

    for (const [path, heading] of primaryRoutes) {
      const { compiled, fixture } = await renderPath(path);

      expectHeading(compiled, heading);
      fixture.destroy();
    }
  });

  it('renders nested routes', async () => {
    const nestedRoutes = [
      ['/products/product-1/rules/new', 'New Product Usage Rule'],
      ['/product-rules/rule-1/edit', 'Edit Product Usage Rule'],
      ['/inventory/products/product-1/lots/new', 'New Inventory Lot'],
      ['/inventory/adjustments/new', 'New Inventory Adjustment'],
      ['/activities/activity-1', 'Activity Detail'],
      ['/problems/problem-1', 'Problem Detail'],
      ['/tasks/task-1', 'Task Detail'],
      ['/ai/problem-assist', 'AI Problem Assist'],
      ['/settings/notifications', 'Notification Settings'],
    ] as const;

    for (const [path, heading] of nestedRoutes) {
      const { compiled, fixture } = await renderPath(path);

      expectHeading(compiled, heading);
      fixture.destroy();
    }
  });

  it('renders a not-found state for unknown routes', async () => {
    const { compiled, fixture } = await renderPath('/unknown-route');

    expectHeading(compiled, 'Page not found');

    fixture.destroy();
  });
});

const productDetail = () => ({
  id: 'product-1',
  name: 'Copper Fungicide',
  category: 'fungicide',
  activeSubstance: null,
  manufacturer: null,
  formulation: null,
  defaultUnit: 'g',
  stockSummary: { quantityRemaining: 0, unit: 'g' },
  rulesCount: 0,
  archivedAt: null,
  notes: null,
  usageRules: [],
  inventorySummary: { quantityRemaining: 0, unit: 'g', lotsCount: 0, expiredLotsCount: 0 },
  recentMovements: [],
  createdAt: '2026-05-25T00:00:00.000Z',
  updatedAt: '2026-05-25T00:00:00.000Z',
});

const productRuleDetail = () => ({
  id: 'rule-1',
  productId: 'product-1',
  plantId: 'plant-1',
  doseValue: 1,
  doseUnit: 'g',
  dilutionText: null,
  applicationMethod: null,
  reapplicationIntervalDays: null,
  quarantinePeriodDays: null,
  notes: null,
  archivedAt: null,
  createdAt: '2026-05-25T00:00:00.000Z',
  updatedAt: '2026-05-25T00:00:00.000Z',
});
