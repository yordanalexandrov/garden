import { Routes } from '@angular/router';

import { ProblemCreatePage } from './pages/problem-create-page/problem-create-page';
import { ProblemDetailPage } from './pages/problem-detail-page/problem-detail-page';
import { ProblemsListPage } from './pages/problems-list-page/problems-list-page';

export const problemsRoutes: Routes = [
  { path: '', pathMatch: 'full', title: 'Problems', component: ProblemsListPage },
  { path: 'new', title: 'New Problem', component: ProblemCreatePage },
  { path: ':problemId', title: 'Problem Detail', component: ProblemDetailPage },
];
