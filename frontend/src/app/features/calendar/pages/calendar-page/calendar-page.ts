import { DatePipe, NgClass, PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { EMPTY, Subject, catchError, map, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { PlacesApiService } from '../../../places/places-api.service';
import { PlaceListItem } from '../../../places/places.models';
import { WeatherApiService } from '../../../weather/data-access/weather-api.service';
import { PlaceWeatherForecast } from '../../../weather/weather.models';
import { CalendarApiService } from '../../calendar-api.service';
import {
  CalendarDay,
  CalendarFeed,
  CalendarItem,
  CalendarQuarantinePeriodItem,
  CalendarWeatherEventItem,
} from '../../calendar.models';
import { CalendarLegend } from '../../components/calendar-legend/calendar-legend';
import {
  CalendarReadonlyDialog,
  CalendarReadonlyDialogData,
} from '../../components/calendar-readonly-dialog/calendar-readonly-dialog';

const emptyFeed = (): CalendarFeed => ({
  activities: [],
  tasks: [],
  quarantinePeriods: [],
  weatherEvents: [],
});

@Component({
  selector: 'app-calendar-page',
  imports: [
    ApiErrorSummary,
    CalendarLegend,
    DatePipe,
    NgClass,
    EmptyState,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatOptionModule,
    MatSelectModule,
    PageHeader,
    PercentPipe,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './calendar-page.html',
  styleUrl: './calendar-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPage {
  readonly feed = signal<CalendarFeed>(emptyFeed());
  readonly days = signal<readonly CalendarDay[]>([]);
  readonly agenda = signal<readonly CalendarItem[]>([]);
  readonly places = signal<readonly PlaceListItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<ApiError | null>(null);
  readonly forecast = signal<PlaceWeatherForecast | null>(null);
  readonly forecastLoading = signal(false);
  readonly placeId = new FormControl<string | null>(null);
  readonly visibleMonth = signal(startOfMonth(new Date()));

  private readonly calendarApi = inject(CalendarApiService);
  private readonly placesApi = inject(PlacesApiService);
  private readonly weatherApi = inject(WeatherApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly forecastRequest$ = new Subject<string | null>();

  constructor() {
    const routePlaceId = this.route.parent?.snapshot.paramMap.get('placeId') ?? null;
    this.placeId.setValue(routePlaceId);
    this.placesApi
      .list({ page: 1, pageSize: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => this.places.set(result.items));

    this.forecastRequest$
      .pipe(
        switchMap((placeId) => {
          if (!placeId) {
            this.forecast.set(null);
            this.forecastLoading.set(false);
            return EMPTY;
          }
          this.forecastLoading.set(true);
          return this.weatherApi.getPlaceForecast(placeId).pipe(
            map((result) => (result.enabled ? result : null) as PlaceWeatherForecast | null),
            catchError(() => [null] as (PlaceWeatherForecast | null)[]),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.forecast.set(result);
        this.forecastLoading.set(false);
      });

    this.placeId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((placeId) => this.forecastRequest$.next(placeId));

    if (routePlaceId) {
      this.forecastRequest$.next(routePlaceId);
    }

    this.load();
  }

  previousMonth(): void {
    const current = this.visibleMonth();
    this.visibleMonth.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
    this.load();
  }

  nextMonth(): void {
    const current = this.visibleMonth();
    this.visibleMonth.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
    this.load();
  }

  currentMonth(): void {
    this.visibleMonth.set(startOfMonth(new Date()));
    this.load();
  }

  load(): void {
    const month = this.visibleMonth();
    const from = formatDate(new Date(month.getFullYear(), month.getMonth(), 1));
    const to = formatDate(new Date(month.getFullYear(), month.getMonth() + 1, 0));

    this.loading.set(true);
    this.error.set(null);

    this.calendarApi
      .getCalendar({ from, to, placeId: this.placeId.value || undefined })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (feed) => {
          const agenda = buildAgenda(feed);

          this.feed.set(feed);
          this.days.set(buildMonthDays(month, agenda));
          this.agenda.set(agenda);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(mapApiError(error));
          this.loading.set(false);
        },
      });
  }

  itemDate(item: CalendarItem): string {
    if (item.type === 'activity') {
      return item.dateTime;
    }

    if (item.type === 'task') {
      return item.dueDate;
    }

    if (item.type === 'quarantine') {
      return item.startsOn;
    }

    return item.date;
  }

  itemClass(item: CalendarItem): string {
    if (item.type === 'task') {
      return `calendar-item calendar-item--task calendar-item--${item.status}`;
    }

    return `calendar-item calendar-item--${item.type}`;
  }

  openQuarantine(period: CalendarQuarantinePeriodItem): void {
    this.openReadonlyDialog({
      title: period.title,
      lines: [
        `Read-only quarantine range: ${period.startsOn} to ${period.endsOn}.`,
        `Related activity: ${period.activityId}.`,
        `Product: ${period.productId}.`,
      ],
    });
  }


  openWeather(event: CalendarWeatherEventItem): void {
    const observedRain =
      event.observedRain === undefined || event.observedRain === null
        ? 'not recorded'
        : event.observedRain
          ? 'yes'
          : 'no';

    this.openReadonlyDialog({
      title: event.eventType,
      lines: [
        `Advisory weather marker for ${event.date}.`,
        `Confirmation status: ${event.userConfirmationStatus || 'not confirmed'}.`,
        `Observed rain: ${observedRain}.`,
      ],
    });
  }

  private openReadonlyDialog(data: CalendarReadonlyDialogData): void {
    this.dialog.open<CalendarReadonlyDialog, CalendarReadonlyDialogData>(CalendarReadonlyDialog, {
      data,
    });
  }
}

const startOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const buildMonthDays = (month: Date, agenda: readonly CalendarItem[]): readonly CalendarDay[] => {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const firstGridDate = new Date(first);
  firstGridDate.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstGridDate);
    date.setDate(firstGridDate.getDate() + index);
    const iso = formatDate(date);

    return {
      date: iso,
      dayNumber: date.getDate(),
      inMonth: date.getMonth() === month.getMonth(),
      items: itemsForDate(agenda, iso),
    };
  });
};

const buildAgenda = (feed: CalendarFeed): readonly CalendarItem[] =>
  [
    ...feed.activities,
    ...feed.tasks,
    ...feed.quarantinePeriods,
    ...feed.weatherEvents,
  ].sort((left, right) => compareCalendarItems(left, right));

const compareCalendarItems = (left: CalendarItem, right: CalendarItem): number =>
  dateKey(left).localeCompare(dateKey(right));

const itemsForDate = (agenda: readonly CalendarItem[], iso: string): readonly CalendarItem[] =>
  agenda.filter((item) => {
    if (item.type === 'quarantine') {
      return item.startsOn <= iso && item.endsOn >= iso;
    }

    return dateKey(item).slice(0, 10) === iso;
  });

const dateKey = (item: CalendarItem): string => {
  if (item.type === 'activity') {
    return item.dateTime;
  }

  if (item.type === 'task') {
    return item.dueDate;
  }

  if (item.type === 'quarantine') {
    return item.startsOn;
  }

  return item.date;
};
