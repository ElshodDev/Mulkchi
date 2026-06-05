import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthStore } from '../stores/auth.store';
import { authGuard } from './auth.guard';
import { signal } from '@angular/core';

describe('authGuard', () => {
  let router: Router;
  let authStoreSpy: any;

  beforeEach(() => {
    authStoreSpy = {
      isLoggedIn: signal(false)
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

  it('should return true if user is logged in', () => {
    authStoreSpy.isLoggedIn = signal(true);
    
    const route = new ActivatedRouteSnapshot();
    route.url = [{ path: 'test' } as any];

    const result = TestBed.runInInjectionContext(() => authGuard(route, {} as any));

    expect(result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to login if user is not logged in', () => {
    authStoreSpy.isLoggedIn = signal(false);
    
    const route = new ActivatedRouteSnapshot();
    route.url = [{ path: 'test' } as any, { path: 'route' } as any];

    const result = TestBed.runInInjectionContext(() => authGuard(route, {} as any));

    expect(router.createUrlTree).toHaveBeenCalledWith(
      ['/auth/login'],
      { queryParams: { returnUrl: 'test/route' } }
    );
  });
});
