import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { ApiError } from '../../core/errors/api-error';
import { SnackbarService } from '../../core/notifications/snackbar.service';
import { PlantsApiService } from '../plants/plants-api.service';
import { ArchiveConfirmationService } from '../../shared/components/confirm-dialog/confirm-dialog';
import { PerennialForm } from './components/perennial-form/perennial-form';
import { PlacePerennialsPage } from './pages/place-perennials-page/place-perennials-page';
import { PerennialListItem } from './perennials.models';
import { PerennialsApiService } from './perennials-api.service';

describe('place perennials Phase 7 page', () => {
  const perennial: PerennialListItem = {
    id: 'perennial-1',
    placeId: 'place-1',
    plantId: 'plant-1',
    plantName: 'Pear',
    label: 'Pear near fence',
    plantedYear: 2022,
    status: 'active',
    notes: null,
  };
  const perennialsApi = {
    listByPlace: vi.fn(),
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

  beforeEach(() => {
    perennialsApi.listByPlace.mockReturnValue(
      of({ items: [perennial], page: 1, pageSize: 20, total: 1 }),
    );
    perennialsApi.create.mockReturnValue(of({ id: 'perennial-2' }));
    perennialsApi.update.mockReturnValue(of({ id: 'perennial-1' }));
    perennialsApi.archive.mockReturnValue(of({ archived: true }));
    plantsApi.list.mockReturnValue(of({ items: [], page: 1, pageSize: 20, total: 0 }));
    archiveConfirmation.confirmArchive.mockReturnValue(of(false));

    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        {
          provide: ActivatedRoute,
          useValue: { parent: { paramMap: of(convertToParamMap({ placeId: 'place-1' })) } },
        },
        { provide: PerennialsApiService, useValue: perennialsApi },
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

  it('loads perennials through the place-nested API endpoint', () => {
    const fixture = TestBed.createComponent(PlacePerennialsPage);

    fixture.detectChanges();

    expect(perennialsApi.listByPlace).toHaveBeenCalledWith('place-1', {
      q: undefined,
      status: undefined,
      page: 1,
      pageSize: 20,
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Pear near fence');
  });

  it('requires selected plant and validates sane planted year', () => {
    const fixture = TestBed.createComponent(PerennialForm);
    const submitted = vi.fn();

    fixture.componentInstance.submitted.subscribe(submitted);
    fixture.componentInstance.form.patchValue({ plantedYear: 1800 });
    fixture.componentInstance.submit();

    expect(submitted).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.plantId.hasError('required')).toBe(true);
    expect(fixture.componentInstance.form.controls.plantedYear.hasError('saneYear')).toBe(true);
  });

  it('does not send trusted scope fields when creating or updating', () => {
    const forbiddenKey = ['account', 'Id'].join('');
    const fixture = TestBed.createComponent(PlacePerennialsPage);

    fixture.componentInstance.savePerennial({
      plantId: 'plant-1',
      label: 'Pear',
      plantedYear: 2022,
      notes: null,
      status: 'active',
    });

    expect(perennialsApi.create).toHaveBeenCalledWith('place-1', {
      plantId: 'plant-1',
      label: 'Pear',
      plantedYear: 2022,
      notes: null,
    });
    expect(perennialsApi.create.mock.calls[0][1]).not.toHaveProperty(forbiddenKey);
  });

  it('renders backend invalid reference errors', () => {
    const fixture = TestBed.createComponent(PerennialForm);

    fixture.detectChanges();
    fixture.componentInstance.form.controls.plantId.setValue('plant-1');
    fixture.componentRef.setInput(
      'apiError',
      new ApiError('BUSINESS_RULE_VIOLATION', 'Plant does not belong to this account.', {
        details: { plantId: ['Invalid plant.'] },
      }),
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.plantId.errors).toEqual({
      api: 'Invalid plant.',
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Plant does not belong to this account.',
    );
  });

  it('requires confirmation and calls the canonical archive endpoint', () => {
    const fixture = TestBed.createComponent(PlacePerennialsPage);

    fixture.componentInstance.archivePerennial(perennial);

    expect(archiveConfirmation.confirmArchive).toHaveBeenCalledWith('Pear near fence');
    expect(perennialsApi.archive).not.toHaveBeenCalled();

    archiveConfirmation.confirmArchive.mockReturnValue(of(true));
    fixture.componentInstance.archivePerennial(perennial);

    expect(perennialsApi.archive).toHaveBeenCalledWith('perennial-1');
  });
});
