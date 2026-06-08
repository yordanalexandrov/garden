import { Routes } from '@angular/router';

import { TaskDetailPage } from './pages/task-detail-page/task-detail-page';
import { TasksListPage } from './pages/tasks-list-page/tasks-list-page';

export const tasksRoutes: Routes = [
  { path: '', pathMatch: 'full', title: 'Tasks', component: TasksListPage },
  { path: ':taskId', title: 'Task Detail', component: TaskDetailPage },
];
