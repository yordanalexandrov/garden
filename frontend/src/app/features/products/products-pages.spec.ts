import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApiError } from '../../core/errors/api-error';
import { SnackbarService } from '../../core/notifications/snackbar.service';
import { ArchiveConfirmationService } from '../../shared/components/confirm-dialog/confirm-dialog';
import { PlantsApiService } from '../plants/plants-api.service';
import { InventoryApiService } from '../inventory/inventory-api.service';
import { ProductForm } from './components/product-form/product-form';
import { ProductRuleForm } from './components/product-rule-form/product-rule-form';
import { ProductDetail, ProductUsageRuleDetail } from './products.models';
import { ProductRulesApiService, ProductsApiService } from './products-api.service';
import { ProductDetailPage } from './pages/product-detail-page/product-detail-page';
import { ProductsListPage } from './pages/products-list-page/products-list-page';

describe('Phase 10 product pages and forms', () => {
  const product: ProductDetail = {
    id: 'product-1',
    name: 'Copper Fungicide',
    category: 'fungicide',
    activeSubstance: 'Copper',
    manufacturer: 'Maker',
    formulation: 'WG',
    defaultUnit: 'g',
    stockSummary: { quantityRemaining: 250, unit: 'g' },
    rulesCount: 1,
    archivedAt: null,
    notes: null,
    usageRules: [],
    inventorySummary: { quantityRemaining: 250, unit: 'g', lotsCount: 1, expiredLotsCount: 0 },
    recentMovements: [],
    createdAt: '2026-05-25T00:00:00.000Z',
    updatedAt: '2026-05-25T00:00:00.000Z',
  };
  const rule: ProductUsageRuleDetail = {
    id: 'rule-1',
    productId: 'product-1',
    plantId: 'plant-1',
    doseValue: 20,
    doseUnit: 'g',
    dilutionText: null,
    applicationMethod: 'spray',
    reapplicationIntervalDays: 10,
    quarantinePeriodDays: 14,
    notes: null,
    archivedAt: null,
    createdAt: '2026-05-25T00:00:00.000Z',
    updatedAt: '2026-05-25T00:00:00.000Z',
  };
  const productsApi = {
    list: vi.fn(),
    create: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
  };
  const rulesApi = {
    listByProduct: vi.fn(),
    create: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
  };
  const inventoryApi = {
    listLots: vi.fn(),
    listMovements: vi.fn(),
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
    productsApi.list.mockReturnValue(of({ items: [product], page: 1, pageSize: 20, total: 1 }));
    productsApi.get.mockReturnValue(of(product));
    productsApi.archive.mockReturnValue(of({ archived: true }));
    rulesApi.listByProduct.mockReturnValue(of({ items: [rule] }));
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
            movementType: 'purchase',
            quantity: 250,
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
    plantsApi.list.mockReturnValue(of({ items: [], page: 1, pageSize: 20, total: 0 }));
    archiveConfirmation.confirmArchive.mockReturnValue(of(false));

    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideRouter([{ path: 'products/:productId', component: ProductDetailPage }]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ productId: 'product-1' }) } } },
        { provide: ProductsApiService, useValue: productsApi },
        { provide: ProductRulesApiService, useValue: rulesApi },
        { provide: InventoryApiService, useValue: inventoryApi },
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

  it('searches products through typed filters and renders stock and rules', () => {
    const fixture = TestBed.createComponent(ProductsListPage);

    fixture.componentInstance.filters.patchValue({
      q: 'copper',
      category: 'fungicide',
      includeArchived: true,
    });
    fixture.componentInstance.search();
    fixture.detectChanges();

    expect(productsApi.list).toHaveBeenLastCalledWith({
      q: 'copper',
      category: 'fungicide',
      includeArchived: true,
      page: 1,
      pageSize: 20,
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Copper Fungicide');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Stock: 250 g');
  });

  it('validates product and rule forms before submit', () => {
    const productFixture = TestBed.createComponent(ProductForm);
    const productSubmit = vi.fn();
    productFixture.componentInstance.submitted.subscribe(productSubmit);
    productFixture.componentInstance.submit();

    expect(productSubmit).not.toHaveBeenCalled();
    expect(productFixture.componentInstance.form.controls.name.hasError('required')).toBe(true);

    const ruleFixture = TestBed.createComponent(ProductRuleForm);
    const ruleSubmit = vi.fn();
    ruleFixture.componentInstance.submitted.subscribe(ruleSubmit);
    ruleFixture.componentInstance.form.patchValue({ doseValue: -1 });
    ruleFixture.componentInstance.submit();

    expect(ruleSubmit).not.toHaveBeenCalled();
    expect(ruleFixture.componentInstance.form.controls.plantId.hasError('required')).toBe(true);
    expect(ruleFixture.componentInstance.form.controls.doseValue.hasError('min')).toBe(true);
  });

  it('renders duplicate rule conflict errors on the usage rule form', () => {
    const fixture = TestBed.createComponent(ProductRuleForm);

    fixture.componentRef.setInput(
      'apiError',
      new ApiError('CONFLICT', 'Active rule already exists for this product and plant.'),
    );
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Active rule already exists');
  });

  it('renders product detail with visible lots and movement history from backend responses', async () => {
    const fixture = TestBed.createComponent(ProductDetailPage);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(productsApi.get).toHaveBeenCalledWith('product-1');
    expect(rulesApi.listByProduct).toHaveBeenCalledWith('product-1');
    expect(inventoryApi.listLots).toHaveBeenCalledWith('product-1', { page: 1, pageSize: 100 });
    expect(inventoryApi.listMovements).toHaveBeenCalledWith('product-1', { page: 1, pageSize: 50 });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Movement History');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('purchase');
  });

  it('requires confirmation before product archive and uses POST archive API service', () => {
    const fixture = TestBed.createComponent(ProductDetailPage);

    fixture.detectChanges();
    fixture.componentInstance.archiveProduct();

    expect(archiveConfirmation.confirmArchive).toHaveBeenCalledWith('Copper Fungicide');
    expect(productsApi.archive).not.toHaveBeenCalled();

    archiveConfirmation.confirmArchive.mockReturnValue(of(true));
    fixture.componentInstance.archiveProduct();

    expect(productsApi.archive).toHaveBeenCalledWith('product-1');
  });

  it('keeps backend errors visible for product detail loads', async () => {
    productsApi.get.mockReturnValueOnce(throwError(() => new ApiError('NOT_FOUND', 'Missing product')));

    const fixture = TestBed.createComponent(ProductDetailPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Missing product');
  });
});

