import { TestBed } from '@angular/core/testing';
import {
  Event as RouterEvent,
  NavigationEnd,
  NavigationStart,
  Route,
  RouteConfigLoadEnd,
  RouteConfigLoadStart,
  Router,
} from '@angular/router';
import { Subject } from 'rxjs';

import { AppLoadingService } from './app-loading.service';
import { RouteLoadingService } from './route-loading.service';

describe('RouteLoadingService', () => {
  let events: Subject<RouterEvent>;
  let loading: AppLoadingService;

  beforeEach(() => {
    events = new Subject<RouterEvent>();

    TestBed.configureTestingModule({
      providers: [
        RouteLoadingService,
        {
          provide: Router,
          useValue: {
            events: events.asObservable(),
          } satisfies Pick<Router, 'events'>,
        },
      ],
    });

    loading = TestBed.inject(AppLoadingService);
    TestBed.inject(RouteLoadingService);
  });

  afterEach(() => {
    events.complete();
  });

  it('tracks loading for navigation start and end events', () => {
    events.next(new NavigationStart(1, '/dashboard'));

    expect(loading.isLoading()).toBe(true);
    expect(loading.reasons()).toEqual(['route']);

    events.next(new NavigationEnd(1, '/dashboard', '/dashboard'));

    expect(loading.isLoading()).toBe(false);
    expect(loading.reasons()).toEqual([]);
  });

  it('keeps route loading active while navigation continues after lazy config load ends', () => {
    const lazyRoute: Route = { path: 'lazy', loadChildren: () => Promise.resolve([]) };

    events.next(new NavigationStart(1, '/lazy'));
    events.next(new RouteConfigLoadStart(lazyRoute));

    expect(loading.isLoading()).toBe(true);
    expect(loading.reasons()).toEqual(['route']);

    events.next(new RouteConfigLoadEnd(lazyRoute));

    expect(loading.isLoading()).toBe(true);
    expect(loading.reasons()).toEqual(['route']);

    events.next(new NavigationEnd(1, '/lazy', '/lazy'));

    expect(loading.isLoading()).toBe(false);
  });
});
