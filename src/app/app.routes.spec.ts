// Table-driven spec for the route table (T078, T046, T084). The build constants are literals in
// the unit-test build (research R-05), so the catalogue is toggled by the argument instead.
import { Route } from '@angular/router';
import { buildRoutes } from './app.routes';

const catalogRoute: Route = { path: '_ds', loadChildren: () => Promise.resolve([]) };

describe('buildRoutes', () => {
  it.each([
    { name: 'given a catalogue route, then _ds comes before the wildcard', route: catalogRoute, present: true },
    { name: 'given no catalogue route, then the table has no _ds', route: undefined, present: false },
  ])('$name', ({ route, present }) => {
    // given / when
    const paths = buildRoutes(route).map((entry) => entry.path);
    // then
    expect(paths.includes('_ds')).toBe(present);
    if (present) expect(paths.indexOf('_ds')).toBeLessThan(paths.indexOf('**'));
  });

  it.each([
    { name: 'given a catalogue route, then ** redirects to the home page', route: catalogRoute },
    { name: 'given no catalogue route, then ** redirects to the home page', route: undefined },
  ])('$name', ({ route }) => {
    // given / when
    const wildcard = buildRoutes(route).find((entry) => entry.path === '**');
    // then
    expect(wildcard?.redirectTo).toBe('');
  });
});
