import { Route, Routes } from '@angular/router';

// Lazy routes (data-model §Navigation). `data.title` is the app-bar title; `data.back`
// shows the back control. `buildRoutes` takes the optional catalogue route (T084), and
// it is the seam the route spec tests (T078).
export function buildRoutes(catalogRoute?: Route): Routes {
  return [
    {
      path: '',
      data: { title: 'Início' },
      loadChildren: () => import('./features/home/home.routes').then((m) => m.HOME_ROUTES),
    },
    {
      path: 'sobre',
      data: { title: 'Sobre', back: true },
      loadChildren: () => import('./features/about/about.routes').then((m) => m.ABOUT_ROUTES),
    },
    ...(catalogRoute ? [catalogRoute] : []),
    { path: '**', redirectTo: '' },
  ];
}

// The catalogue exists only in builds with SSPC_CATALOG (development and test builds). The
// import sits in the branch on the build-time constant, so a production build drops the
// lazy chunk with it (research R-15, proved by the build assertion in T118).
export const routes: Routes = buildRoutes(
  SSPC_CATALOG
    ? { path: '_ds', loadChildren: () => import('./features/catalog/catalog.routes').then((m) => m.CATALOG_ROUTES) }
    : undefined,
);
