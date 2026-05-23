import { Routes } from '@angular/router';

import { PlaceBedsPage } from '../beds/pages/place-beds-page/place-beds-page';
import { FeaturePlaceholderPage } from '../placeholders/feature-placeholder-page';
import { PlacePerennialsPage } from '../perennials/pages/place-perennials-page/place-perennials-page';
import { PlaceDetailShell } from './pages/place-detail-shell/place-detail-shell';
import { PlaceOverviewPage } from './pages/place-overview-page/place-overview-page';
import { PlacesListPage } from './pages/places-list-page/places-list-page';

const placeholderChild = (path: string, title: string) => ({
  path,
  title,
  component: FeaturePlaceholderPage,
  data: { title },
});

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
      placeholderChild('activities', 'Place Activities'),
      placeholderChild('problems', 'Place Problems'),
      placeholderChild('calendar', 'Place Calendar'),
      placeholderChild('weather', 'Place Weather'),
    ],
  },
];
