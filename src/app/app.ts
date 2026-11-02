import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { LucideWifi, LucideWifiOff } from '@lucide/angular';
import { filter, map } from 'rxjs';
import { Connectivity } from './core/connectivity';
import { SecureContext } from './core/secure-context';
import { SspcAppBar } from './ui/app-bar/app-bar';
import { SspcBanner } from './ui/banner/banner';
import { SspcStatusChip } from './ui/status-chip/status-chip';
import { SspcTabBar, TabItem } from './ui/tab-bar/tab-bar';

// The shell: app bar with the connection chip, a banner slot under it (the insecure-connection
// notice on plain HTTP), the routed page, and the bottom tab bar. The title and the back
// control come from route data.
@Component({
  selector: 'sspc-root',
  imports: [RouterOutlet, LucideWifi, LucideWifiOff, SspcAppBar, SspcBanner, SspcStatusChip, SspcTabBar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly connectivity = inject(Connectivity);
  protected readonly secureContext = inject(SecureContext);
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly title = computed(() => this.readRouteData('title', 'SSPC Studio'));
  protected readonly showBack = computed(() => this.readRouteData('back', false));
  protected readonly activeId = computed(() => (this.url().startsWith('/sobre') ? 'about' : 'home'));

  protected readonly tabs: TabItem[] = [
    { id: 'home', label: 'Início', path: '/', icon: 'house' },
    { id: 'about', label: 'Perfil', path: '/sobre', icon: 'user' },
  ];

  // Reads a route data key from the deepest route that sets it. Reading the url signal
  // makes the computed value refresh after each navigation.
  private readRouteData<T>(key: string, fallback: T): T {
    this.url();
    let found: T | undefined;
    let node: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;
    while (node) {
      if (node.data[key] !== undefined) found = node.data[key] as T;
      node = node.firstChild;
    }
    return found ?? fallback;
  }

  protected navigate(id: string): void {
    void this.router.navigateByUrl(id === 'about' ? '/sobre' : '/');
  }

  protected goBack(): void {
    void this.router.navigateByUrl('/');
  }
}
