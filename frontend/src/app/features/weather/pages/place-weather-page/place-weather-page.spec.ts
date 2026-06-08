import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApiError } from '../../../../core/errors/api-error';
import { WeatherApiService } from '../../data-access/weather-api.service';
import { PlaceWeatherPage } from './place-weather-page';

describe('Phase 22 place weather page', () => {
  const weatherApi = { getPlaceForecast: vi.fn() };

  beforeEach(() => {
    weatherApi.getPlaceForecast.mockReturnValue(
      of({
        placeId: 'place-1',
        enabled: true,
        locationLabel: 'Ruse',
        forecast: [
          {
            date: '2026-06-11',
            temperatureMinC: 12,
            temperatureMaxC: 24,
            rainProbability: 0.4,
            summary: 'Possible rain',
          },
        ],
      }),
    );

    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        {
          provide: ActivatedRoute,
          useValue: { parent: { snapshot: { paramMap: convertToParamMap({ placeId: 'place-1' }) } } },
        },
        { provide: WeatherApiService, useValue: weatherApi },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('renders enabled forecast rows as advisory context', () => {
    const fixture = TestBed.createComponent(PlaceWeatherPage);

    fixture.detectChanges();

    expect(weatherApi.getPlaceForecast).toHaveBeenCalledWith('place-1');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Ruse');
    expect(text).toContain('Possible rain');
    expect(text).toContain('Rain probability');
    expect(text).toContain('advisory context');
    expect(text).not.toContain('failed');
  });

  it('renders weather-disabled state without forecast rows', () => {
    weatherApi.getPlaceForecast.mockReturnValue(of({ placeId: 'place-1', enabled: false, forecast: [] }));
    const fixture = TestBed.createComponent(PlaceWeatherPage);

    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Weather is disabled');
    expect(text).not.toContain('Rain probability');
  });

  it('renders enabled empty forecast state and recoverable API errors', () => {
    weatherApi.getPlaceForecast.mockReturnValue(
      of({ placeId: 'place-1', enabled: true, locationLabel: 'Ruse', forecast: [] }),
    );
    const fixture = TestBed.createComponent(PlaceWeatherPage);
    const component = fixture.componentInstance;

    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No forecast returned');

    weatherApi.getPlaceForecast.mockReturnValue(
      throwError(() => new ApiError('EXTERNAL_SERVICE_ERROR', 'Forecast unavailable.')),
    );
    component.loadForecast();
    fixture.detectChanges();

    expect(component.error()?.code).toBe('EXTERNAL_SERVICE_ERROR');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Forecast unavailable.');
  });
});
