import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AppShell } from '../../core/layout/app-shell';
import { ApiError } from '../../core/errors/api-error';
import { routes } from '../../app.routes';
import { PlaceDetail } from './places.models';
import { PlacesApiService } from './places-api.service';

describe('place detail shell and overview', () => {
  const placeDetail: PlaceDetail = {
    id: 'place-1',
    name: 'Home Garden',
    description: 'Back garden',
    notes: 'Irrigated',
    weatherEnabled: true,
    weatherLocationLabel: 'Ruse',
    latitude: 43.84,
    longitude: 25.95,
    timezone: 'Europe/Sofia',
    counts: {
      perennials: 12,
      beds: 4,
      openProblems: 2,
      upcomingTasks: 3,
    },
    createdAt: '2026-05-23T00:00:00.000Z',
    updatedAt: '2026-05-23T00:00:00.000Z',
    archivedAt: null,
  };
  const placesApi = {
    list: vi.fn(),
    get: vi.fn(),
  };

  beforeEach(async () => {
    placesApi.list.mockReturnValue(of({ items: [], page: 1, pageSize: 20, total: 0 }));
    placesApi.get.mockReturnValue(of(placeDetail));

    await TestBed.configureTestingModule({
      imports: [AppShell],
      providers: [
        provideNoopAnimations(),
        provideRouter(routes),
        { provide: PlacesApiService, useValue: placesApi },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  const renderPath = async (path: string) => {
    const fixture = TestBed.createComponent(AppShell);
    const router = TestBed.inject(Router);

    fixture.detectChanges();
    await router.navigateByUrl(path);
    await fixture.whenStable();
    fixture.detectChanges();

    return { fixture, router, compiled: fixture.nativeElement as HTMLElement };
  };

  it('redirects /places/:placeId to the overview child route', async () => {
    const { router, compiled, fixture } = await renderPath('/places/place-1');

    expect(router.url).toBe('/places/place-1/overview');
    expect(compiled.textContent).toContain('Home Garden');
    expect(compiled.textContent).toContain('12 perennials');
    expect(placesApi.get).toHaveBeenCalledWith('place-1');

    fixture.destroy();
  });

  it('renders place-scoped subnavigation and overview quick links', async () => {
    const { compiled, fixture } = await renderPath('/places/place-1/overview');

    for (const label of [
      'Overview',
      'Trees / Perennials',
      'Beds',
      'Activities',
      'Problems',
      'Calendar',
      'Weather',
    ]) {
      expect(compiled.textContent).toContain(label);
    }

    expect(compiled.textContent).toContain('Add perennial');
    expect(compiled.textContent).toContain('Add bed');
    expect(compiled.querySelector('router-outlet')).not.toBeNull();

    fixture.destroy();
  });

  it('renders API errors for inaccessible places', async () => {
    placesApi.get.mockReturnValue(
      throwError(() => new ApiError('NOT_FOUND', 'Place was not found.')),
    );
    const { compiled, fixture } = await renderPath('/places/missing/overview');

    expect(compiled.textContent).toContain('Place was not found.');

    fixture.destroy();
  });
});
