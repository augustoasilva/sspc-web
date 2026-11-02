// Spec for the development catalogue (T077, FR-024, Principle V). The catalogue shows every
// shared component with all its variants and states, in both themes; it is excluded from
// production by the build constant (T084, research R-15).
import { FormControl } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { UnsavedWork } from '@sspc/core/unsaved-work';
import { CatalogPage } from './catalog';

const SECTIONS = ['button', 'banner', 'dialog', 'status-chip', 'list-row', 'app-bar', 'tab-bar'];

function render() {
  TestBed.configureTestingModule({ imports: [CatalogPage] });
  const fixture = TestBed.createComponent(CatalogPage);
  fixture.detectChanges();
  return { fixture, page: fixture.componentInstance, root: fixture.nativeElement as HTMLElement };
}

describe('CatalogPage', () => {
  it.each(SECTIONS.map((id) => ({ id })))('given the catalogue, then the $id component has its section', ({ id }) => {
    // given / when
    const { root } = render();
    // then
    expect(root.querySelector(`[data-section="${id}"]`)).not.toBeNull();
  });

  it.each([
    { name: 'given the button section, then all four variants are rendered', selector: '[data-variant]', values: ['primary', 'secondary', 'ghost', 'destructive'] },
    { name: 'given the button section, then the loading and disabled states are rendered', selector: '[data-state]', values: ['loading', 'disabled'] },
  ])('$name', ({ selector, values }) => {
    // given / when
    const { root } = render();
    const section = root.querySelector('[data-section="button"]') as HTMLElement;
    const found = Array.from(section.querySelectorAll(selector)).map((el) =>
      el.getAttribute(selector.startsWith('[data-variant') ? 'data-variant' : 'data-state'),
    );
    // then
    for (const value of values) expect(found).toContain(value);
  });

  it('given the page, then one text input is bound to a typed reactive form control', () => {
    // given / when
    const { page, root } = render();
    // then
    expect(page.field).toBeInstanceOf(FormControl);
    expect(root.querySelectorAll('input[type="text"]').length).toBe(1);
  });

  it('given the catalogue, then a scoped wrapper shows the opposite theme with its own color-scheme', () => {
    // given / when
    const { root } = render();
    const wrapper = root.querySelector('[data-theme="dark"], [data-theme="light"]') as HTMLElement | null;
    // then
    expect(wrapper).not.toBeNull();
    expect(wrapper?.style.colorScheme).toBe(wrapper?.dataset['theme']);
  });

  it.each([
    { name: 'given the field is empty, then no unsaved text is registered', typed: '', unsaved: false },
    { name: 'given text is typed in the field, then the shell sees unsaved text (A-004)', typed: 'rascunho', unsaved: true },
  ])('$name', ({ typed, unsaved }) => {
    // given
    const { page } = render();
    // when
    page.field.setValue(typed);
    // then
    expect(TestBed.inject(UnsavedWork).hasUnsaved()).toBe(unsaved);
  });
});
