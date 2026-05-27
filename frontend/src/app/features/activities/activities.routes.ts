import { Routes } from '@angular/router';

import { ActivityCreatePage } from './pages/activity-create-page/activity-create-page';
import { ActivityDetailPage } from './pages/activity-detail-page/activity-detail-page';
import { ActivitiesListPage } from './pages/activities-list-page/activities-list-page';

export const activitiesRoutes: Routes = [
  { path: '', pathMatch: 'full', title: 'Activities', component: ActivitiesListPage },
  { path: 'new', title: 'New Activity', component: ActivityCreatePage },
  { path: ':activityId', title: 'Activity Detail', component: ActivityDetailPage },
];
