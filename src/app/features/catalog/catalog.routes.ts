import { Routes } from '@angular/router';
import { CatalogPage } from './pages/catalog';

// The development catalogue (T079). Registered at /_ds only in builds with SSPC_CATALOG (T084).
export const CATALOG_ROUTES: Routes = [{ path: '', component: CatalogPage }];
