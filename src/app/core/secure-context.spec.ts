// Table-driven spec for SecureContext (data-model §SecureContext, SEC-001). The browser's
// isSecureContext is stubbed per case; undefined (jsdom, very old browsers) counts as insecure.
import { TestBed } from '@angular/core/testing';
import { SecureContext } from './secure-context';

const INSECURE_MESSAGE = 'Conexão insegura. Abra o endereço HTTPS confiável para instalar e usar offline.';

function setIsSecureContext(value: boolean | undefined): void {
  if (value === undefined) {
    Reflect.deleteProperty(globalThis, 'isSecureContext');
  } else {
    Object.defineProperty(globalThis, 'isSecureContext', { configurable: true, value });
  }
}

describe('SecureContext', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'isSecureContext');
  });

  it.each([
    {
      name: 'given a secure origin, when the service is created, then secure is true and there is no message',
      input: true,
      output: { secure: true, message: '' },
    },
    {
      name: 'given an insecure origin, when the service is created, then secure is false and the message is the HTTPS notice',
      input: false,
      output: { secure: false, message: INSECURE_MESSAGE },
    },
    {
      name: 'given isSecureContext is absent (jsdom, very old browser), then it counts as insecure with the HTTPS notice',
      input: undefined,
      output: { secure: false, message: INSECURE_MESSAGE },
    },
  ])('$name', ({ input, output }) => {
    // given
    setIsSecureContext(input);
    // when
    const context = TestBed.inject(SecureContext);
    // then
    expect(context.secure).toBe(output.secure);
    expect(context.message).toBe(output.message);
  });
});
