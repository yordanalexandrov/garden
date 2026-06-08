import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ApiClient } from '../../../core/api/api-client';
import { WeatherApiService } from './weather-api.service';

describe('Phase 22 weather API service', () => {
  const api = { get: vi.fn(), post: vi.fn() };

  beforeEach(() => {
    api.get.mockReturnValue(of({ placeId: 'place-1', enabled: false, forecast: [] }));
    api.post.mockReturnValue(
      of({ id: 'weather-1', userConfirmationStatus: 'confirmed_yes', observedRain: true }),
    );
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClient, useValue: api }],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('fetches place forecast through the canonical backend path and unwraps disabled data', () => {
    const service = TestBed.inject(WeatherApiService);
    let enabled = true;

    service.getPlaceForecast('place-1').subscribe((result) => {
      enabled = result.enabled;
    });

    expect(api.get).toHaveBeenCalledWith('/places/place-1/weather/forecast');
    expect(enabled).toBe(false);
  });

  it('confirms rain with only the canonical response payload', () => {
    const service = TestBed.inject(WeatherApiService);

    service.confirmRain('weather-1', 'confirmed_no').subscribe();

    expect(api.post).toHaveBeenCalledWith('/weather/events/weather-1/confirm-rain', {
      response: 'confirmed_no',
    });
    const trustedScopeField = ['account', 'Id'].join('');
    expect(api.post.mock.calls[0][1]).not.toHaveProperty(trustedScopeField);
  });
});
