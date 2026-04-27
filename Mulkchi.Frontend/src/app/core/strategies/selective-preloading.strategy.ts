import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

/**
 * Selective Preloading Strategy
 * Preloads modules based on priority after a delay
 */
@Injectable({ providedIn: 'root' })
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  private preloadDelay = 2000; // 2 seconds delay before preloading
  private preloadedModules: string[] = [];

  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Check if route has data with preload flag
    if (route.data && route.data['preload']) {
      const priority = route.data['preloadPriority'] || 1;
      const delay = route.data['preloadDelay'] || this.preloadDelay;

      // High priority routes preload immediately
      if (priority === 0) {
        this.log(route, 'immediate');
        return load();
      }

      // Medium priority routes preload after delay
      if (priority === 1) {
        this.log(route, `delayed ${delay}ms`);
        return timer(delay).pipe(
          mergeMap(() => load())
        );
      }

      // Low priority routes - only preload if connection is good
      if (priority === 2 && this.shouldPreload()) {
        this.log(route, 'low priority');
        return timer(delay * 2).pipe(
          mergeMap(() => load())
        );
      }
    }

    // Don't preload
    return of(null);
  }

  /**
   * Check if we should preload based on connection
   */
  private shouldPreload(): boolean {
    // Check if user prefers reduced data
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      // Don't preload on slow connections
      if (connection) {
        // Save Data mode is on
        if (connection.saveData) {
          return false;
        }
        
        // Slow connection (2G or slow 2G)
        if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
          return false;
        }
      }
    }

    // Check battery status (if available)
    if ('getBattery' in navigator) {
      // Defer to actual battery check in real implementation
      // For now, we assume it's OK
    }

    return true;
  }

  /**
   * Track preloaded module
   */
  private log(route: Route, strategy: string): void {
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

/**
 * Quicklink Preloading Strategy
 * Preloads routes when they are likely to be navigated to
 */
@Injectable({ providedIn: 'root' })
export class QuicklinkStrategy implements PreloadingStrategy {
  private preloadedModules: string[] = [];

  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Only preload if link is in viewport
    if (this.hasVisibleLink(route.path)) {
      this.logQuicklink(route);
      return load();
    }

    return of(null);
  }

  /**
   * Check if there's a visible link to this route
   */
  private hasVisibleLink(path: string | undefined): boolean {
    if (!path) return false;

    // Check if any links to this route are in viewport
    const links = document.querySelectorAll(`a[href^="/${path}"]`);
    
    for (let i = 0; i < links.length; i++) {
      if (this.isInViewport(links[i])) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if element is in viewport
   */
  private isInViewport(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Quicklink specific tracking
   */
  private logQuicklink(route: Route): void {
    if (route.path) {
      this.preloadedModules.push(route.path);
    }
  }
}
