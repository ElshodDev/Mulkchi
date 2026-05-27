import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

interface NavigatorConnection {
  saveData?: boolean;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
}

@Injectable({ providedIn: 'root' })
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  private readonly preloadDelay = 2000;
  private readonly preloadedModules: string[] = [];

  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (route.data && route.data['preload']) {
      const priority = route.data['preloadPriority'] || 1;
      const delay = route.data['preloadDelay'] || this.preloadDelay;

      if (priority === 0) {
        this.log(route);
        return load();
      }

      if (priority === 1) {
        this.log(route);
        return timer(delay).pipe(mergeMap(() => load()));
      }

      if (priority === 2 && this.shouldPreload()) {
        this.log(route);
        return timer(delay * 2).pipe(mergeMap(() => load()));
      }
    }

    return of(null);
  }

  private shouldPreload(): boolean {
    if ('connection' in navigator) {
      const connection = (navigator as Navigator & { connection?: NavigatorConnection }).connection;

      if (connection) {
        if (connection.saveData) {
          return false;
        }

        if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
          return false;
        }
      }
    }

    return true;
  }

  private log(route: Route): void {
    if (route.path) {
      this.preloadedModules.push(route.path);
    }
  }

  getPreloadedModules(): string[] {
    return this.preloadedModules;
  }
}
