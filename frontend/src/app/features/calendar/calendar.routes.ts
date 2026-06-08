import { Routes } from '@angular/router';

import { CalendarPage } from './pages/calendar-page/calendar-page';

export const calendarRoutes: Routes = [
  { path: '', pathMatch: 'full', title: 'Calendar', component: CalendarPage },
];
