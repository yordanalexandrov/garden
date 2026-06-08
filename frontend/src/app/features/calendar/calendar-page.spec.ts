import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { ApiError } from '../../core/errors/api-error';
import { PlacesApiService } from '../places/places-api.service';
import { CalendarApiService } from './calendar-api.service';
import { CalendarPage } from './pages/calendar-page/calendar-page';

const calendarFeed = () => ({
  activities: [
    {
      id: 'activity-1',
      type: 'activity' as const,
      activityType: 'treatment',
      dateTime: '2026-06-10T08:00:00.000Z',
      title: 'Copper treatment',
      placeId: 'place-1',
      targetSummary: 'Pear Tree 1',
    },
  ],
  tasks: [
    {
      id: 'task-planned',
      type: 'task' as const,
      taskType: 'spraying',
      dueDate: '2026-06-12',
      status: 'planned',
      title: 'Spray pears',
      placeId: 'place-1',
      targetSummary: 'Pear Tree 1',
    },
    {
      id: 'task-suggested',
      type: 'task' as const,
      taskType: 'fertilizing',
      dueDate: '2026-06-13',
      status: 'suggested',
      title: 'Review fertilizer',
      placeId: 'place-1',
      targetSummary: 'Bed A',
    },
  ],
  quarantinePeriods: [
    {
      id: 'quarantine-1',
      type: 'quarantine' as const,
      startsOn: '2026-06-10',
      endsOn: '2026-06-20',
      title: 'Copper quarantine',
      activityId: 'activity-1',
      productId: 'product-1',
      placeId: 'place-1',
    },
  ],
  weatherEvents: [
    {
      id: 'weather-1',
      type: 'weather' as const,
      date: '2026-06-11',
      eventType: 'rain_check',
      userConfirmationStatus: 'pending',
      observedRain: null,
      placeId: 'place-1',
    },
  ],
});

describe('Phase 20 calendar page', () => {
  const calendarApi = { getCalendar: vi.fn() };
  const placesApi = { list: vi.fn() };
  const dialog = { open: vi.fn() };

  beforeEach(() => {
    calendarApi.getCalendar.mockReturnValue(of(calendarFeed()));
    placesApi.list.mockReturnValue(
      of({ items: [{ id: 'place-1', name: 'Home Garden' }], page: 1, pageSize: 20, total: 1 }),
    );
    dialog.open.mockReturnValue({ afterClosed: () => of(true) });

    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({}) },
            parent: { snapshot: { paramMap: convertToParamMap({}) } },
          },
        },
        { provide: CalendarApiService, useValue: calendarApi },
        { provide: PlacesApiService, useValue: placesApi },
        { provide: MatDialog, useValue: dialog },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('requests the visible date range and renders distinct item types with legend', () => {
    const fixture = TestBed.createComponent(CalendarPage);

    fixture.detectChanges();

    expect(calendarApi.getCalendar).toHaveBeenCalledWith(
      expect.objectContaining({ from: expect.stringMatching(/^\d{4}-\d{2}-01$/), to: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) }),
    );
    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.textContent ?? '';
    expect(text).toContain('Activities');
    expect(text).toContain('Planned tasks');
    expect(text).toContain('Suggested tasks');
    expect(text).toContain('Quarantine');
    expect(text).toContain('Weather markers');
    expect(compiled.querySelector('.calendar-item--activity')).toBeTruthy();
    expect(compiled.querySelector('.calendar-item--planned')).toBeTruthy();
    expect(compiled.querySelector('.calendar-item--suggested')).toBeTruthy();
    expect(compiled.querySelector('.calendar-item--quarantine')).toBeTruthy();
    expect(compiled.querySelector('.calendar-item--weather')).toBeTruthy();
  });

  it('sends place filters through canonical query params', () => {
    const fixture = TestBed.createComponent(CalendarPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.placeId.setValue('place-1');
    component.load();

    expect(calendarApi.getCalendar).toHaveBeenLastCalledWith(
      expect.objectContaining({ placeId: 'place-1' }),
    );
  });

  it('opens read-only quarantine and weather summaries without mutation controls', () => {
    const fixture = TestBed.createComponent(CalendarPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.openQuarantine(calendarFeed().quarantinePeriods[0]);
    component.openWeather(calendarFeed().weatherEvents[0]);

    expect(dialog.open).toHaveBeenCalledTimes(2);
    expect(dialog.open.mock.calls[1][1].data.lines).toContain('Confirmation status: pending.');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('Confirm');
    expect(text).not.toContain('Skip');
    expect(text).not.toContain('Dismiss');
    expect(text).toContain('pending');
  });

  it('shows API errors while keeping the previous calendar feed visible', () => {
    const fixture = TestBed.createComponent(CalendarPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    calendarApi.getCalendar.mockReturnValue(throwError(() => new ApiError('VALIDATION_ERROR', 'Bad range.')));
    component.load();
    fixture.detectChanges();

    expect(component.error()?.code).toBe('VALIDATION_ERROR');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Spray pears');
  });
});
