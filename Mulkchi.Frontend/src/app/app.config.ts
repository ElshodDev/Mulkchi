import {
  ApplicationConfig,
  inject,
  Injectable,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  provideRouter,
  RouterStateSnapshot,
  TitleStrategy,
  withPreloading,
  withViewTransitions,
} from '@angular/router';
import { Title, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { cacheInterceptor } from './core/interceptors/cache.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { SelectivePreloadingStrategy } from './core/strategies/selective-preloading.strategy';

@Injectable()
class MulkchiTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly baseTitle = 'Mulkchi';

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot);

    if (pageTitle) {
      this.title.setTitle(`${pageTitle} | ${this.baseTitle}`);
      return;
    }

    this.title.setTitle(`${this.baseTitle} - O'zbekistonda ko'chmas mulk`);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withPreloading(SelectivePreloadingStrategy), withViewTransitions()),
    provideHttpClient(
      withInterceptors([authInterceptor, cacheInterceptor, loadingInterceptor, errorInterceptor]),
    ),
    provideAnimationsAsync(),
    { provide: TitleStrategy, useClass: MulkchiTitleStrategy }, provideClientHydration(withEventReplay()),
  ],
};
