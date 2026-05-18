import { Routes } from '@angular/router';

import { PrimaryRoutePlaceholder } from './core/layout/primary-route-placeholder';

const primaryPlaceholderRoutes: Routes = [
  { path: 'dashboard', component: PrimaryRoutePlaceholder, data: { title: 'Dashboard' } },
  { path: 'places', component: PrimaryRoutePlaceholder, data: { title: 'Places' } },
  { path: 'calendar', component: PrimaryRoutePlaceholder, data: { title: 'Calendar' } },
  { path: 'activities', component: PrimaryRoutePlaceholder, data: { title: 'Activities' } },
  { path: 'problems', component: PrimaryRoutePlaceholder, data: { title: 'Problems' } },
  { path: 'plants', component: PrimaryRoutePlaceholder, data: { title: 'Plants' } },
  { path: 'products', component: PrimaryRoutePlaceholder, data: { title: 'Products' } },
  { path: 'inventory', component: PrimaryRoutePlaceholder, data: { title: 'Inventory' } },
  { path: 'ai', component: PrimaryRoutePlaceholder, data: { title: 'AI Assistant' } },
  { path: 'settings', component: PrimaryRoutePlaceholder, data: { title: 'Settings' } },
];

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  ...primaryPlaceholderRoutes,
];
