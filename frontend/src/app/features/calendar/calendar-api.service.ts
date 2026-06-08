import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../core/api/api-client';
import { buildQueryParams } from '../../core/api/query-params';
import { CalendarFeed, CalendarQuery } from './calendar.models';

@Injectable({ providedIn: 'root' })
export class CalendarApiService {
  private readonly api = inject(ApiClient);

  getCalendar(query: CalendarQuery): Observable<CalendarFeed> {
    return this.api.get<CalendarFeed>('/calendar', {
      params: buildQueryParams(query),
    });
  }
}
