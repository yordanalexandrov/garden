import { Routes } from '@angular/router';

import { DashboardPage } from './pages/dashboard-page/dashboard-page';

export const dashboardRoutes: Routes = [
  { path: '', pathMatch: 'full', title: 'Dashboard', component: DashboardPage },
];
