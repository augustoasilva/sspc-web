// Spec for the placeholder home (US4, T088, research G2): name, provisional message, no primary action.
import { TestBed } from '@angular/core/testing';
import { HomePage } from './home';

describe('HomePage', () => {
  it.each([
    {
      name: 'given the home page, then it shows the name SSPC Studio',
      text: 'SSPC Studio',
    },
    {
      name: 'given the home page, then it shows the provisional message',
      text: 'Em breve, o seu caderno de campo vai morar aqui.',
    },
  ])('$name', ({ text }) => {
    // given / when
    TestBed.configureTestingModule({ imports: [HomePage] });
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    // then
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(text);
  });

  it('given the home page, then it has no primary action', () => {
    // given / when
    TestBed.configureTestingModule({ imports: [HomePage] });
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    // then
    expect((fixture.nativeElement as HTMLElement).querySelector('button, a[sspc-button]')).toBeNull();
  });
});
