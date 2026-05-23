import { Routes } from '@angular/router';

import { PlantCreatePage } from './pages/plant-create-page/plant-create-page';
import { PlantDetailPage } from './pages/plant-detail-page/plant-detail-page';
import { PlantsListPage } from './pages/plants-list-page/plants-list-page';

export const plantsRoutes: Routes = [
  { path: '', pathMatch: 'full', title: 'Plants', component: PlantsListPage },
  { path: 'new', title: 'New Plant', component: PlantCreatePage },
  { path: ':plantId', title: 'Plant Detail', component: PlantDetailPage },
];
