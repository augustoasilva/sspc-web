// Secure-origin state (data-model §SecureContext, SEC-001). The service worker and offline use
// need a secure context: HTTPS, or loopback. Plain HTTP shows the notice instead. An absent
// isSecureContext (jsdom, very old browsers) counts as insecure.
import { Injectable } from '@angular/core';

export const INSECURE_CONNECTION_MESSAGE =
  'Conexão insegura. Abra o endereço HTTPS confiável para instalar e usar offline.';

export function isSecureOrigin(): boolean {
  return globalThis.isSecureContext === true;
}

@Injectable({ providedIn: 'root' })
export class SecureContext {
  readonly secure: boolean = isSecureOrigin();
  readonly message: string = this.secure ? '' : INSECURE_CONNECTION_MESSAGE;
}
