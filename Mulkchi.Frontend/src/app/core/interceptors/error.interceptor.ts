import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);
  
  return next(req).pipe(
    catchError(error => {
      if (error.status === 401) {
        // Skip if already on logout endpoint to prevent infinite loop
        if (req.url.includes('/logout')) {
          authService.clearAuth();
          return throwError(() => error);
        }
        
        // Skip if this is an auth check endpoint - don't redirect on initial load
        if (req.url.includes('/auth/me')) {
          // Silently clear auth without redirect
          authService.clearAuth();
          return throwError(() => error);
        }
        
        // Unauthorized - token expired or invalid, redirect to login
        authService.clearAuth();
        router.navigate(['/auth/login']);
      }
      
      // Handle 403 Forbidden - Guest users trying to access Host features
      if (error.status === 403) {
        const currentUser = authService.currentUser();
        const userRole = currentUser?.role;
        
        if (userRole === 'Guest') {
          // Show helpful message for Guest users
          snackBar.open(
            'Bu funksiyadan foydalanish uchun Host bo\'lishingiz kerak. Mulk qo\'shish orqali avtomatik tarzda Host bo\'lishingiz mumkin.',
            'Tushundim',
            { duration: 8000, horizontalPosition: 'center' }
          );
        } else {
          snackBar.open(
            'Ruxsat yo\'q: Bu amalni bajarish uchun yetarli huquqlaringiz yo\'q.',
            'Yopish',
            { duration: 5000 }
          );
        }
      }
      
      // Handle 400 Bad Request with validation errors
      if (error.status === 400 && error.error?.message) {
        snackBar.open(
          `So'rov xatosi: ${error.error.message}`,
          'Yopish',
          { duration: 5000 }
        );
      }
      
      // Handle 500 Server Error
      if (error.status === 500) {
        snackBar.open(
          'Server xatosi yuz berdi. Iltimos, keyinroq qayta urinib ko\'ring.',
          'Yopish',
          { duration: 5000 }
        );
      }
      
      return throwError(() => error);
    })
  );
};
