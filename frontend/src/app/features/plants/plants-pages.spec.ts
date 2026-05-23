import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ApiError } from '../../core/errors/api-error';
import { SnackbarService } from '../../core/notifications/snackbar.service';
import { ArchiveConfirmationService } from '../../shared/components/confirm-dialog/confirm-dialog';
import { PlantForm } from './components/plant-form/plant-form';
import { PlantDetailPage } from './pages/plant-detail-page/plant-detail-page';
import { PlantsListPage } from './pages/plants-list-page/plants-list-page';
import { PLANT_GROWING_STYLES, PLANT_LIFECYCLE_TYPES, PlantDetail } from './plants.models';
import { PlantsApiService } from './plants-api.service';

describe('plants Phase 7 pages', () => {
  const plant: PlantDetail = {
    id: 'plant-1',
    commonName: 'Tomato',
    variety: 'Roma',
    plantCategory: 'vegetable',
    lifecycleType: 'annual',
    growingStyle: 'vegetable',
    notes: null,
    createdAt: '2026-05-23T00:00:00.000Z',
    updatedAt: '2026-05-23T00:00:00.000Z',
    archivedAt: null,
  };
  const plantsApi = {
    list: vi.fn(),
    create: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
  };
  const archiveConfirmation = {
    confirmArchive: vi.fn(),
  };
  const snackbar = {
    showMessage: vi.fn(),
    showError: vi.fn(),
  };

  beforeEach(() => {
    plantsApi.list.mockReturnValue(of({ items: [plant], page: 1, pageSize: 20, total: 1 }));
    plantsApi.create.mockReturnValue(of({ id: 'plant-2' }));
    plantsApi.get.mockReturnValue(of(plant));
    plantsApi.update.mockReturnValue(of({ id: 'plant-1' }));
    plantsApi.archive.mockReturnValue(of({ archived: true }));
    archiveConfirmation.confirmArchive.mockReturnValue(of(false));

    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideRouter([{ path: 'plants/:plantId', component: PlantDetailPage }]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ plantId: 'plant-1' })) } },
        { provide: PlantsApiService, useValue: plantsApi },
        { provide: ArchiveConfirmationService, useValue: archiveConfirmation },
        { provide: SnackbarService, useValue: snackbar },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('searches through the typed Plants API service with explicit archived behavior', () => {
    const fixture = TestBed.createComponent(PlantsListPage);

    fixture.componentInstance.filters.patchValue({
      q: 'tomato',
      lifecycleType: 'annual',
      growingStyle: 'vegetable',
      includeArchived: true,
    });
    fixture.componentInstance.search();
    fixture.detectChanges();

    expect(plantsApi.list).toHaveBeenLastCalledWith({
      q: 'tomato',
      lifecycleType: 'annual',
      growingStyle: 'vegetable',
      includeArchived: true,
      page: 1,
      pageSize: 20,
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Tomato (Roma)');
  });

  it('rejects missing common names before submit', () => {
    const fixture = TestBed.createComponent(PlantForm);
    const submitted = vi.fn();

    fixture.componentInstance.submitted.subscribe(submitted);
    fixture.componentInstance.submit();

    expect(submitted).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.commonName.hasError('required')).toBe(true);
  });

  it('limits lifecycle and growing style options to canonical values', () => {
    const fixture = TestBed.createComponent(PlantForm);

    expect(fixture.componentInstance.lifecycleTypes).toEqual(PLANT_LIFECYCLE_TYPES);
    expect(fixture.componentInstance.growingStyles).toEqual(PLANT_GROWING_STYLES);
  });

  it('loads plant detail and populates the edit form', async () => {
    const fixture = TestBed.createComponent(PlantDetailPage);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(plantsApi.get).toHaveBeenCalledWith('plant-1');
    expect(fixture.componentInstance.plant()).toEqual(plant);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Tomato');
  });

  it('does not send trusted scope fields in create/update requests', () => {
    const forbiddenKey = ['account', 'Id'].join('');
    const fixture = TestBed.createComponent(PlantForm);
    const submitted = vi.fn();

    fixture.componentInstance.submitted.subscribe(submitted);
    fixture.componentInstance.form.patchValue({
      commonName: 'Pepper',
      lifecycleType: 'annual',
      growingStyle: 'vegetable',
    });
    fixture.componentInstance.submit();

    expect(submitted).toHaveBeenCalledWith(
      expect.objectContaining({ commonName: 'Pepper', lifecycleType: 'annual' }),
    );
    expect(submitted.mock.calls[0][0]).not.toHaveProperty(forbiddenKey);
  });

  it('renders backend validation errors on the plant form', () => {
    const fixture = TestBed.createComponent(PlantForm);

    fixture.detectChanges();
    fixture.componentInstance.form.controls.commonName.setValue('Tomato');
    fixture.componentRef.setInput(
      'apiError',
      new ApiError('VALIDATION_ERROR', 'Invalid input', {
        details: { commonName: ['Common name is invalid.'] },
      }),
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.commonName.errors).toEqual({
      api: 'Common name is invalid.',
    });
  });

  it('requires confirmation before archiving plants', async () => {
    const fixture = TestBed.createComponent(PlantDetailPage);

    fixture.detectChanges();
    fixture.componentInstance.archivePlant();

    expect(archiveConfirmation.confirmArchive).toHaveBeenCalledWith('Tomato');
    expect(plantsApi.archive).not.toHaveBeenCalled();

    archiveConfirmation.confirmArchive.mockReturnValue(of(true));
    fixture.componentInstance.archivePlant();

    expect(plantsApi.archive).toHaveBeenCalledWith('plant-1');
  });
});
