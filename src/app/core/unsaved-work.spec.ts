// Table-driven spec for UnsavedWork (data-model §UnsavedWork, spec A-004). A source registers a
// dirty signal while it holds text the shell did not save, and unregisters when it is destroyed.
import { DestroyRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UnsavedWork } from './unsaved-work';

// A DestroyRef whose callbacks the test runs by hand, as a component does on destroy.
function fakeDestroyRef(): DestroyRef & { destroy: () => void } {
  const callbacks: (() => void)[] = [];
  return {
    onDestroy: (fn: () => void) => callbacks.push(fn),
    destroy: () => callbacks.forEach((fn) => fn()),
  } as unknown as DestroyRef & { destroy: () => void };
}

describe('UnsavedWork', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it.each([
    {
      name: 'given no source is registered, then hasUnsaved is false',
      input: { sources: [] as boolean[] },
      output: false,
    },
    {
      name: 'given one registered source is dirty, then hasUnsaved is true',
      input: { sources: [true] },
      output: true,
    },
    {
      name: 'given every registered source is clean, then hasUnsaved is false',
      input: { sources: [false, false] },
      output: false,
    },
    {
      name: 'given one of two sources is dirty, then hasUnsaved is true',
      input: { sources: [false, true] },
      output: true,
    },
  ])('$name', ({ input, output }) => {
    // given
    const work = TestBed.inject(UnsavedWork);
    for (const dirty of input.sources) {
      work.track(signal(dirty), fakeDestroyRef());
    }
    // when / then
    expect(work.hasUnsaved()).toBe(output);
  });

  it('given a dirty source, when it is destroyed, then hasUnsaved becomes false', () => {
    // given
    const work = TestBed.inject(UnsavedWork);
    const destroyRef = fakeDestroyRef();
    work.track(signal(true), destroyRef);
    expect(work.hasUnsaved()).toBe(true);
    // when
    destroyRef.destroy();
    // then
    expect(work.hasUnsaved()).toBe(false);
  });

  it('given a source is dirty, when its text is saved, then hasUnsaved becomes false', () => {
    // given
    const work = TestBed.inject(UnsavedWork);
    const dirty = signal(true);
    work.track(dirty, fakeDestroyRef());
    // when
    dirty.set(false);
    // then
    expect(work.hasUnsaved()).toBe(false);
  });
});
