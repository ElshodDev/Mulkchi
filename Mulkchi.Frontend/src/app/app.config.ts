import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, Injectable } from '@angular/core';
import { provideRouter, RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Title } from '@angular/platform-browser';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

// Custom Title Strategy
@Injectable()
class MulkchiTitleStrategy extends TitleStrategy {
  private baseTitle = 'Mulkchi';

  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const title = this.buildTitle(snapshot);
    if (title) {
      this.title.setTitle(`${title} | ${this.baseTitle}`);
    } else {
      this.title.setTitle(`${this.baseTitle} - O'zbekistonda Ko'chmas Mulk`);
    }
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, 
      // Title is handled by custom strategy
    ),
    provideHttpClient(
      withInterceptors([jwtInterceptor, errorInterceptor])
    ),
    provideAnimationsAsync(),
    Title,
    { provide: TitleStrategy, useClass: MulkchiTitleStrategy }
  ]
};
