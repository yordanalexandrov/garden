import { Routes } from '@angular/router';

import { PlaceBedsPage } from '../beds/pages/place-beds-page/place-beds-page';
import { PlacePerennialsPage } from '../perennials/pages/place-perennials-page/place-perennials-page';
import { PlaceDetailShell } from './pages/place-detail-shell/place-detail-shell';
import { PlaceOverviewPage } from './pages/place-overview-page/place-overview-page';
import { PlacesListPage } from './pages/places-list-page/places-list-page';


export const placesRoutes: Routes = [
  { path: '', pathMatch: 'full', title: 'Places', component: PlacesListPage },
  {
    path: ':placeId',
    title: 'Place',
    component: PlaceDetailShell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      { path: 'overview', title: 'Place Overview', component: PlaceOverviewPage },
      { path: 'perennials', title: 'Place Perennials', component: PlacePerennialsPage },
      { path: 'beds', title: 'Place Beds', component: PlaceBedsPage },
      { path: 'activities', title: 'Place Activities', loadComponent: () => import('../activities/pages/activities-list-page/activities-list-page').then((m) => m.ActivitiesListPage) },
      { path: 'problems', title: 'Place Problems', loadComponent: () => import('../problems/pages/problems-list-page/problems-list-page').then((m) => m.ProblemsListPage) },
      { path: 'calendar', title: 'Place Calendar', loadComponent: () => import('../calendar/pages/calendar-page/calendar-page').then((module) => module.CalendarPage) },
      {
        path: 'weather',
        title: 'Place Weather',
        loadComponent: () =>
          import('../weather/pages/place-weather-page/place-weather-page').then(
            (module) => module.PlaceWeatherPage,
          ),
      },
    ],
  },
];
