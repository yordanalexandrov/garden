import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';

import { SnackbarService } from '../../core/notifications/snackbar.service';
import { ArchiveConfirmationService } from '../../shared/components/confirm-dialog/confirm-dialog';
import { PersistentBedPlantsApiService } from '../plantings/persistent-bed-plants-api.service';
import { YearlyBedPlantingsApiService } from '../plantings/yearly-bed-plantings-api.service';
import { BedForm } from './components/bed-form/bed-form';
import { BedCurrentContentsComponent } from './components/bed-current-contents/bed-current-contents';
import { BedDetailPage } from './pages/bed-detail-page/bed-detail-page';
import { PlaceBedsPage } from './pages/place-beds-page/place-beds-page';
import { BedDetail, BedListItem } from './beds.models';
import { BedsApiService } from './beds-api.service';

describe('beds Phase 7 pages', () => {
  const bedListItem: BedListItem = {
    id: 'bed-1',
    placeId: 'place-1',
    name: 'Bed A',
    description: 'North bed',
    widthM: 1.2,
    lengthM: 4,
    areaM2: 4.8,
    status: 'active',
    currentContents: {
      persistentPlants: [{ id: 'persistent-1', plantName: 'Strawberry', quantity: 10 }],
      yearlyPlantings: [
        { id: 'planting-1', plantName: 'Tomato', year: 2026, quantity: 12, status: 'planted' },
      ],
    },
  };
  const bedDetail: BedDetail = {
    ...bedListItem,
    notes: 'Mulched',
    persistentPlants: bedListItem.currentContents.persistentPlants,
    yearlyPlantings: bedListItem.currentContents.yearlyPlantings,
    recentActivities: [],
    openProblems: [],
    createdAt: '2026-05-23T00:00:00.000Z',
    updatedAt: '2026-05-23T00:00:00.000Z',
    archivedAt: null,
  };
  const bedsApi = {
    listByPlace: vi.fn(),
    create: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
  };
  const archiveConfirmation = {
    confirmArchive: vi.fn(),
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
  const snackbar = {
    showMessage: vi.fn(),
    showError: vi.fn(),
  };
  const router = {
    navigate: vi.fn(),
  };

  beforeEach(() => {
    bedsApi.listByPlace.mockReturnValue(of({ items: [bedListItem], page: 1, pageSize: 20, total: 1 }));
    bedsApi.create.mockReturnValue(of({ id: 'bed-2' }));
    bedsApi.get.mockReturnValue(of(bedDetail));
    bedsApi.update.mockReturnValue(of({ id: 'bed-1' }));
    bedsApi.archive.mockReturnValue(of({ archived: true }));
    persistentPlantsApi.listByBed.mockReturnValue(
      of({ items: [], page: 1, pageSize: 100, total: 0 }),
    );
    yearlyPlantingsApi.listByBed.mockReturnValue(
      of({ items: [], page: 1, pageSize: 100, total: 0 }),
    );
    persistentPlantsApi.create.mockReturnValue(of({ id: 'persistent-2' }));
    persistentPlantsApi.update.mockReturnValue(of({ id: 'persistent-1' }));
    persistentPlantsApi.archive.mockReturnValue(of({ archived: true }));
    yearlyPlantingsApi.create.mockReturnValue(of({ id: 'planting-2' }));
    yearlyPlantingsApi.update.mockReturnValue(of({ id: 'planting-1' }));
    yearlyPlantingsApi.archive.mockReturnValue(of({ archived: true }));
    archiveConfirmation.confirmArchive.mockReturnValue(of(false));

    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        {
          provide: ActivatedRoute,
          useValue: {
            parent: { paramMap: of(convertToParamMap({ placeId: 'place-1' })) },
            paramMap: of(convertToParamMap({ bedId: 'bed-1' })),
            queryParamMap: of(convertToParamMap({ year: '2026' })),
          },
        },
        { provide: BedsApiService, useValue: bedsApi },
        { provide: PersistentBedPlantsApiService, useValue: persistentPlantsApi },
        { provide: YearlyBedPlantingsApiService, useValue: yearlyPlantingsApi },
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

  it('loads place beds with the selected year query', () => {
    const fixture = TestBed.createComponent(PlaceBedsPage);

    fixture.componentInstance.selectedYear.set(2026);
    fixture.componentInstance.loadBeds();
    fixture.detectChanges();

    expect(bedsApi.listByPlace).toHaveBeenLastCalledWith('place-1', {
      q: undefined,
      year: 2026,
      page: 1,
      pageSize: 20,
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Bed A');
  });

  it('loads bed detail with selected year and renders contents separately', () => {
    const fixture = TestBed.createComponent(BedDetailPage);

    fixture.detectChanges();

    expect(bedsApi.get).toHaveBeenCalledTimes(1);
    expect(bedsApi.get).toHaveBeenCalledWith('bed-1', 2026);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Persistent plants');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Yearly plantings');
  });

  it('validates required name and positive dimensions before submit', () => {
    const fixture = TestBed.createComponent(BedForm);
    const submitted = vi.fn();

    fixture.componentInstance.submitted.subscribe(submitted);
    fixture.componentInstance.form.patchValue({ widthM: 0, lengthM: -1 });
    fixture.componentInstance.submit();

    expect(submitted).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.name.hasError('required')).toBe(true);
    expect(fixture.componentInstance.form.controls.widthM.hasError('positiveNumber')).toBe(true);
    expect(fixture.componentInstance.form.controls.lengthM.hasError('positiveNumber')).toBe(true);
  });

  it('auto-calculates bed area from width and length', () => {
    const fixture = TestBed.createComponent(BedForm);
    const form = fixture.componentInstance.form;

    form.controls.widthM.setValue(2);
    form.controls.lengthM.setValue(3);

    expect(form.controls.areaM2.value).toBe(6);
    expect(fixture.componentInstance.areaOverridden()).toBe(false);
  });

  it('keeps a manual bed area when width or length changes', () => {
    const fixture = TestBed.createComponent(BedForm);
    const form = fixture.componentInstance.form;

    form.controls.widthM.setValue(2);
    form.controls.lengthM.setValue(3);
    form.controls.areaM2.setValue(10);
    expect(fixture.componentInstance.areaOverridden()).toBe(true);

    form.controls.widthM.setValue(5);

    expect(form.controls.areaM2.value).toBe(10);
  });

  it('resumes auto area calculation when the manual value is cleared', () => {
    const fixture = TestBed.createComponent(BedForm);
    const form = fixture.componentInstance.form;

    form.controls.widthM.setValue(2);
    form.controls.lengthM.setValue(3);
    form.controls.areaM2.setValue(10);
    expect(fixture.componentInstance.areaOverridden()).toBe(true);

    form.controls.areaM2.setValue(null);

    expect(fixture.componentInstance.areaOverridden()).toBe(false);
    expect(form.controls.areaM2.value).toBe(6);
  });

  it('recalculates the area on demand after a manual override', () => {
    const fixture = TestBed.createComponent(BedForm);
    const form = fixture.componentInstance.form;

    form.controls.widthM.setValue(2);
    form.controls.lengthM.setValue(4);
    form.controls.areaM2.setValue(99);
    expect(fixture.componentInstance.areaOverridden()).toBe(true);

    fixture.componentInstance.resetAreaToAuto();

    expect(fixture.componentInstance.areaOverridden()).toBe(false);
    expect(form.controls.areaM2.value).toBe(8);
  });

  it('treats a stored area that differs from width × length as overridden', () => {
    const fixture = TestBed.createComponent(BedForm);

    fixture.componentRef.setInput('bed', { ...bedListItem, widthM: 2, lengthM: 3, areaM2: 10 });
    fixture.detectChanges();

    expect(fixture.componentInstance.areaOverridden()).toBe(true);
  });

  it('changes year view without calling mutation endpoints', () => {
    const fixture = TestBed.createComponent(PlaceBedsPage);

    fixture.componentInstance.selectYear(2027);

    expect(fixture.componentInstance.selectedYear()).toBe(2027);
    expect(bedsApi.listByPlace).toHaveBeenLastCalledWith(
      'place-1',
      expect.objectContaining({ year: 2027 }),
    );
    expect(bedsApi.create).not.toHaveBeenCalled();
    expect(bedsApi.update).not.toHaveBeenCalled();
    expect(bedsApi.archive).not.toHaveBeenCalled();
  });

  it('does not send trusted scope fields in create requests', () => {
    const forbiddenKey = ['account', 'Id'].join('');
    const fixture = TestBed.createComponent(PlaceBedsPage);

    fixture.componentInstance.saveBed({ name: 'Bed B', widthM: 1, lengthM: 2 });

    expect(bedsApi.create).toHaveBeenCalledWith('place-1', {
      name: 'Bed B',
      description: undefined,
      notes: undefined,
      widthM: 1,
      lengthM: 2,
      areaM2: undefined,
    });
    expect(bedsApi.create.mock.calls[0][1]).not.toHaveProperty(forbiddenKey);
  });

  it('loads full bed detail before opening the edit form from the place beds list', () => {
    const fixture = TestBed.createComponent(PlaceBedsPage);

    fixture.componentInstance.selectedYear.set(2026);
    fixture.componentInstance.openEditForm(bedListItem);

    expect(bedsApi.get).toHaveBeenCalledWith('bed-1', 2026);
    expect(fixture.componentInstance.editingBed()).toEqual(bedDetail);
    expect(fixture.componentInstance.formOpen()).toBe(true);
  });

  it('requires confirmation before archive calls', () => {
    const fixture = TestBed.createComponent(PlaceBedsPage);

    fixture.componentInstance.archiveBed(bedListItem);

    expect(archiveConfirmation.confirmArchive).toHaveBeenCalledWith('Bed A');
    expect(bedsApi.archive).not.toHaveBeenCalled();

    archiveConfirmation.confirmArchive.mockReturnValue(of(true));
    fixture.componentInstance.archiveBed(bedListItem);

    expect(bedsApi.archive).toHaveBeenCalledWith('bed-1');
  });

  it('bed current contents renders persistent and yearly summaries separately', () => {
    const fixture = TestBed.createComponent(BedCurrentContentsComponent);

    fixture.componentRef.setInput('persistentPlants', bedDetail.persistentPlants);
    fixture.componentRef.setInput('yearlyPlantings', bedDetail.yearlyPlantings);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Strawberry');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Tomato');
  });
});
