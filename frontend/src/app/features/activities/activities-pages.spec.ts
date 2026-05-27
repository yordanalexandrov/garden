import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApiError } from '../../core/errors/api-error';
import { PlacesApiService } from '../places/places-api.service';
import { ActivitiesApiService } from './activities-api.service';
import { ActivityCreatePage } from './pages/activity-create-page/activity-create-page';
import { ActivityDetailPage } from './pages/activity-detail-page/activity-detail-page';
import { ActivitiesListPage } from './pages/activities-list-page/activities-list-page';
import { BedsApiService } from '../beds/beds-api.service';
import { PerennialsApiService } from '../perennials/perennials-api.service';
import { PersistentBedPlantsApiService } from '../plantings/persistent-bed-plants-api.service';
import { YearlyBedPlantingsApiService } from '../plantings/yearly-bed-plantings-api.service';
import { ProductRulesApiService, ProductsApiService } from '../products/products-api.service';

describe('Phase 14 activity pages', () => {
  const activity = {
    id: 'activity-1',
    placeId: 'place-1',
    type: 'treatment',
    performedAt: '2026-05-26T08:00:00.000Z',
    targetScopeType: 'selected_beds',
    targets: [{ targetType: 'bed', targetId: 'bed-1', label: 'Bed A', placeId: 'place-1' }],
    productUsages: [],
    inventoryMovements: [],
    quarantinePeriods: [],
    suggestedTasks: [{ id: 'task-1', type: 'spraying', dueDate: '2026-06-01', status: 'suggested' }],
    notes: 'Spray',
  };
  const activitiesApi = {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
  };
  const placesApi = {
    list: vi.fn(),
  };
  const productsApi = {
    list: vi.fn(),
  };
  const rulesApi = {
    listByProduct: vi.fn(),
  };
  const bedsApi = {
    listByPlace: vi.fn(),
  };
  const perennialsApi = {
    listByPlace: vi.fn(),
  };
  const yearlyPlantingsApi = {
    listByBed: vi.fn(),
  };
  const persistentPlantsApi = {
    listByBed: vi.fn(),
  };

  beforeEach(() => {
    activitiesApi.list.mockReturnValue(
      of({
        items: [
          {
            id: 'activity-1',
            placeId: 'place-1',
            placeName: 'Home',
            type: 'treatment',
            performedAt: '2026-05-26T08:00:00.000Z',
            targetSummary: '1 bed',
            productSummary: 'Copper',
            sideEffects: {
              inventoryMovementsCount: 1,
              quarantinePeriodsCount: 1,
              suggestedTasksCount: 1,
              warnings: ['Check weather'],
            },
          },
        ],
        page: 1,
        pageSize: 20,
        total: 1,
      }),
    );
    activitiesApi.get.mockReturnValue(of(activity));
    activitiesApi.create.mockReturnValue(
      of({
        activity,
        inventoryEffects: [{ movementId: 'move-1', productId: 'product-1', inventoryLotId: null, quantity: 30, unit: 'ml' }],
        quarantinePeriods: [{ id: 'period-1', productId: 'product-1', startsOn: '2026-05-26', endsOn: '2026-06-09' }],
        suggestedTasks: activity.suggestedTasks,
        warnings: ['Backend warning'],
      }),
    );
    placesApi.list.mockReturnValue(of({ items: [{ id: 'place-1', name: 'Home' }], page: 1, pageSize: 20, total: 1 }));
    productsApi.list.mockReturnValue(of({ items: [], page: 1, pageSize: 20, total: 0 }));
    rulesApi.listByProduct.mockReturnValue(of({ items: [] }));
    bedsApi.listByPlace.mockReturnValue(of({ items: [{ id: 'bed-1', name: 'Bed A' }], page: 1, pageSize: 20, total: 1 }));
    perennialsApi.listByPlace.mockReturnValue(of({ items: [], page: 1, pageSize: 20, total: 0 }));
    yearlyPlantingsApi.listByBed.mockReturnValue(of({ items: [], page: 1, pageSize: 20, total: 0 }));
    persistentPlantsApi.listByBed.mockReturnValue(of({ items: [], page: 1, pageSize: 20, total: 0 }));

    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ activityId: 'activity-1' }) } } },
        { provide: ActivitiesApiService, useValue: activitiesApi },
        { provide: PlacesApiService, useValue: placesApi },
        { provide: ProductsApiService, useValue: productsApi },
        { provide: ProductRulesApiService, useValue: rulesApi },
        { provide: BedsApiService, useValue: bedsApi },
        { provide: PerennialsApiService, useValue: perennialsApi },
        { provide: YearlyBedPlantingsApiService, useValue: yearlyPlantingsApi },
        { provide: PersistentBedPlantsApiService, useValue: persistentPlantsApi },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('filters activity list and renders backend summaries', () => {
    const fixture = TestBed.createComponent(ActivitiesListPage);

    fixture.componentInstance.filters.patchValue({ placeId: 'place-1', type: 'treatment' });
    fixture.componentInstance.search();
    fixture.detectChanges();

    expect(activitiesApi.list).toHaveBeenLastCalledWith({
      placeId: 'place-1',
      type: 'treatment',
      from: undefined,
      to: undefined,
      page: 1,
      pageSize: 20,
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Copper');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Check weather');
  });

  it('renders detail side effects and suggested task distinction', () => {
    const fixture = TestBed.createComponent(ActivityDetailPage);

    fixture.detectChanges();

    expect(activitiesApi.get).toHaveBeenCalledWith('activity-1');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Suggested: spraying');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Bed A');
  });

  it('builds canonical create request and displays backend errors without clearing input', () => {
    activitiesApi.create.mockReturnValueOnce(throwError(() => new ApiError('INVENTORY_SHORTAGE', 'Not enough stock')));
    const fixture = TestBed.createComponent(ActivityCreatePage);
    const component = fixture.componentInstance;

    component.form.patchValue({ placeId: 'place-1', type: 'treatment', notes: 'Keep this' });
    component.updateTargetIntent({
      targetScopeType: 'selected_beds',
      targetSelection: { bedIds: ['bed-1'] },
      selectedLabels: ['Bed A'],
    });
    component.updateProductUsages([{ productId: 'product-1', quantityUsed: 30, unit: 'ml', productUsageRuleId: null }]);
    component.submit();

    expect(activitiesApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        placeId: 'place-1',
        type: 'treatment',
        targetScopeType: 'selected_beds',
        targetSelection: { bedIds: ['bed-1'] },
        productUsages: [{ productId: 'product-1', quantityUsed: 30, unit: 'ml', productUsageRuleId: null }],
        allowInventoryShortage: false,
      }),
    );
    expect(component.form.controls.notes.value).toBe('Keep this');
    expect(component.shortageOverrideVisible()).toBe(true);
  });

  it('displays backend returned side effect arrays after success', () => {
    const fixture = TestBed.createComponent(ActivityCreatePage);
    const component = fixture.componentInstance;

    component.form.patchValue({ placeId: 'place-1', type: 'treatment' });
    component.updateTargetIntent({
      targetScopeType: 'selected_beds',
      targetSelection: { bedIds: ['bed-1'] },
      selectedLabels: ['Bed A'],
    });
    component.submit();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Backend warning');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Suggested: spraying');
  });
});
