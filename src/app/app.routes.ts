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

export const routes: Routes = buildRoutes();
