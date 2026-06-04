import { Route, Routes } from '@angular/router';

import { LoginPage } from './features/auth/pages/login-page/login-page';
import { BedDetailPage } from './features/beds/pages/bed-detail-page/bed-detail-page';
import { inventoryRoutes } from './features/inventory/inventory.routes';
import { NotFoundPage } from './features/not-found/not-found-page';
import { FeaturePlaceholderPage } from './features/placeholders/feature-placeholder-page';
import { placesRoutes } from './features/places/places.routes';
import { plantsRoutes } from './features/plants/plants.routes';
import { productRulesRoutes, productsRoutes } from './features/products/products.routes';

const placeholderRoute = (path: string, title: string, pathMatch?: 'full'): Route => ({
  path,
  pathMatch,
  title,
  component: FeaturePlaceholderPage,
  data: { title },
});

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'login', title: 'Sign in', component: LoginPage },
  placeholderRoute('dashboard', 'Dashboard'),
  { path: 'places', children: placesRoutes },
  { path: 'beds/:bedId', title: 'Bed Detail', component: BedDetailPage },
  { path: 'plants', children: plantsRoutes },
  { path: 'products', children: productsRoutes },
  { path: 'product-rules', children: productRulesRoutes },
  { path: 'inventory', children: inventoryRoutes },
  {
    path: 'activities',
    loadChildren: () =>
      import('./features/activities/activities.routes').then((module) => module.activitiesRoutes),
  },
  {
    path: 'problems',
    loadChildren: () =>
      import('./features/problems/problems.routes').then((module) => module.problemsRoutes),
  },
  placeholderRoute('calendar', 'Calendar'),
  {
    path: 'tasks',
    children: [placeholderRoute(':taskId', 'Task Detail')],
  },
  {
    path: 'ai',
    children: [
      placeholderRoute('', 'AI Assistant', 'full'),
      placeholderRoute('product-ingestion', 'AI Product Ingestion'),
      placeholderRoute('bed-planning', 'AI Bed Planning'),
      placeholderRoute('problem-assist', 'AI Problem Assist'),
    ],
  },
  {
    path: 'settings',
    children: [
      placeholderRoute('', 'Settings', 'full'),
      placeholderRoute('notifications', 'Notification Settings'),
      placeholderRoute('account', 'Account Settings'),
    ],
  },
  {
    path: '**',
    title: 'Page not found',
    component: NotFoundPage,
    data: { title: 'Page not found' },
  },
];
