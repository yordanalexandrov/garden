import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';

import { routes } from '../../app.routes';
import { provideAuthPortStub } from '../auth/auth-port.testing';
import { AppShell, PRIMARY_NAVIGATION_ITEMS } from './app-shell';

describe('AppShell', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppShell],
      providers: [provideNoopAnimations(), provideRouter(routes), provideAuthPortStub()],
    }).compileComponents();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the top app bar, primary navigation, and router outlet without API data', () => {
    const fixture = TestBed.createComponent(AppShell);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-toolbar')?.textContent).toContain('Gardening Helper');
    expect(compiled.querySelector('nav[aria-label="Primary navigation"]')).not.toBeNull();
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });

  it('includes the documented primary navigation entries in desktop navigation', () => {
    const fixture = TestBed.createComponent(AppShell);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const desktopNav = compiled.querySelector('nav[aria-label="Primary navigation"]');
    const labels = Array.from(desktopNav?.querySelectorAll('a') ?? []).map((link) =>
      link.textContent?.trim(),
    );

    expect(labels).toEqual(PRIMARY_NAVIGATION_ITEMS.map((item) => item.label));
  });

  it('opens and closes mobile navigation through icon controls', () => {
    const fixture = TestBed.createComponent(AppShell);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const component = fixture.componentInstance;
    const openButton = compiled.querySelector<HTMLButtonElement>(
      'button[aria-label="Open primary navigation"]',
    );
    const closeButton = compiled.querySelector<HTMLButtonElement>(
      'button[aria-label="Close primary navigation"]',
    );

    openButton?.click();
    fixture.detectChanges();
    expect(component.mobileNavigationOpen()).toBe(true);

    closeButton?.click();
    fixture.detectChanges();
    expect(component.mobileNavigationOpen()).toBe(false);
  });

  it('gives icon-only controls accessible names', () => {
    const fixture = TestBed.createComponent(AppShell);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const iconButtonLabels = Array.from(
      compiled.querySelectorAll<HTMLButtonElement>('.app-shell__icon-button'),
    ).map((button) => button.getAttribute('aria-label'));

    expect(iconButtonLabels).toContain('Open primary navigation');
    expect(iconButtonLabels).toContain('Close primary navigation');
  });

  it('has registered routes for primary navigation links', () => {
    const registeredPaths = new Set(
      routes
        .map((route) => route.path)
        .filter((path): path is string => typeof path === 'string' && path.length > 0)
        .map((path) => `/${path}`),
    );

    for (const item of PRIMARY_NAVIGATION_ITEMS) {
      expect(registeredPaths.has(item.route)).toBe(true);
    }
  });

  it('marks the active desktop navigation link for assistive technology', async () => {
    const fixture = TestBed.createComponent(AppShell);
    const router = TestBed.inject(Router);

    fixture.detectChanges();
    await router.navigateByUrl('/dashboard');
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const activeLink = compiled.querySelector(
      'nav[aria-label="Primary navigation"] a[aria-current="page"]',
    );

    expect(activeLink?.textContent).toContain('Dashboard');
  });

  it('closes the mobile navigation when the viewport reaches desktop size', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        media: '(min-width: 56rem)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    );

    const fixture = TestBed.createComponent(AppShell);
    const component = fixture.componentInstance;
    component.openMobileNavigation();
    fixture.detectChanges();

    window.dispatchEvent(new Event('resize'));
    fixture.detectChanges();

    expect(component.mobileNavigationOpen()).toBe(false);
  });
});
