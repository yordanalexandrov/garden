import { Routes } from '@angular/router';

export const aiRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'AI Assistant',
    loadComponent: () =>
      import('./pages/ai-landing-page/ai-landing-page').then((m) => m.AiLandingPage),
  },
  {
    path: 'product-ingestion',
    title: 'AI Product Ingestion',
    loadComponent: () =>
      import('./pages/product-ingestion-page/product-ingestion-page').then(
        (m) => m.ProductIngestionPage,
      ),
  },
  {
    path: 'bed-planning',
    title: 'AI Bed Planning',
    loadComponent: () =>
      import('./pages/bed-planning-page/bed-planning-page').then((m) => m.BedPlanningPage),
  },
  {
    path: 'problem-assist',
    title: 'AI Problem Assist',
    loadComponent: () =>
      import('./pages/problem-assist-page/problem-assist-page').then((m) => m.ProblemAssistPage),
  },
];
