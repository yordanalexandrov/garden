import { Route, Routes } from '@angular/router';

import { NotFoundPage } from './features/not-found/not-found-page';
import { FeaturePlaceholderPage } from './features/placeholders/feature-placeholder-page';

const placeholderRoute = (path: string, title: string, pathMatch?: 'full'): Route => ({
  path,
  pathMatch,
  title,
  component: FeaturePlaceholderPage,
  data: { title },
});

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  placeholderRoute('dashboard', 'Dashboard'),
  {
    path: 'places',
    children: [
      placeholderRoute('', 'Places', 'full'),
      {
        path: ':placeId',
        children: [
          placeholderRoute('', 'Place Overview', 'full'),
          placeholderRoute('overview', 'Place Overview'),
          placeholderRoute('perennials', 'Place Perennials'),
          placeholderRoute('beds', 'Place Beds'),
          placeholderRoute('activities', 'Place Activities'),
          placeholderRoute('problems', 'Place Problems'),
          placeholderRoute('calendar', 'Place Calendar'),
          placeholderRoute('weather', 'Place Weather'),
        ],
      },
    ],
  },
  {
    path: 'plants',
    children: [
      placeholderRoute('', 'Plants', 'full'),
      placeholderRoute('new', 'New Plant'),
      placeholderRoute(':plantId', 'Plant Detail'),
    ],
  },
  {
    path: 'products',
    children: [
      placeholderRoute('', 'Products', 'full'),
      placeholderRoute('new', 'New Product'),
      {
        path: ':productId',
        children: [
          placeholderRoute('', 'Product Detail', 'full'),
          placeholderRoute('edit', 'Edit Product'),
          {
            path: 'rules',
            children: [placeholderRoute('new', 'New Product Usage Rule')],
          },
        ],
      },
    ],
  },
  {
    path: 'product-rules',
    children: [
      {
        path: ':ruleId',
        children: [placeholderRoute('edit', 'Edit Product Usage Rule')],
      },
    ],
  },
  {
    path: 'inventory',
    children: [
      placeholderRoute('', 'Inventory', 'full'),
      {
        path: 'products',
        children: [
          {
            path: ':productId',
            children: [
              placeholderRoute('', 'Product Inventory', 'full'),
              {
                path: 'lots',
                children: [placeholderRoute('new', 'New Inventory Lot')],
              },
            ],
          },
        ],
      },
      {
        path: 'adjustments',
        children: [placeholderRoute('new', 'New Inventory Adjustment')],
      },
    ],
  },
  {
    path: 'activities',
    children: [
      placeholderRoute('', 'Activities', 'full'),
      placeholderRoute('new', 'New Activity'),
      placeholderRoute(':activityId', 'Activity Detail'),
    ],
  },
  {
    path: 'problems',
    children: [
      placeholderRoute('', 'Problems', 'full'),
      placeholderRoute('new', 'New Problem'),
      placeholderRoute(':problemId', 'Problem Detail'),
    ],
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
  { path: '**', title: 'Page not found', component: NotFoundPage, data: { title: 'Page not found' } },
];
