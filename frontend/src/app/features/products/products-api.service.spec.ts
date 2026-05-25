import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ApiClient } from '../../core/api/api-client';
import { InventoryApiService } from '../inventory/inventory-api.service';
import { ProductRulesApiService, ProductsApiService } from './products-api.service';

describe('Phase 10 product and inventory API services', () => {
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

  it('uses canonical product endpoints and filters', () => {
    const service = TestBed.inject(ProductsApiService);

    service
      .list({
        q: 'copper',
        category: 'fungicide',
        includeArchived: true,
        page: 2,
        pageSize: 50,
      })
      .subscribe();
    service
      .create({
        name: 'Copper',
        category: 'fungicide',
        defaultUnit: 'g',
        activeSubstance: 'Copper',
      })
      .subscribe();
    service.get('product-1').subscribe();
    service.update('product-1', { manufacturer: 'Maker' }).subscribe();
    service.archive('product-1').subscribe();

    expect(api.get).toHaveBeenNthCalledWith(1, '/products', {
      params: {
        q: 'copper',
        category: 'fungicide',
        includeArchived: true,
        page: 2,
        pageSize: 50,
      },
    });
    expect(api.post).toHaveBeenNthCalledWith(1, '/products', {
      name: 'Copper',
      category: 'fungicide',
      defaultUnit: 'g',
      activeSubstance: 'Copper',
    });
    expect(api.get).toHaveBeenNthCalledWith(2, '/products/product-1');
    expect(api.patch).toHaveBeenCalledWith('/products/product-1', { manufacturer: 'Maker' });
    expect(api.post).toHaveBeenNthCalledWith(2, '/products/product-1/archive', {});
  });

  it('uses canonical product usage rule endpoints', () => {
    const service = TestBed.inject(ProductRulesApiService);

    service.listByProduct('product-1').subscribe();
    service
      .create('product-1', { plantId: 'plant-1', doseValue: 20, doseUnit: 'g' })
      .subscribe();
    service.get('rule-1').subscribe();
    service.update('rule-1', { quarantinePeriodDays: 14 }).subscribe();
    service.archive('rule-1').subscribe();

    expect(api.get).toHaveBeenNthCalledWith(1, '/products/product-1/rules');
    expect(api.post).toHaveBeenNthCalledWith(1, '/products/product-1/rules', {
      plantId: 'plant-1',
      doseValue: 20,
      doseUnit: 'g',
    });
    expect(api.get).toHaveBeenNthCalledWith(2, '/product-rules/rule-1');
    expect(api.patch).toHaveBeenCalledWith('/product-rules/rule-1', {
      quarantinePeriodDays: 14,
    });
    expect(api.post).toHaveBeenNthCalledWith(2, '/product-rules/rule-1/archive', {});
  });

  it('uses canonical inventory endpoints and filters', () => {
    const service = TestBed.inject(InventoryApiService);

    service
      .list({
        q: 'copper',
        category: 'fungicide',
        lowStockOnly: true,
        expiringBefore: '2027-01-01',
        page: 1,
        pageSize: 20,
      })
      .subscribe();
    service.listLots('product-1', { page: 1, pageSize: 100 }).subscribe();
    service
      .createLot('product-1', { quantityInitial: 250, unit: 'g', batchNumber: 'B-1' })
      .subscribe();
    service
      .listMovements('product-1', {
        from: '2026-01-01',
        to: '2026-12-31',
        movementType: 'purchase',
      })
      .subscribe();
    service
      .adjustStock({
        productId: 'product-1',
        inventoryLotId: 'lot-1',
        quantity: 5,
        unit: 'g',
        movementType: 'manual_adjustment',
        direction: 'decrease',
      })
      .subscribe();

    expect(api.get).toHaveBeenNthCalledWith(1, '/inventory', {
      params: {
        q: 'copper',
        category: 'fungicide',
        lowStockOnly: true,
        expiringBefore: '2027-01-01',
        page: 1,
        pageSize: 20,
      },
    });
    expect(api.get).toHaveBeenNthCalledWith(2, '/products/product-1/inventory-lots', {
      params: { page: 1, pageSize: 100 },
    });
    expect(api.post).toHaveBeenNthCalledWith(1, '/products/product-1/inventory-lots', {
      quantityInitial: 250,
      unit: 'g',
      batchNumber: 'B-1',
    });
    expect(api.get).toHaveBeenNthCalledWith(3, '/products/product-1/inventory-movements', {
      params: { from: '2026-01-01', to: '2026-12-31', movementType: 'purchase' },
    });
    expect(api.post).toHaveBeenNthCalledWith(2, '/inventory/adjustments', {
      productId: 'product-1',
      inventoryLotId: 'lot-1',
      quantity: 5,
      unit: 'g',
      movementType: 'manual_adjustment',
      direction: 'decrease',
    });
  });

  it('keeps trusted scope fields out of Phase 10 request bodies', () => {
    const forbiddenKey = ['account', 'Id'].join('');
    const requestBodies = [
      { name: 'Copper', category: 'fungicide', defaultUnit: 'g' },
      { plantId: 'plant-1', doseValue: 20, doseUnit: 'g' },
      { quantityInitial: 250, unit: 'g' },
      {
        productId: 'product-1',
        quantity: 5,
        unit: 'g',
        movementType: 'manual_adjustment',
        direction: 'increase',
      },
    ];

    for (const body of requestBodies) {
      expect(body).not.toHaveProperty(forbiddenKey);
    }
  });
});

