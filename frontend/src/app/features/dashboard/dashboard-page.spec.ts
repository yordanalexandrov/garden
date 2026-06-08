import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApiError } from '../../core/errors/api-error';
import { DashboardApiService } from './dashboard-api.service';
import { DashboardPage } from './pages/dashboard-page/dashboard-page';

const dashboardResponse = () => ({
  upcomingTasks: [
    {
      id: 'task-planned',
      type: 'spraying',
      dueDate: '2026-06-12',
      status: 'planned',
      title: 'Spray pears',
      placeId: 'place-1',
      targetSummary: 'Pear Tree 1',
    },
  ],
  suggestedTasks: [
    {
      id: 'task-suggested',
      type: 'fertilizing',
      dueDate: '2026-06-13',
      status: 'suggested',
      title: 'Review fertilizer follow-up',
      placeId: 'place-1',
      targetSummary: 'Bed A',
    },
  ],
  activeQuarantinePeriods: [
    {
      id: 'quarantine-1',
      startsOn: '2026-06-10',
      endsOn: '2026-06-20',
      title: 'Copper quarantine',
      activityId: 'activity-1',
      productId: 'product-1',
      placeId: 'place-1',
    },
  ],
  recentActivities: [
    {
      id: 'activity-1',
      type: 'treatment',
      performedAt: '2026-06-10T08:00:00.000Z',
      title: 'Copper treatment',
      placeId: 'place-1',
      targetSummary: 'Pear Tree 1',
    },
  ],
  openProblems: [
    {
      id: 'problem-1',
      type: 'problem',
      title: 'Leaf spots',
      status: 'open',
      observedAt: '2026-06-09T08:00:00.000Z',
      placeId: 'place-1',
    },
  ],
  lowStockProducts: [
    {
      productId: 'product-1',
      productName: 'Copper',
      category: 'fungicide',
      defaultUnit: 'g',
      quantityRemaining: '10',
      activeLotCount: 1,
      nextExpiryDate: null,
    },
  ],
  places: [{ id: 'place-1', name: 'Home Garden', weatherEnabled: true }],
});

describe('Phase 20 dashboard page', () => {
  const dashboardApi = { getDashboard: vi.fn() };

  beforeEach(() => {
    dashboardApi.getDashboard.mockReturnValue(of(dashboardResponse()));

    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: DashboardApiService, useValue: dashboardApi },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('renders dashboard widgets with distinct planned, suggested, and quarantine sections', () => {
    const fixture = TestBed.createComponent(DashboardPage);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.textContent ?? '';
    expect(text).toContain('Spray pears');
    expect(text).toContain('Review fertilizer follow-up');
    expect(text).toContain('Copper quarantine');
    expect(text).toContain('Leaf spots');
    expect(text).toContain('Copper');
    expect(compiled.querySelector('.dashboard-widget--planned')).toBeTruthy();
    expect(compiled.querySelector('.dashboard-widget--suggested')).toBeTruthy();
    expect(compiled.querySelector('.dashboard-widget--quarantine')).toBeTruthy();
    expect(compiled.querySelector('a[href="/tasks/task-planned"]')).toBeTruthy();
    expect(compiled.querySelector('a[href="/activities/activity-1"]')).toBeTruthy();
  });

  it('shows API errors while preserving the last loaded dashboard', () => {
    const fixture = TestBed.createComponent(DashboardPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    dashboardApi.getDashboard.mockReturnValue(throwError(() => new ApiError('VALIDATION_ERROR', 'Bad place.')));
    component.load();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(component.error()?.code).toBe('VALIDATION_ERROR');
    expect(text).toContain('Spray pears');
  });
});
