import { Routes } from '@angular/router';

import { ProductCreatePage } from './pages/product-create-page/product-create-page';
import { ProductDetailPage } from './pages/product-detail-page/product-detail-page';
import { ProductEditPage } from './pages/product-edit-page/product-edit-page';
import { ProductRuleCreatePage } from './pages/product-rule-create-page/product-rule-create-page';
import { ProductRuleEditPage } from './pages/product-rule-edit-page/product-rule-edit-page';
import { ProductsListPage } from './pages/products-list-page/products-list-page';

export const productsRoutes: Routes = [
  { path: '', pathMatch: 'full', title: 'Products', component: ProductsListPage },
  { path: 'new', title: 'New Product', component: ProductCreatePage },
  {
    path: ':productId',
    children: [
      { path: '', pathMatch: 'full', title: 'Product Detail', component: ProductDetailPage },
      { path: 'edit', title: 'Edit Product', component: ProductEditPage },
      {
        path: 'rules',
        children: [
          { path: 'new', title: 'New Product Usage Rule', component: ProductRuleCreatePage },
        ],
      },
    ],
  },
];

export const productRulesRoutes: Routes = [
  {
    path: ':ruleId',
    children: [
      { path: 'edit', title: 'Edit Product Usage Rule', component: ProductRuleEditPage },
    ],
  },
];

