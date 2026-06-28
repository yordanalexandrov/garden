import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { provideAuthPortStub } from './core/auth/auth-port.testing';
import { AppShell } from './core/layout/app-shell';
import { ArchiveConfirmationService } from './shared/components/confirm-dialog/confirm-dialog';
import { InventoryApiService } from './features/inventory/inventory-api.service';
import { ProblemsApiService } from './features/problems/problems-api.service';
import { ProductsApiService, ProductRulesApiService } from './features/products/products-api.service';
import { PlantsApiService } from './features/plants/plants-api.service';
import { ActivitiesApiService } from './features/activities/activities-api.service';
import { CalendarApiService } from './features/calendar/calendar-api.service';
import { DashboardApiService } from './features/dashboard/dashboard-api.service';
import { PlacesApiService } from './features/places/places-api.service';
import { SnackbarService } from './core/notifications/snackbar.service';
import { TasksApiService } from './features/tasks/tasks-api.service';
import { routes } from './app.routes';

describe('app routes', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppShell],
      providers: [
        provideNoopAnimations(),
        provideRouter(routes),
        provideAuthPortStub(),
        {
          provide: ActivitiesApiService,
          useValue: {
            list: () => of({ items: [], page: 1, pageSize: 20, total: 0 }),
            get: () => of(activityDetail()),
            create: () => of({ activity: activityDetail(), inventoryEffects: [], quarantinePeriods: [], suggestedTasks: [], warnings: [] }),
          },
        },
        {
          provide: PlacesApiService,
          useValue: { list: () => of({ items: [], page: 1, pageSize: 20, total: 0 }) },
        },
        {
          provide: DashboardApiService,
          useValue: {
            getDashboard: () =>
              of({
                upcomingTasks: [],
                suggestedTasks: [],
                activeQuarantinePeriods: [],
                recentActivities: [],
                openProblems: [],
                lowStockProducts: [],
                places: [],
              }),
          },
        },
        {
          provide: CalendarApiService,
          useValue: {
            getCalendar: () =>
              of({ activities: [], tasks: [], quarantinePeriods: [], weatherEvents: [] }),
          },
        },
        {
          provide: TasksApiService,
          useValue: {
            list: () => of({ items: [], page: 1, pageSize: 20, total: 0 }),
            get: () => of(taskDetail()),
            confirm: () =>
              of({ id: 'task-1', status: 'planned', confirmedAt: '2026-06-01T00:00:00.000Z', reminders: [] }),
            dismiss: () => of(taskDetail()),
            complete: () => of(taskDetail()),
            skip: () => of(taskDetail()),
          },
        },
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
        {
          provide: ProblemsApiService,
          useValue: {
            list: () => of({ items: [], page: 1, pageSize: 100, total: 0 }),
            get: () => of({ id: 'problem-1', type: 'problem', placeId: 'place-1', targetType: 'bed', targetId: 'bed-1', targetLabel: 'Bed A', title: 'Leaf spots', description: 'Dark spots', category: 'fungus', severity: 'medium', status: 'open', observedAt: '2026-05-13T07:00:00.000Z', photos: [], linkedActivity: null }),
          },
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
      ['/tasks', 'Tasks'],
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

const activityDetail = () => ({
  id: 'activity-1',
  placeId: 'place-1',
  type: 'watering',
  performedAt: '2026-05-26T08:00:00.000Z',
  targetScopeType: 'whole_place',
  targets: [],
  productUsages: [],
  inventoryMovements: [],
  quarantinePeriods: [],
  suggestedTasks: [],
  notes: null,
});

const taskDetail = () => ({
  id: 'task-1',
  placeId: 'place-1',
  type: 'spraying',
  dueDate: '2026-06-10',
  status: 'suggested',
  targetScopeType: 'whole_place',
  targetSummary: 'Home Garden',
  sourceType: 'activity',
  sourceReferenceId: 'activity-1',
  targets: [],
  reminders: [],
  weatherEvents: [],
  notes: null,
  confirmedAt: null,
  completedAt: null,
});
