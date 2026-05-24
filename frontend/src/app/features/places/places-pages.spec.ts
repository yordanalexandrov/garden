import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApiError } from '../../core/errors/api-error';
import { SnackbarService } from '../../core/notifications/snackbar.service';
import { ArchiveConfirmationService } from '../../shared/components/confirm-dialog/confirm-dialog';
import { PlaceForm } from './components/place-form/place-form';
import { PlacesListPage } from './pages/places-list-page/places-list-page';
import { PlaceDetail, PlaceListItem } from './places.models';
import { PlacesApiService } from './places-api.service';

describe('places Phase 7 pages', () => {
  const place: PlaceListItem = {
    id: 'place-1',
    name: 'Home Garden',
    description: 'Back garden',
    weatherEnabled: true,
    weatherLocationLabel: 'Ruse',
    timezone: 'Europe/Sofia',
    createdAt: '2026-05-23T00:00:00.000Z',
    archivedAt: null,
  };
  const placeDetail: PlaceDetail = {
    ...place,
    notes: 'Irrigated beds',
    latitude: 43.84,
    longitude: 25.95,
    counts: {
      perennials: 12,
      beds: 4,
      openProblems: 0,
      upcomingTasks: 0,
    },
    updatedAt: '2026-05-23T00:00:00.000Z',
  };
  const placesApi = {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
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
    placesApi.list.mockReturnValue(of({ items: [place], page: 1, pageSize: 20, total: 1 }));
    placesApi.get.mockReturnValue(of(placeDetail));
    placesApi.create.mockReturnValue(of({ id: 'place-2', name: 'Orchard' }));
    placesApi.update.mockReturnValue(of({ id: 'place-1', name: 'Home Garden' }));
    placesApi.archive.mockReturnValue(of({ archived: true }));
    archiveConfirmation.confirmArchive.mockReturnValue(of(false));

    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: PlacesApiService, useValue: placesApi },
        { provide: ArchiveConfirmationService, useValue: archiveConfirmation },
        { provide: SnackbarService, useValue: snackbar },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('loads active places through the typed Places API service', () => {
    const fixture = TestBed.createComponent(PlacesListPage);

    fixture.detectChanges();

    expect(placesApi.list).toHaveBeenCalledWith();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Home Garden');
  });

  it('rejects missing names before submitting the form', () => {
    const fixture = TestBed.createComponent(PlaceForm);
    const submitted = vi.fn();

    fixture.componentInstance.submitted.subscribe(submitted);
    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(submitted).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.name.hasError('required')).toBe(true);
  });

  it('requires weather location data when weather is enabled', () => {
    const fixture = TestBed.createComponent(PlaceForm);
    const submitted = vi.fn();

    fixture.componentInstance.submitted.subscribe(submitted);
    fixture.componentInstance.form.patchValue({
      name: 'Orchard',
      weatherEnabled: true,
      weatherLocationLabel: '',
      latitude: null,
      longitude: null,
    });
    fixture.componentInstance.submit();

    expect(submitted).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.hasError('weatherLocation')).toBe(true);

    fixture.componentInstance.form.patchValue({ weatherLocationLabel: 'Ruse' });
    fixture.componentInstance.submit();

    expect(submitted).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Orchard', weatherLocationLabel: 'Ruse' }),
    );
  });

  it('does not send trusted scope fields in create requests', () => {
    const forbiddenKey = ['account', 'Id'].join('');
    const fixture = TestBed.createComponent(PlacesListPage);

    fixture.componentInstance.savePlace({ name: 'Orchard', weatherEnabled: false });

    expect(placesApi.create).toHaveBeenCalledWith({
      name: 'Orchard',
      weatherEnabled: false,
    });
    expect(placesApi.create.mock.calls[0][0]).not.toHaveProperty(forbiddenKey);
  });

  it('loads full place detail before opening the edit form from the list', () => {
    const fixture = TestBed.createComponent(PlacesListPage);

    fixture.componentInstance.openEditForm(place);

    expect(placesApi.get).toHaveBeenCalledWith('place-1');
    expect(fixture.componentInstance.editingPlace()).toEqual(placeDetail);
    expect(fixture.componentInstance.formOpen()).toBe(true);
  });

  it('renders backend validation errors on the form', () => {
    const fixture = TestBed.createComponent(PlaceForm);

    fixture.detectChanges();
    fixture.componentInstance.form.controls.name.setValue('Home Garden');
    fixture.componentRef.setInput(
      'apiError',
      new ApiError('VALIDATION_ERROR', 'Invalid input', {
        details: { name: ['Name is already used.'] },
      }),
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.name.errors).toEqual({
      api: 'Name is already used.',
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Invalid input');
  });

  it('archives only after explicit confirmation', () => {
    const fixture = TestBed.createComponent(PlacesListPage);

    fixture.componentInstance.archivePlace(place);

    expect(archiveConfirmation.confirmArchive).toHaveBeenCalledWith('Home Garden');
    expect(placesApi.archive).not.toHaveBeenCalled();

    archiveConfirmation.confirmArchive.mockReturnValue(of(true));
    fixture.componentInstance.archivePlace(place);

    expect(placesApi.archive).toHaveBeenCalledWith('place-1');
  });

  it('shows backend business errors from archive attempts', () => {
    const error = new ApiError('BUSINESS_RULE_VIOLATION', 'Cannot archive this place.');
    placesApi.archive.mockReturnValue(throwError(() => error));
    archiveConfirmation.confirmArchive.mockReturnValue(of(true));
    const fixture = TestBed.createComponent(PlacesListPage);

    fixture.componentInstance.archivePlace(place);

    expect(fixture.componentInstance.listError()).toBe(error);
  });
});
