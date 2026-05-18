import { TestBed } from '@angular/core/testing';

import { AppLoadingService } from './app-loading.service';

describe('AppLoadingService', () => {
  it('tracks app loading reasons until their stop callbacks run', () => {
    const service = TestBed.inject(AppLoadingService);

    const stopApp = service.start('app-initialization');
    const stopRoute = service.start('route');

    expect(service.isLoading()).toBe(true);
    expect(service.reasons()).toEqual(['app-initialization', 'route']);

    stopApp();

    expect(service.isLoading()).toBe(true);
    expect(service.reasons()).toEqual(['route']);

    stopRoute();

    expect(service.isLoading()).toBe(false);
    expect(service.reasons()).toEqual([]);
  });

  it('is safe to stop the same loading reason more than once', () => {
    const service = TestBed.inject(AppLoadingService);
    const stopLoading = service.start('route');

    stopLoading();
    stopLoading();

    expect(service.isLoading()).toBe(false);
  });

  it('keeps loading active for overlapping operations with the same reason', () => {
    const service = TestBed.inject(AppLoadingService);
    const stopFirstOperation = service.start('app');
    const stopSecondOperation = service.start('app');

    expect(service.isLoading()).toBe(true);
    expect(service.reasons()).toEqual(['app']);

    stopFirstOperation();

    expect(service.isLoading()).toBe(true);
    expect(service.reasons()).toEqual(['app']);

    stopSecondOperation();

    expect(service.isLoading()).toBe(false);
    expect(service.reasons()).toEqual([]);
  });
});
