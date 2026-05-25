import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

interface NavigatorConnection {
  saveData?: boolean;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
}

/**
 * Selective Preloading Strategy
 * Preloads modules based on priority after a delay
 */
@Injectable({ providedIn: 'root' })
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  private readonly preloadDelay = 2000;
  private readonly preloadedModules: string[] = [];

  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    // Check if route has data with preload flag
    if (route.data && route.data['preload']) {
      const priority = route.data['preloadPriority'] || 1;
      const delay = route.data['preloadDelay'] || this.preloadDelay;

      // High priority routes preload immediately
      if (priority === 0) {
        this.log(route);
        return load();
      }

      // Medium priority routes preload after delay
      if (priority === 1) {
        this.log(route);
        return timer(delay).pipe(mergeMap(() => load()));
      }

      // Low priority routes - only preload if connection is good
      if (priority === 2 && this.shouldPreload()) {
        this.log(route);
        return timer(delay * 2).pipe(mergeMap(() => load()));
      }
    }

    // Don't preload
    return of(null);
  }

  /**
   * Check if we should preload based on connection
   */
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

  /**
   * Track preloaded module
   */
  private log(route: Route): void {
    if (route.path) {
      this.preloadedModules.push(route.path);
    }
  }

  /**
   * Get list of preloaded modules
   */
  getPreloadedModules(): string[] {
    return this.preloadedModules;
  }
}
