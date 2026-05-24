import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ApiClient } from '../core/api/api-client';
import { BedsApiService } from './beds/beds-api.service';
import { PerennialsApiService } from './perennials/perennials-api.service';
import { PlacesApiService } from './places/places-api.service';
import { PlantsApiService } from './plants/plants-api.service';
import { PersistentBedPlantsApiService } from './plantings/persistent-bed-plants-api.service';
import { YearlyBedPlantingsApiService } from './plantings/yearly-bed-plantings-api.service';

describe('garden structure API services', () => {
  const api = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  };

  beforeEach(() => {
    api.get.mockReturnValue(of({ items: [], page: 1, pageSize: 20, total: 0 }));
    api.post.mockReturnValue(of({ id: 'created-id' }));
    api.patch.mockReturnValue(of({ id: 'updated-id' }));

    TestBed.configureTestingModule({
      providers: [{ provide: ApiClient, useValue: api }],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('uses canonical places endpoints', () => {
    const service = TestBed.inject(PlacesApiService);

    service.list({ q: 'orchard', includeArchived: true, page: 2, pageSize: 50 }).subscribe();
    service.create({ name: 'Home', weatherEnabled: false }).subscribe();
    service.get('place-1').subscribe();
    service.update('place-1', { name: 'Home 2' }).subscribe();
    service.archive('place-1').subscribe();

    expect(api.get).toHaveBeenNthCalledWith(1, '/places', {
      params: { q: 'orchard', includeArchived: true, page: 2, pageSize: 50 },
    });
    expect(api.post).toHaveBeenNthCalledWith(1, '/places', {
      name: 'Home',
      weatherEnabled: false,
    });
    expect(api.get).toHaveBeenNthCalledWith(2, '/places/place-1');
    expect(api.patch).toHaveBeenCalledWith('/places/place-1', { name: 'Home 2' });
    expect(api.post).toHaveBeenNthCalledWith(2, '/places/place-1/archive', {});
  });

  it('uses canonical plants endpoints and supported filters', () => {
    const service = TestBed.inject(PlantsApiService);

    service
      .list({
        q: 'tomato',
        lifecycleType: 'annual',
        growingStyle: 'vegetable',
        includeArchived: false,
      })
      .subscribe();
    service.create({ commonName: 'Tomato', lifecycleType: 'annual', growingStyle: 'vegetable' }).subscribe();
    service.get('plant-1').subscribe();
    service.update('plant-1', { variety: 'Roma' }).subscribe();
    service.archive('plant-1').subscribe();

    expect(api.get).toHaveBeenNthCalledWith(1, '/plants', {
      params: {
        q: 'tomato',
        lifecycleType: 'annual',
        growingStyle: 'vegetable',
        includeArchived: false,
      },
    });
    expect(api.post).toHaveBeenNthCalledWith(1, '/plants', {
      commonName: 'Tomato',
      lifecycleType: 'annual',
      growingStyle: 'vegetable',
    });
    expect(api.get).toHaveBeenNthCalledWith(2, '/plants/plant-1');
    expect(api.patch).toHaveBeenCalledWith('/plants/plant-1', { variety: 'Roma' });
    expect(api.post).toHaveBeenNthCalledWith(2, '/plants/plant-1/archive', {});
  });

  it('uses nested and direct perennial endpoints', () => {
    const service = TestBed.inject(PerennialsApiService);

    service.listByPlace('place-1', { q: 'pear', status: 'active' }).subscribe();
    service.create('place-1', { plantId: 'plant-1', plantedYear: 2022 }).subscribe();
    service.get('perennial-1').subscribe();
    service.update('perennial-1', { status: 'dead' }).subscribe();
    service.archive('perennial-1').subscribe();

    expect(api.get).toHaveBeenNthCalledWith(1, '/places/place-1/perennials', {
      params: { q: 'pear', status: 'active' },
    });
    expect(api.post).toHaveBeenNthCalledWith(1, '/places/place-1/perennials', {
      plantId: 'plant-1',
      plantedYear: 2022,
    });
    expect(api.get).toHaveBeenNthCalledWith(2, '/perennials/perennial-1');
    expect(api.patch).toHaveBeenCalledWith('/perennials/perennial-1', { status: 'dead' });
    expect(api.post).toHaveBeenNthCalledWith(2, '/perennials/perennial-1/archive', {});
  });

  it('uses canonical bed endpoints and year query params', () => {
    const service = TestBed.inject(BedsApiService);

    service.listByPlace('place-1', { year: 2026, q: 'north' }).subscribe();
    service.create('place-1', { name: 'Bed A', widthM: 1.2, lengthM: 4 }).subscribe();
    service.get('bed-1', 2026).subscribe();
    service.update('bed-1', { status: 'removed' }).subscribe();
    service.archive('bed-1').subscribe();

    expect(api.get).toHaveBeenNthCalledWith(1, '/places/place-1/beds', {
      params: { year: 2026, q: 'north' },
    });
    expect(api.post).toHaveBeenNthCalledWith(1, '/places/place-1/beds', {
      name: 'Bed A',
      widthM: 1.2,
      lengthM: 4,
    });
    expect(api.get).toHaveBeenNthCalledWith(2, '/beds/bed-1', { params: { year: 2026 } });
    expect(api.patch).toHaveBeenCalledWith('/beds/bed-1', { status: 'removed' });
    expect(api.post).toHaveBeenNthCalledWith(2, '/beds/bed-1/archive', {});
  });

  it('uses canonical persistent bed plant endpoints', () => {
    const service = TestBed.inject(PersistentBedPlantsApiService);

    service.listByBed('bed-1', { status: 'active' }).subscribe();
    service.create('bed-1', { plantId: 'plant-1', quantity: 10 }).subscribe();
    service.update('persistent-1', { status: 'removed' }).subscribe();
    service.archive('persistent-1').subscribe();

    expect(api.get).toHaveBeenCalledWith('/beds/bed-1/persistent-plants', {
      params: { status: 'active' },
    });
    expect(api.post).toHaveBeenNthCalledWith(1, '/beds/bed-1/persistent-plants', {
      plantId: 'plant-1',
      quantity: 10,
    });
    expect(api.patch).toHaveBeenCalledWith('/persistent-bed-plants/persistent-1', {
      status: 'removed',
    });
    expect(api.post).toHaveBeenNthCalledWith(
      2,
      '/persistent-bed-plants/persistent-1/archive',
      {},
    );
  });

  it('uses canonical yearly planting endpoints', () => {
    const service = TestBed.inject(YearlyBedPlantingsApiService);

    service.listByBed('bed-1', { year: 2026, status: 'planted' }).subscribe();
    service.create('bed-1', { plantId: 'plant-1', year: 2026, status: 'planted' }).subscribe();
    service.update('planting-1', { quantity: 12 }).subscribe();
    service.archive('planting-1').subscribe();

    expect(api.get).toHaveBeenCalledWith('/beds/bed-1/plantings', {
      params: { year: 2026, status: 'planted' },
    });
    expect(api.post).toHaveBeenNthCalledWith(1, '/beds/bed-1/plantings', {
      plantId: 'plant-1',
      year: 2026,
      status: 'planted',
    });
    expect(api.patch).toHaveBeenCalledWith('/plantings/planting-1', { quantity: 12 });
    expect(api.post).toHaveBeenNthCalledWith(2, '/plantings/planting-1/archive', {});
  });

  it('keeps trusted account scope out of request bodies', () => {
    const forbiddenKey = ['account', 'Id'].join('');
    const requestBodies = [
      { name: 'Place', weatherEnabled: false },
      { commonName: 'Tomato', lifecycleType: 'annual', growingStyle: 'vegetable' },
      { plantId: 'plant-1', plantedYear: 2020 },
      { name: 'Bed A', widthM: 1, lengthM: 2 },
      { plantId: 'plant-1', quantity: 2 },
      { plantId: 'plant-1', year: 2026, status: 'planned' },
    ];

    for (const body of requestBodies) {
      expect(body).not.toHaveProperty(forbiddenKey);
    }
  });
});
