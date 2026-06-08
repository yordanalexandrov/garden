import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { ApiError } from '../../core/errors/api-error';
import { PlacesApiService } from '../places/places-api.service';
import { TasksApiService } from './tasks-api.service';
import { TaskDetailPage } from './pages/task-detail-page/task-detail-page';
import { TasksListPage } from './pages/tasks-list-page/tasks-list-page';

const taskDetail = (status: 'suggested' | 'planned' | 'done' = 'suggested') => ({
  id: 'task-1',
  placeId: 'place-1',
  type: 'spraying',
  dueDate: '2026-06-12',
  status,
  targetScopeType: 'whole_place',
  targetSummary: 'Home Garden',
  sourceType: 'activity',
  sourceReferenceId: 'activity-1',
  targets: [{ targetType: 'place', targetId: 'place-1', label: 'Home Garden', placeId: 'place-1' }],
  reminders:
    status === 'planned'
      ? [{ id: 'task-reminder-1', reminderType: 'same_day', scheduledFor: '2026-06-12T06:00:00.000Z', status: 'scheduled', sentAt: null }]
      : [],
  weatherEvents: [
    {
      id: 'weather-1',
      eventType: 'rain_check',
      forecastedRain: true,
      observedRain: null,
      userConfirmationStatus: null,
      createdAt: '2026-06-11T12:00:00.000Z',
    },
  ],
  notes: 'Review backend suggestion',
  confirmedAt: status === 'planned' ? '2026-06-10T08:00:00.000Z' : null,
  completedAt: status === 'done' ? '2026-06-12T08:00:00.000Z' : null,
});

describe('Phase 20 task pages', () => {
  const tasksApi = {
    list: vi.fn(),
    get: vi.fn(),
    confirm: vi.fn(),
    dismiss: vi.fn(),
    complete: vi.fn(),
    skip: vi.fn(),
  };
  const placesApi = { list: vi.fn() };
  const dialog = { open: vi.fn() };

  beforeEach(() => {
    tasksApi.list.mockReturnValue(
      of({
        items: [taskDetail('suggested')],
        page: 1,
        pageSize: 20,
        total: 1,
      }),
    );
    tasksApi.get.mockReturnValue(of(taskDetail('suggested')));
    tasksApi.confirm.mockReturnValue(
      of({
        id: 'task-1',
        status: 'planned',
        confirmedAt: '2026-06-10T08:00:00.000Z',
        reminders: [{ id: 'task-reminder-1', reminderType: 'same_day', scheduledFor: '2026-06-12T06:00:00.000Z', status: 'scheduled', sentAt: null }],
      }),
    );
    tasksApi.dismiss.mockReturnValue(of(taskDetail('done')));
    tasksApi.complete.mockReturnValue(of(taskDetail('done')));
    tasksApi.skip.mockReturnValue(of(taskDetail('done')));
    placesApi.list.mockReturnValue(
      of({ items: [{ id: 'place-1', name: 'Home Garden' }], page: 1, pageSize: 20, total: 1 }),
    );
    dialog.open.mockReturnValue({ afterClosed: () => of(true) });

    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ taskId: 'task-1' }) } },
        },
        { provide: TasksApiService, useValue: tasksApi },
        { provide: PlacesApiService, useValue: placesApi },
        { provide: MatDialog, useValue: dialog },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('filters task list through canonical query fields and renders suggested state distinctly', () => {
    const fixture = TestBed.createComponent(TasksListPage);
    const component = fixture.componentInstance;

    component.filters.patchValue({
      placeId: 'place-1',
      status: 'suggested',
      type: 'spraying',
      dueFrom: '2026-06-01',
      dueTo: '2026-06-30',
    });
    component.search();
    fixture.detectChanges();

    expect(tasksApi.list).toHaveBeenLastCalledWith({
      placeId: 'place-1',
      status: 'suggested',
      type: 'spraying',
      dueFrom: '2026-06-01',
      dueTo: '2026-06-30',
      page: 1,
      pageSize: 20,
    });
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Review backend suggestion');
    expect(compiled.querySelector('.task-card--suggested')).toBeTruthy();
  });

  it('shows suggested actions and advisory weather context on detail', () => {
    const fixture = TestBed.createComponent(TaskDetailPage);

    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Confirm');
    expect(text).toContain('Dismiss');
    expect(text).toContain('Weather is advisory');
    expect(text).not.toContain('DoneSkip');
  });

  it('shows planned actions and backend-provided reminder summary', () => {
    tasksApi.get.mockReturnValue(of(taskDetail('planned')));
    const fixture = TestBed.createComponent(TaskDetailPage);

    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Done');
    expect(text).toContain('Skip');
    expect(text).toContain('same day');
    expect(text).not.toContain('ConfirmDismiss');
  });

  it('keeps terminal statuses read-only', () => {
    tasksApi.get.mockReturnValue(of(taskDetail('done')));
    const fixture = TestBed.createComponent(TaskDetailPage);

    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Terminal task states are read-only.');
    expect(text).not.toContain('Confirm');
    expect(text).not.toContain('Skip');
  });

  it('displays mutation errors without changing current task state', () => {
    tasksApi.confirm.mockReturnValue(throwError(() => new ApiError('BUSINESS_RULE_VIOLATION', 'No reminders created.')));
    const fixture = TestBed.createComponent(TaskDetailPage);
    const component = fixture.componentInstance;

    fixture.detectChanges();
    component.runAction('confirm');
    fixture.detectChanges();

    expect(tasksApi.confirm).toHaveBeenCalledWith('task-1');
    expect(component.task()?.status).toBe('suggested');
    expect(component.error()?.code).toBe('BUSINESS_RULE_VIOLATION');
  });
});
