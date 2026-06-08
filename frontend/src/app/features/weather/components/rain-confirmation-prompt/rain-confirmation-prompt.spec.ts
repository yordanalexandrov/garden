import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { ApiError } from '../../../../core/errors/api-error';
import { WeatherApiService } from '../../data-access/weather-api.service';
import { RainConfirmationPrompt } from './rain-confirmation-prompt';

describe('Phase 22 rain confirmation prompt', () => {
  const weatherApi = { confirmRain: vi.fn() };

  beforeEach(() => {
    weatherApi.confirmRain.mockReturnValue(
      of({ id: 'weather-1', userConfirmationStatus: 'confirmed_yes', observedRain: true }),
    );
    TestBed.configureTestingModule({
      providers: [provideNoopAnimations(), { provide: WeatherApiService, useValue: weatherApi }],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('renders only pending rain checks with observed-rain wording', () => {
    const fixture = TestBed.createComponent(RainConfirmationPrompt);
    fixture.componentRef.setInput('event', {
      id: 'weather-1',
      eventType: 'rain_check',
      userConfirmationStatus: 'pending',
      observedRain: null,
    });

    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Did you observe rain');
    expect(text).toContain('Yes, it rained');
    expect(text).toContain('No, it did not');
    expect(text).toContain('Ignore for now');
    expect(text).not.toContain('failed');
  });

  it('submits yes/no/ignore as canonical payload values and updates from backend response', () => {
    const fixture = TestBed.createComponent(RainConfirmationPrompt);
    fixture.componentRef.setInput('event', {
      id: 'weather-1',
      eventType: 'rain_check',
      userConfirmationStatus: 'pending',
      observedRain: null,
    });
    fixture.detectChanges();

    fixture.componentInstance.confirm('confirmed_yes');
    fixture.detectChanges();

    expect(weatherApi.confirmRain).toHaveBeenCalledWith('weather-1', 'confirmed_yes');
    expect(fixture.componentInstance.currentStatus()).toBe('confirmed_yes');
    expect(fixture.componentInstance.observedRain()).toBe(true);

    fixture.componentRef.setInput('event', {
      id: 'weather-2',
      eventType: 'rain_check',
      userConfirmationStatus: 'pending',
      observedRain: null,
    });
    fixture.detectChanges();
    fixture.componentInstance.confirm('confirmed_no');
    fixture.componentInstance.confirm('ignored');

    expect(weatherApi.confirmRain).toHaveBeenNthCalledWith(2, 'weather-2', 'confirmed_no');
  });

  it('shows API errors without clearing the prompt context', () => {
    weatherApi.confirmRain.mockReturnValue(
      throwError(() => new ApiError('BUSINESS_RULE_VIOLATION', 'Rain check is closed.')),
    );
    const fixture = TestBed.createComponent(RainConfirmationPrompt);
    fixture.componentRef.setInput('event', {
      id: 'weather-1',
      eventType: 'rain_check',
      userConfirmationStatus: 'pending',
      observedRain: null,
    });
    fixture.detectChanges();

    fixture.componentInstance.confirm('ignored');
    fixture.detectChanges();

    expect(fixture.componentInstance.error()?.code).toBe('BUSINESS_RULE_VIOLATION');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Rain check is closed.');
    expect(text).toContain('Did you observe rain');
  });
});
