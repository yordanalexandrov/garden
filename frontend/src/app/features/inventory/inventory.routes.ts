import { Routes } from '@angular/router';

import { InventoryAdjustmentPage } from './pages/inventory-adjustment-page/inventory-adjustment-page';
import { InventoryLotCreatePage } from './pages/inventory-lot-create-page/inventory-lot-create-page';
import { InventoryOverviewPage } from './pages/inventory-overview-page/inventory-overview-page';
import { ProductInventoryPage } from './pages/product-inventory-page/product-inventory-page';

export const inventoryRoutes: Routes = [
  { path: '', pathMatch: 'full', title: 'Inventory', component: InventoryOverviewPage },
  {
    path: 'products',
    children: [
      {
        path: ':productId',
        children: [
          { path: '', pathMatch: 'full', title: 'Product Inventory', component: ProductInventoryPage },
          {
            path: 'lots',
            children: [
              { path: 'new', title: 'New Inventory Lot', component: InventoryLotCreatePage },
            ],
          },
        ],
      },
    ],
  },
  {
    path: 'adjustments',
    children: [
      { path: 'new', title: 'New Inventory Adjustment', component: InventoryAdjustmentPage },
    ],
  },
];

