import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';

import { ApiError } from '../../core/errors/api-error';
import { SnackbarService } from '../../core/notifications/snackbar.service';
import { ArchiveConfirmationService } from '../../shared/components/confirm-dialog/confirm-dialog';
import { BedsApiService } from '../beds/beds-api.service';
import { BedDetail } from '../beds/beds.models';
import { BedDetailPage } from '../beds/pages/bed-detail-page/bed-detail-page';
import { PlantsApiService } from '../plants/plants-api.service';
import { PersistentBedPlantForm } from './components/persistent-bed-plant-form/persistent-bed-plant-form';
import { YearlyBedPlantingForm } from './components/yearly-bed-planting-form/yearly-bed-planting-form';
import { PersistentBedPlantsApiService } from './persistent-bed-plants-api.service';
import {
  EDITABLE_PERSISTENT_BED_PLANT_STATUSES,
  EDITABLE_YEARLY_BED_PLANTING_STATUSES,
  PersistentBedPlantListItem,
  YearlyBedPlantingListItem,
} from './plantings.models';
import { YearlyBedPlantingsApiService } from './yearly-bed-plantings-api.service';

describe('bed planting flows', () => {
  const bed: BedDetail = {
    id: 'bed-1',
    placeId: 'place-1',
    name: 'Bed A',
    description: null,
    notes: null,
    widthM: null,
    lengthM: null,
    areaM2: null,
    status: 'active',
    currentContents: { persistentPlants: [], yearlyPlantings: [] },
    persistentPlants: [],
    yearlyPlantings: [],
    recentActivities: [],
    openProblems: [],
    createdAt: '2026-05-23T00:00:00.000Z',
    updatedAt: '2026-05-23T00:00:00.000Z',
    archivedAt: null,
  };
  const persistentPlant: PersistentBedPlantListItem = {
    id: 'persistent-1',
    bedId: 'bed-1',
    plantId: 'plant-1',
    plantName: 'Strawberry',
    plantedYear: 2024,
    quantity: 10,
    notes: null,
    status: 'active',
  };
  const yearlyPlanting: YearlyBedPlantingListItem = {
    id: 'planting-1',
    bedId: 'bed-1',
    plantId: 'plant-2',
    plantName: 'Tomato',
    year: 2026,
    quantity: 12,
    notes: null,
    status: 'planted',
  };
  const bedsApi = {
    get: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
  };
  const persistentPlantsApi = {
    listByBed: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
  };
  const yearlyPlantingsApi = {
    listByBed: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
  };
  const plantsApi = {
    list: vi.fn(),
  };
  const archiveConfirmation = {
    confirmArchive: vi.fn(),
  };
  const snackbar = {
    showMessage: vi.fn(),
    showError: vi.fn(),
  };
  const router = {
    navigate: vi.fn(),
  };

  beforeEach(() => {
    bedsApi.get.mockReturnValue(of(bed));
    bedsApi.update.mockReturnValue(of({ id: 'bed-1' }));
    bedsApi.archive.mockReturnValue(of({ archived: true }));
    persistentPlantsApi.listByBed.mockReturnValue(
      of({ items: [persistentPlant], page: 1, pageSize: 100, total: 1 }),
    );
    persistentPlantsApi.create.mockReturnValue(of({ id: 'persistent-2' }));
    persistentPlantsApi.update.mockReturnValue(of({ id: 'persistent-1' }));
    persistentPlantsApi.archive.mockReturnValue(of({ archived: true }));
    yearlyPlantingsApi.listByBed.mockReturnValue(
      of({ items: [yearlyPlanting], page: 1, pageSize: 100, total: 1 }),
    );
    yearlyPlantingsApi.create.mockReturnValue(of({ id: 'planting-2' }));
    yearlyPlantingsApi.update.mockReturnValue(of({ id: 'planting-1' }));
    yearlyPlantingsApi.archive.mockReturnValue(of({ archived: true }));
    plantsApi.list.mockReturnValue(of({ items: [], page: 1, pageSize: 20, total: 0 }));
    archiveConfirmation.confirmArchive.mockReturnValue(of(true));

    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ bedId: 'bed-1' })),
            queryParamMap: of(convertToParamMap({ year: '2026' })),
          },
        },
        { provide: BedsApiService, useValue: bedsApi },
        { provide: PersistentBedPlantsApiService, useValue: persistentPlantsApi },
        { provide: YearlyBedPlantingsApiService, useValue: yearlyPlantingsApi },
        { provide: PlantsApiService, useValue: plantsApi },
        { provide: ArchiveConfirmationService, useValue: archiveConfirmation },
        { provide: SnackbarService, useValue: snackbar },
        { provide: Router, useValue: router },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('persistent bed plant form requires plant selection and does not auto-remove on year edits', () => {
    const fixture = TestBed.createComponent(PersistentBedPlantForm);
    const submitted = vi.fn();

    fixture.componentInstance.submitted.subscribe(submitted);
    fixture.componentInstance.form.patchValue({ plantedYear: 2025 });
    fixture.componentInstance.submit();

    expect(submitted).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.plantId.hasError('required')).toBe(true);

    fixture.componentInstance.form.patchValue({ plantId: 'plant-1', plantedYear: 2026 });
    fixture.componentInstance.submit();

    expect(submitted).toHaveBeenCalledWith(
      expect.objectContaining({ plantId: 'plant-1', plantedYear: 2026, status: 'active' }),
    );
  });

  it('yearly planting form requires year and plant and rejects negative quantity', () => {
    const fixture = TestBed.createComponent(YearlyBedPlantingForm);
    const submitted = vi.fn();

    fixture.componentInstance.submitted.subscribe(submitted);
    fixture.componentInstance.form.patchValue({ year: null, quantity: -1 });
    fixture.componentInstance.submit();

    expect(submitted).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.plantId.hasError('required')).toBe(true);
    expect(fixture.componentInstance.form.controls.year.hasError('required')).toBe(true);
    expect(fixture.componentInstance.form.controls.quantity.hasError('nonNegative')).toBe(true);
  });

  it('status controls expose only editable canonical values', () => {
    expect(EDITABLE_PERSISTENT_BED_PLANT_STATUSES).toEqual(['active', 'removed']);
    expect(EDITABLE_YEARLY_BED_PLANTING_STATUSES).toEqual([
      'planned',
      'planted',
      'removed',
      'harvested',
    ]);
  });

  it('renders backend validation errors on planting forms', () => {
    const fixture = TestBed.createComponent(YearlyBedPlantingForm);

    fixture.componentRef.setInput(
      'apiError',
      new ApiError('VALIDATION_ERROR', 'Invalid input', {
        details: { quantity: 'Quantity cannot exceed bed capacity.' },
      }),
    );
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Invalid input');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'quantity: Quantity cannot exceed bed capacity.',
    );
  });

  it('allows duplicate same bed plant year yearly submissions', () => {
    const fixture = TestBed.createComponent(BedDetailPage);

    fixture.detectChanges();
    fixture.componentInstance.saveYearlyPlanting({
      plantId: 'plant-2',
      year: 2026,
      quantity: 12,
      notes: null,
      status: 'planted',
    });
    fixture.componentInstance.saveYearlyPlanting({
      plantId: 'plant-2',
      year: 2026,
      quantity: 12,
      notes: null,
      status: 'planted',
    });

    expect(yearlyPlantingsApi.create).toHaveBeenCalledTimes(2);
  });

  it('does not send trusted scope fields in planting mutation bodies', () => {
    const forbiddenCamelKey = ['account', 'Id'].join('');
    const forbiddenSnakeKey = ['account', '_id'].join('');
    const fixture = TestBed.createComponent(BedDetailPage);

    fixture.detectChanges();
    fixture.componentInstance.savePersistentPlant({
      plantId: 'plant-1',
      plantedYear: 2026,
      quantity: 4,
      notes: null,
      status: 'active',
    });
    fixture.componentInstance.saveYearlyPlanting({
      plantId: 'plant-2',
      year: 2026,
      quantity: 12,
      notes: null,
      status: 'planted',
    });

    expect(persistentPlantsApi.create).toHaveBeenCalledWith('bed-1', {
      plantId: 'plant-1',
      plantedYear: 2026,
      quantity: 4,
      notes: null,
    });
    expect(yearlyPlantingsApi.create).toHaveBeenCalledWith('bed-1', {
      plantId: 'plant-2',
      year: 2026,
      quantity: 12,
      notes: null,
      status: 'planted',
    });
    expect(persistentPlantsApi.create.mock.calls[0][1]).not.toHaveProperty(forbiddenCamelKey);
    expect(persistentPlantsApi.create.mock.calls[0][1]).not.toHaveProperty(forbiddenSnakeKey);
    expect(yearlyPlantingsApi.create.mock.calls[0][1]).not.toHaveProperty(forbiddenCamelKey);
    expect(yearlyPlantingsApi.create.mock.calls[0][1]).not.toHaveProperty(forbiddenSnakeKey);
  });

  it('loads persistent rows separately from selected-year yearly rows', () => {
    const fixture = TestBed.createComponent(BedDetailPage);

    fixture.detectChanges();

    expect(persistentPlantsApi.listByBed).toHaveBeenCalledWith('bed-1', {
      page: 1,
      pageSize: 100,
    });
    expect(yearlyPlantingsApi.listByBed).toHaveBeenCalledWith('bed-1', {
      year: 2026,
      page: 1,
      pageSize: 100,
    });
    expect(fixture.componentInstance.persistentPlants()).toEqual([persistentPlant]);
    expect(fixture.componentInstance.yearlyPlantings()).toEqual([yearlyPlanting]);
  });

  it('uses canonical archive endpoints after confirmation', () => {
    const fixture = TestBed.createComponent(BedDetailPage);

    fixture.detectChanges();
    fixture.componentInstance.archivePersistentPlant(persistentPlant);
    fixture.componentInstance.archiveYearlyPlanting(yearlyPlanting);

    expect(persistentPlantsApi.archive).toHaveBeenCalledWith('persistent-1');
    expect(yearlyPlantingsApi.archive).toHaveBeenCalledWith('planting-1');
  });

  it('does not archive planting rows when confirmation is declined', () => {
    archiveConfirmation.confirmArchive.mockReturnValue(of(false));
    const fixture = TestBed.createComponent(BedDetailPage);

    fixture.detectChanges();
    fixture.componentInstance.archivePersistentPlant(persistentPlant);
    fixture.componentInstance.archiveYearlyPlanting(yearlyPlanting);

    expect(persistentPlantsApi.archive).not.toHaveBeenCalled();
    expect(yearlyPlantingsApi.archive).not.toHaveBeenCalled();
  });
});
