import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApiError } from '../../core/errors/api-error';
import { SnackbarService } from '../../core/notifications/snackbar.service';
import { ProductDetail } from '../products/products.models';
import { ProductsApiService } from '../products/products-api.service';
import { InventoryAdjustmentPage } from './pages/inventory-adjustment-page/inventory-adjustment-page';
import { InventoryLotCreatePage } from './pages/inventory-lot-create-page/inventory-lot-create-page';
import { InventoryOverviewPage } from './pages/inventory-overview-page/inventory-overview-page';
import { ProductInventoryPage } from './pages/product-inventory-page/product-inventory-page';
import { InventoryApiService } from './inventory-api.service';

describe('Phase 10 inventory pages and forms', () => {
  const product: ProductDetail = {
    id: 'product-1',
    name: 'Copper Fungicide',
    category: 'fungicide',
    activeSubstance: 'Copper',
    manufacturer: null,
    formulation: null,
    defaultUnit: 'g',
    stockSummary: { quantityRemaining: 250, unit: 'g' },
    rulesCount: 0,
    archivedAt: null,
    notes: null,
    usageRules: [],
    inventorySummary: { quantityRemaining: 250, unit: 'g', lotsCount: 1, expiredLotsCount: 0 },
    recentMovements: [],
    createdAt: '2026-05-25T00:00:00.000Z',
    updatedAt: '2026-05-25T00:00:00.000Z',
  };
  const productsApi = {
    list: vi.fn(),
    get: vi.fn(),
  };
  const inventoryApi = {
    list: vi.fn(),
    listLots: vi.fn(),
    createLot: vi.fn(),
    listMovements: vi.fn(),
    adjustStock: vi.fn(),
  };
  const snackbar = {
    showMessage: vi.fn(),
    showError: vi.fn(),
  };

  beforeEach(() => {
    productsApi.list.mockReturnValue(of({ items: [product], page: 1, pageSize: 20, total: 1 }));
    productsApi.get.mockReturnValue(of(product));
    inventoryApi.list.mockReturnValue(
      of({
        items: [
          {
            productId: 'product-1',
            productName: 'Copper Fungicide',
            category: 'fungicide',
            quantityRemaining: 250,
            unit: 'g',
            lotsCount: 1,
            nearestExpiryDate: '2027-05-25',
          },
        ],
        page: 1,
        pageSize: 20,
        total: 1,
      }),
    );
    inventoryApi.listLots.mockReturnValue(
      of({
        items: [
          {
            id: 'lot-1',
            productId: 'product-1',
            quantityInitial: 250,
            quantityRemaining: 200,
            unit: 'g',
            purchaseDate: '2026-05-25',
            expiryDate: '2027-05-25',
            batchNumber: 'B-1',
            notes: null,
            archivedAt: null,
            createdAt: '2026-05-25T00:00:00.000Z',
            updatedAt: '2026-05-25T00:00:00.000Z',
          },
        ],
        page: 1,
        pageSize: 20,
        total: 1,
      }),
    );
    inventoryApi.listMovements.mockReturnValue(
      of({
        items: [
          {
            id: 'movement-1',
            productId: 'product-1',
            inventoryLotId: 'lot-1',
            movementType: 'manual_adjustment',
            quantity: 5,
            unit: 'g',
            activityId: null,
            occurredAt: '2026-05-25T00:00:00.000Z',
            notes: null,
            createdAt: '2026-05-25T00:00:00.000Z',
          },
        ],
        page: 1,
        pageSize: 20,
        total: 1,
      }),
    );
    inventoryApi.createLot.mockReturnValue(of({ lot: { id: 'lot-2' }, movement: { id: 'movement-2' } }));
    inventoryApi.adjustStock.mockReturnValue(
      of({ movement: { id: 'movement-3' }, lot: { id: 'lot-1', quantityRemaining: 195 } }),
    );

    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideRouter([{ path: 'inventory/products/:productId', component: ProductInventoryPage }]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ productId: 'product-1' }),
              queryParamMap: convertToParamMap({ productId: 'product-1' }),
            },
          },
        },
        { provide: ProductsApiService, useValue: productsApi },
        { provide: InventoryApiService, useValue: inventoryApi },
        { provide: SnackbarService, useValue: snackbar },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('sends canonical inventory overview filters and renders backend balances', () => {
    const fixture = TestBed.createComponent(InventoryOverviewPage);

    fixture.componentInstance.filters.patchValue({
      q: 'copper',
      category: 'fungicide',
      lowStockOnly: true,
      expiringBefore: '2027-01-01',
    });
    fixture.componentInstance.search();
    fixture.detectChanges();

    expect(inventoryApi.list).toHaveBeenLastCalledWith({
      q: 'copper',
      category: 'fungicide',
      lowStockOnly: true,
      expiringBefore: '2027-01-01',
      page: 1,
      pageSize: 20,
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('250 g');
  });

  it('renders product inventory lots and movement history from backend APIs', async () => {
    const fixture = TestBed.createComponent(ProductInventoryPage);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(productsApi.get).toHaveBeenCalledWith('product-1');
    expect(inventoryApi.listLots).toHaveBeenCalledWith('product-1', { page: 1, pageSize: 100 });
    expect(inventoryApi.listMovements).toHaveBeenCalledWith('product-1', { page: 1, pageSize: 100 });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Movement History');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('manual_adjustment');
  });

  it('validates add lot form and sends canonical body without scope fields', () => {
    const fixture = TestBed.createComponent(InventoryLotCreatePage);

    fixture.componentInstance.form.patchValue({ quantityInitial: -1 });
    fixture.componentInstance.submit();
    expect(inventoryApi.createLot).not.toHaveBeenCalled();

    fixture.componentInstance.form.patchValue({
      quantityInitial: 250,
      unit: 'g',
      purchaseDate: '2026-05-25',
      expiryDate: '2027-05-25',
      batchNumber: 'B-1',
      notes: 'purchase',
    });
    fixture.componentInstance.submit();

    expect(inventoryApi.createLot).toHaveBeenCalledWith('product-1', {
      quantityInitial: 250,
      unit: 'g',
      purchaseDate: '2026-05-25',
      expiryDate: '2027-05-25',
      batchNumber: 'B-1',
      notes: 'purchase',
    });
    expect(inventoryApi.createLot.mock.calls[0][1]).not.toHaveProperty(['account', 'Id'].join(''));
  });

  it('validates manual adjustment and navigates to visible movement history after success', () => {
    const fixture = TestBed.createComponent(InventoryAdjustmentPage);

    fixture.componentInstance.form.patchValue({ quantity: -1 });
    fixture.componentInstance.submit();
    expect(inventoryApi.adjustStock).not.toHaveBeenCalled();

    fixture.componentInstance.form.patchValue({
      productId: 'product-1',
      inventoryLotId: 'lot-1',
      quantity: 5,
      unit: 'g',
      movementType: 'manual_adjustment',
      direction: 'decrease',
      notes: 'counted stock',
    });
    fixture.componentInstance.submit();

    expect(inventoryApi.adjustStock).toHaveBeenCalledWith({
      productId: 'product-1',
      inventoryLotId: 'lot-1',
      quantity: 5,
      unit: 'g',
      movementType: 'manual_adjustment',
      direction: 'decrease',
      notes: 'counted stock',
    });
    expect(inventoryApi.adjustStock.mock.calls[0][0]).not.toHaveProperty(['account', 'Id'].join(''));
  });

  it('renders backend negative-stock style errors without local stock mutation', async () => {
    inventoryApi.adjustStock.mockReturnValueOnce(
      throwError(() => new ApiError('INVENTORY_SHORTAGE', 'Insufficient stock for adjustment.')),
    );
    const fixture = TestBed.createComponent(InventoryAdjustmentPage);

    fixture.componentInstance.form.patchValue({
      productId: 'product-1',
      quantity: 500,
      unit: 'g',
      movementType: 'manual_adjustment',
      direction: 'decrease',
    });
    fixture.componentInstance.submit();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Insufficient stock');
    expect(inventoryApi.listLots).toHaveBeenCalledWith('product-1', { page: 1, pageSize: 100 });
  });
});

