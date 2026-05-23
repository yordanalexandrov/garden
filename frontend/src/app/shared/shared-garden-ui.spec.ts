import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject } from 'rxjs';

import { ApiError } from '../core/errors/api-error';
import { PlantsApiService } from '../features/plants/plants-api.service';
import { PlantListItem } from '../features/plants/plants.models';
import { ArchiveConfirmationService } from './components/confirm-dialog/confirm-dialog';
import { YearSelector } from './components/year-selector/year-selector';
import { applyApiErrorToForm } from './forms/api-error-summary/api-error-form';
import { ApiErrorSummary } from './forms/api-error-summary/api-error-summary';
import { yearlyBedPlantingStatusOptions } from './forms/status-control/status-options';
import { PlantSelector } from './selectors/plant-selector/plant-selector';

describe('shared garden UI components and helpers', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('requires explicit confirmation before an archive action proceeds', async () => {
    const dialog = {
      open: vi.fn().mockReturnValue({ afterClosed: () => of(undefined) }),
    };

    TestBed.configureTestingModule({
      providers: [
        ArchiveConfirmationService,
        { provide: MatDialog, useValue: dialog },
      ],
    });

    const service = TestBed.inject(ArchiveConfirmationService);
    const result = await new Promise<boolean>((resolve) => {
      service.confirmArchive('place').subscribe(resolve);
    });

    expect(result).toBe(false);

    dialog.open.mockReturnValue({ afterClosed: () => of(true) });

    const confirmed = await new Promise<boolean>((resolve) => {
      service.confirmArchive('place').subscribe(resolve);
    });

    expect(confirmed).toBe(true);
  });

  it('renders form-level backend API error messages', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [ApiErrorSummary],
    }).createComponent(ApiErrorSummary);

    fixture.componentRef.setInput(
      'error',
      new ApiError('BUSINESS_RULE_VIOLATION', 'Cannot archive active bed.'),
    );
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Cannot archive active bed.',
    );
  });

  it('maps backend field details to matching form controls', () => {
    const form = new FormGroup({
      name: new FormControl(''),
    });

    applyApiErrorToForm(
      form,
      new ApiError('VALIDATION_ERROR', 'Invalid input', {
        details: { name: ['Name is required.'] },
      }),
    );

    expect(form.controls.name.errors).toEqual({ api: 'Name is required.' });
    expect(form.controls.name.touched).toBe(true);
  });

  it('clears stale backend field errors while preserving local validation errors', () => {
    const form = new FormGroup({
      name: new FormControl('', { validators: [Validators.required] }),
    });

    applyApiErrorToForm(
      form,
      new ApiError('VALIDATION_ERROR', 'Invalid input', {
        details: { name: 'Name is already used.' },
      }),
    );
    applyApiErrorToForm(form, null);

    expect(form.controls.name.hasError('api')).toBe(false);
    expect(form.controls.name.hasError('required')).toBe(true);
  });

  it('emits calendar year changes without mutating planting data', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [YearSelector],
    }).createComponent(YearSelector);
    const emittedYears: number[] = [];

    fixture.componentRef.setInput('year', 2026);
    fixture.componentInstance.yearChange.subscribe((year) => emittedYears.push(year));
    fixture.detectChanges();

    fixture.componentInstance.previousYear();
    fixture.componentInstance.nextYear();

    expect(emittedYears).toEqual([2025, 2027]);
  });

  it('exposes canonical yearly status helpers including archived for display', () => {
    expect(yearlyBedPlantingStatusOptions.map((option) => option.value)).toEqual([
      'planned',
      'planted',
      'removed',
      'harvested',
      'archived',
    ]);
    expect(yearlyBedPlantingStatusOptions.at(-1)?.archived).toBe(true);
  });

  it('searches plants through the typed Plants API service and emits selected ids', () => {
    const tomato: PlantListItem = {
      id: 'plant-1',
      commonName: 'Tomato',
      variety: 'Roma',
      plantCategory: 'vegetable',
      lifecycleType: 'annual',
      growingStyle: 'vegetable',
      notes: null,
      archivedAt: null,
    };
    const plantsApi = {
      list: vi.fn().mockReturnValue(of({ items: [tomato], page: 1, pageSize: 20, total: 1 })),
    };
    const fixture = TestBed.configureTestingModule({
      imports: [PlantSelector],
      providers: [provideNoopAnimations(), { provide: PlantsApiService, useValue: plantsApi }],
    }).createComponent(PlantSelector);
    const emittedPlantIds: (string | null)[] = [];

    fixture.componentInstance.selectedPlantIdChange.subscribe((plantId) =>
      emittedPlantIds.push(plantId),
    );
    fixture.componentInstance.searchText.set('tom');
    fixture.componentInstance.search();
    fixture.detectChanges();
    fixture.componentInstance.selectPlant({ value: 'plant-1' } as never);

    expect(plantsApi.list).toHaveBeenCalledWith({ q: 'tom', page: 1, pageSize: 20 });
    expect(fixture.componentInstance.plants()).toEqual([tomato]);
    expect(fixture.componentInstance.displayPlant(tomato)).toBe('Tomato (Roma)');
    expect(emittedPlantIds).toEqual(['plant-1']);
  });

  it('keeps plant selector results aligned with the latest search request', () => {
    const tomato: PlantListItem = {
      id: 'plant-1',
      commonName: 'Tomato',
      variety: null,
      plantCategory: 'vegetable',
      lifecycleType: 'annual',
      growingStyle: 'vegetable',
      notes: null,
      archivedAt: null,
    };
    const basil: PlantListItem = {
      id: 'plant-2',
      commonName: 'Basil',
      variety: null,
      plantCategory: 'herb',
      lifecycleType: 'annual',
      growingStyle: 'herb',
      notes: null,
      archivedAt: null,
    };
    const firstSearch = new Subject<{
      items: readonly PlantListItem[];
      page: number;
      pageSize: number;
      total: number;
    }>();
    const secondSearch = new Subject<{
      items: readonly PlantListItem[];
      page: number;
      pageSize: number;
      total: number;
    }>();
    const plantsApi = {
      list: vi
        .fn()
        .mockReturnValueOnce(firstSearch.asObservable())
        .mockReturnValueOnce(secondSearch.asObservable()),
    };
    const fixture = TestBed.configureTestingModule({
      imports: [PlantSelector],
      providers: [provideNoopAnimations(), { provide: PlantsApiService, useValue: plantsApi }],
    }).createComponent(PlantSelector);

    fixture.componentInstance.searchText.set('tom');
    fixture.componentInstance.search();
    fixture.componentInstance.searchText.set('bas');
    fixture.componentInstance.search();

    secondSearch.next({ items: [basil], page: 1, pageSize: 20, total: 1 });
    firstSearch.next({ items: [tomato], page: 1, pageSize: 20, total: 1 });

    expect(plantsApi.list).toHaveBeenNthCalledWith(1, { q: 'tom', page: 1, pageSize: 20 });
    expect(plantsApi.list).toHaveBeenNthCalledWith(2, { q: 'bas', page: 1, pageSize: 20 });
    expect(fixture.componentInstance.plants()).toEqual([basil]);
    expect(fixture.componentInstance.loading()).toBe(false);
  });
});
