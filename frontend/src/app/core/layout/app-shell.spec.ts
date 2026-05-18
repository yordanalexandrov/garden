import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { AppShell, PRIMARY_NAVIGATION_ITEMS } from './app-shell';

describe('AppShell', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppShell],
      providers: [provideNoopAnimations(), provideRouter([])],
    }).compileComponents();
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
});
