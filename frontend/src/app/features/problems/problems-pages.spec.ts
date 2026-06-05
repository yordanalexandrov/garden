import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApiError } from '../../core/errors/api-error';
import { ActivitiesApiService } from '../activities/activities-api.service';
import { BedsApiService } from '../beds/beds-api.service';
import { PerennialsApiService } from '../perennials/perennials-api.service';
import { PlacesApiService } from '../places/places-api.service';
import { PersistentBedPlantsApiService } from '../plantings/persistent-bed-plants-api.service';
import { YearlyBedPlantingsApiService } from '../plantings/yearly-bed-plantings-api.service';
import { ProblemsApiService } from './problems-api.service';
import { ProblemCreatePage } from './pages/problem-create-page/problem-create-page';
import { ProblemDetailPage } from './pages/problem-detail-page/problem-detail-page';
import { ProblemsListPage } from './pages/problems-list-page/problems-list-page';

const fileChangeEvent = (file: File): Event =>
  ({ target: { files: [file] } }) as unknown as Event;

describe('Phase 17 problem pages', () => {
  const detail = {
    id: 'problem-1',
    type: 'problem',
    placeId: 'place-1',
    targetType: 'bed',
    targetId: 'bed-1',
    targetLabel: 'Bed A',
    title: 'Leaf spots',
    description: 'Dark spots on lower leaves',
    category: 'fungus',
    severity: 'medium',
    status: 'open',
    observedAt: '2026-05-13T07:00:00.000Z',
    photos: [
      {
        id: 'photo-1',
        url: 'https://storage.example/signed/photo-1.jpg',
        mimeType: 'image/jpeg',
        originalFilename: 'leaf.jpg',
        fileSizeBytes: 1234,
      },
    ],
    linkedActivity: null,
  };
  const problemsApi = {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    uploadPhoto: vi.fn(),
  };
  const placesApi = { list: vi.fn() };
  const activitiesApi = { list: vi.fn() };
  const bedsApi = { listByPlace: vi.fn() };
  const perennialsApi = { listByPlace: vi.fn() };
  const yearlyPlantingsApi = { listByBed: vi.fn() };
  const persistentPlantsApi = { listByBed: vi.fn() };

  beforeEach(() => {
    problemsApi.list.mockReturnValue(
      of({
        items: [
          {
            id: 'problem-1',
            type: 'problem',
            placeId: 'place-1',
            targetType: 'bed',
            targetId: 'bed-1',
            targetLabel: 'Bed A',
            title: 'Leaf spots',
            category: 'fungus',
            severity: 'medium',
            status: 'open',
            observedAt: '2026-05-13T07:00:00.000Z',
            photosCount: 2,
          },
        ],
        page: 1,
        pageSize: 20,
        total: 1,
      }),
    );
    problemsApi.get.mockReturnValue(of(detail));
    problemsApi.create.mockReturnValue(of({ id: 'problem-1' }));
    problemsApi.update.mockReturnValue(of({ id: 'problem-1' }));
    problemsApi.uploadPhoto.mockReturnValue(
      of({ id: 'photo-1', storageKey: 'problems/problem-1/photo.jpg' }),
    );
    placesApi.list.mockReturnValue(
      of({ items: [{ id: 'place-1', name: 'Home' }], page: 1, pageSize: 20, total: 1 }),
    );
    activitiesApi.list.mockReturnValue(of({ items: [], page: 1, pageSize: 20, total: 0 }));
    bedsApi.listByPlace.mockReturnValue(
      of({ items: [{ id: 'bed-1', name: 'Bed A' }], page: 1, pageSize: 20, total: 1 }),
    );
    perennialsApi.listByPlace.mockReturnValue(of({ items: [], page: 1, pageSize: 20, total: 0 }));
    yearlyPlantingsApi.listByBed.mockReturnValue(of({ items: [], page: 1, pageSize: 20, total: 0 }));
    persistentPlantsApi.listByBed.mockReturnValue(
      of({ items: [], page: 1, pageSize: 20, total: 0 }),
    );

    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ problemId: 'problem-1' }) } },
        },
        { provide: ProblemsApiService, useValue: problemsApi },
        { provide: PlacesApiService, useValue: placesApi },
        { provide: ActivitiesApiService, useValue: activitiesApi },
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

  it('filters the problems list and renders backend rows', () => {
    const fixture = TestBed.createComponent(ProblemsListPage);

    fixture.componentInstance.filters.patchValue({
      placeId: 'place-1',
      type: 'problem',
      status: 'open',
    });
    fixture.componentInstance.search();
    fixture.detectChanges();

    expect(problemsApi.list).toHaveBeenLastCalledWith({
      placeId: 'place-1',
      type: 'problem',
      status: 'open',
      category: undefined,
      from: undefined,
      to: undefined,
      page: 1,
      pageSize: 20,
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Leaf spots');
    expect(text).toContain('Bed A');
    expect(text).toContain('Photos: 2');
  });

  it('renders backend-provided photo URLs on detail', () => {
    const fixture = TestBed.createComponent(ProblemDetailPage);

    fixture.detectChanges();

    expect(problemsApi.get).toHaveBeenCalledWith('problem-1');
    const image = (fixture.nativeElement as HTMLElement).querySelector('img');
    expect(image?.getAttribute('src')).toBe('https://storage.example/signed/photo-1.jpg');
  });

  it('shows the uploader for problems and submits without a photo', () => {
    const fixture = TestBed.createComponent(ProblemCreatePage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({
      type: 'problem',
      placeId: 'place-1',
      title: 'Leaf spots',
      description: 'Dark spots',
    });
    fixture.detectChanges();

    expect(component.isProblemType()).toBe(true);
    expect(component.uploader()?.enabled()).toBe(true);
    expect(component.targetIsValid()).toBe(true);

    component.submit();

    expect(problemsApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'problem',
        placeId: 'place-1',
        targetType: 'place',
        targetId: 'place-1',
        title: 'Leaf spots',
        description: 'Dark spots',
        status: 'open',
      }),
    );
    expect(problemsApi.uploadPhoto).not.toHaveBeenCalled();
    expect(component.created()).toEqual({ id: 'problem-1' });
  });

  it('hides the uploader for observations and never uploads a photo', () => {
    const fixture = TestBed.createComponent(ProblemCreatePage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({
      type: 'observation',
      placeId: 'place-1',
      title: 'General note',
      description: 'Looks healthy',
    });
    fixture.detectChanges();

    expect(component.isProblemType()).toBe(false);
    expect(component.uploader()?.enabled()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Photos can be attached to problems only.',
    );

    component.submit();

    expect(problemsApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'observation' }),
    );
    expect(problemsApi.uploadPhoto).not.toHaveBeenCalled();
  });

  it('shows the resolved target summary before save', () => {
    const fixture = TestBed.createComponent(ProblemCreatePage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ placeId: 'place-1' });
    fixture.detectChanges();

    expect(component.targetIntent()?.summary).toBe('Place: Home');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Place: Home');
  });

  it('does not treat an unselected place as a resolved target', () => {
    const fixture = TestBed.createComponent(ProblemCreatePage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ type: 'problem', title: 'Leaf spots', description: 'Dark spots' });
    fixture.detectChanges();

    expect(component.targetIntent()?.targetId).toBeNull();
    expect(component.targetIsValid()).toBe(false);

    component.submit();

    expect(problemsApi.create).not.toHaveBeenCalled();
  });

  it('requires title and description before submitting', () => {
    const fixture = TestBed.createComponent(ProblemCreatePage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ type: 'problem', placeId: 'place-1' });
    component.submit();

    expect(problemsApi.create).not.toHaveBeenCalled();
    expect(component.form.controls.title.invalid).toBe(true);
    expect(component.form.controls.description.invalid).toBe(true);
  });

  it('uploads the selected photo after creating a problem', () => {
    const fixture = TestBed.createComponent(ProblemCreatePage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({
      type: 'problem',
      placeId: 'place-1',
      title: 'Leaf spots',
      description: 'Dark spots',
    });
    fixture.detectChanges();

    const file = new File(['binary'], 'leaf.jpg', { type: 'image/jpeg' });
    component.uploader()?.onFileChange(fileChangeEvent(file));
    component.submit();

    expect(problemsApi.create).toHaveBeenCalledTimes(1);
    expect(problemsApi.uploadPhoto).toHaveBeenCalledWith('problem-1', file);
    expect(component.uploader()?.uploaded()).toEqual({
      id: 'photo-1',
      storageKey: 'problems/problem-1/photo.jpg',
    });
  });

  it('keeps metadata and shows an upload error when photo upload fails', () => {
    problemsApi.uploadPhoto.mockReturnValueOnce(
      throwError(() => new ApiError('EXTERNAL_SERVICE_ERROR', 'Storage unavailable')),
    );
    const fixture = TestBed.createComponent(ProblemCreatePage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({
      type: 'problem',
      placeId: 'place-1',
      title: 'Keep this title',
      description: 'Keep this description',
    });
    fixture.detectChanges();

    const file = new File(['binary'], 'leaf.jpg', { type: 'image/jpeg' });
    component.uploader()?.onFileChange(fileChangeEvent(file));
    component.submit();

    expect(component.created()).toEqual({ id: 'problem-1' });
    expect(component.form.controls.title.value).toBe('Keep this title');
    expect(component.form.controls.description.value).toBe('Keep this description');
    expect(component.uploader()?.uploadError()).toBe('Storage unavailable');
  });

  it('rejects non-image files with a client validation message', () => {
    const fixture = TestBed.createComponent(ProblemCreatePage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const uploader = component.uploader();
    const pdf = new File(['binary'], 'note.pdf', { type: 'application/pdf' });
    uploader?.onFileChange(fileChangeEvent(pdf));

    expect(uploader?.hasFile()).toBe(false);
    expect(uploader?.validationError()).toContain('Unsupported file type');
  });
});
