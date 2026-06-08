import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-calendar-legend',
  templateUrl: './calendar-legend.html',
  styleUrl: './calendar-legend.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarLegend {
  readonly entries = [
    { label: 'Activities', className: 'calendar-legend__marker--activity' },
    { label: 'Planned tasks', className: 'calendar-legend__marker--planned' },
    { label: 'Suggested tasks', className: 'calendar-legend__marker--suggested' },
    { label: 'Quarantine', className: 'calendar-legend__marker--quarantine' },
    { label: 'Weather markers', className: 'calendar-legend__marker--weather' },
  ] as const;
}
