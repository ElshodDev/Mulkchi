import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthStore } from '../stores/auth.store';
import { hostGuard } from './host.guard';
import { signal } from '@angular/core';
import { UserRole } from '../models';

describe('hostGuard', () => {
  let router: Router;
  let authStoreSpy: any;

  beforeEach(() => {
    authStoreSpy = {
      isLoggedIn: signal(false),
      currentUser: signal(null),
      currentMode: signal(UserRole.Guest)
    };

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: AuthStore, useValue: authStoreSpy }
      ]
    });

    router = TestBed.inject(Router);
    spyOn(router, 'createUrlTree').and.callThrough();
  });

  it('should redirect to login if not authenticated', () => {
    authStoreSpy.isLoggedIn = signal(false);
    
    const route = new ActivatedRouteSnapshot();
    route.url = [{ path: 'host' } as any];

    const result = TestBed.runInInjectionContext(() => hostGuard(route, {} as any));

    expect(router.createUrlTree).toHaveBeenCalledWith(
      ['/auth/login'],
      { queryParams: { returnUrl: 'host' } }
    );
  });

  it('should allow access if current mode is Host', () => {
    authStoreSpy.isLoggedIn = signal(true);
    authStoreSpy.currentUser = signal({ role: UserRole.Guest });
    authStoreSpy.currentMode = signal(UserRole.Host);

    const route = new ActivatedRouteSnapshot();
    const result = TestBed.runInInjectionContext(() => hostGuard(route, {} as any));

    expect(result).toBe(true);
  });

  it('should allow access if user role is Host', () => {
    authStoreSpy.isLoggedIn = signal(true);
    authStoreSpy.currentUser = signal({ role: UserRole.Host });
    authStoreSpy.currentMode = signal(UserRole.Guest);

    const route = new ActivatedRouteSnapshot();
    const result = TestBed.runInInjectionContext(() => hostGuard(route, {} as any));

    expect(result).toBe(true);
  });

  it('should allow access if user role is Admin', () => {
    authStoreSpy.isLoggedIn = signal(true);
    authStoreSpy.currentUser = signal({ role: UserRole.Admin });
    authStoreSpy.currentMode = signal(UserRole.Guest);

    const route = new ActivatedRouteSnapshot();
    const result = TestBed.runInInjectionContext(() => hostGuard(route, {} as any));

    expect(result).toBe(true);
  });

  it('should redirect to forbidden if user does not have host privileges', () => {
    authStoreSpy.isLoggedIn = signal(true);
    authStoreSpy.currentUser = signal({ role: UserRole.Guest });
    authStoreSpy.currentMode = signal(UserRole.Guest);

    const route = new ActivatedRouteSnapshot();
    const result = TestBed.runInInjectionContext(() => hostGuard(route, {} as any));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/forbidden']);
  });
});
