import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';

import { AppShell } from './core/layout/app-shell';
import { routes } from './app.routes';

describe('app routes', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppShell],
      providers: [provideNoopAnimations(), provideRouter(routes)],
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

  it('renders primary placeholder routes without API providers', async () => {
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

  it('renders nested placeholder routes without data fetching', async () => {
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
