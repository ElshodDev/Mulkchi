import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { hostGuard } from './core/guards/host.guard';

export const routes: Routes = [
  // Auth routes (without layout)
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
      }
    ]
  },
  
  // Main layout routes
  {
    path: '',
    loadComponent: () => import('./core/layout/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      // Public routes
      {
        path: '',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'properties',
        loadComponent: () => import('./features/properties/property-list/property-list.component').then(m => m.PropertyListComponent)
      },
      {
        path: 'properties/:id',
        loadComponent: () => import('./features/properties/property-detail/property-detail.component').then(m => m.PropertyDetailComponent)
      },
      {
        path: 'ai-recommendations',
        loadComponent: () => import('./features/properties/ai-recommendations/ai-recommendations.component').then(m => m.AiRecommendationsComponent)
      },
      
      // Protected routes (Guest)
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'bookings',
        canActivate: [authGuard],
        loadComponent: () => import('./features/bookings/booking-list/booking-list.component').then(m => m.BookingListComponent)
      },
      {
        path: 'favorites',
        canActivate: [authGuard],
        loadComponent: () => import('./features/favorites/favorites.component').then(m => m.FavoritesComponent)
      },
      {
        path: 'messages',
        canActivate: [authGuard],
        loadComponent: () => import('./features/messages/messages.component').then(m => m.MessagesComponent)
      },
      {
        path: 'ai-price',
        canActivate: [authGuard],
        loadComponent: () => import('./features/ai-price/ai-price.component').then(m => m.AiPriceComponent)
      },

      // Protected routes (Host)
      {
        path: 'host',
        canActivate: [authGuard, hostGuard],
        children: [
          {
            path: '',
            redirectTo: 'properties',
            pathMatch: 'full'
          },
          {
            path: 'dashboard',
            redirectTo: 'properties',
            pathMatch: 'full'
          },
          {
            path: 'properties',
            loadComponent: () => import('./features/host/host-properties/host-properties.component').then(m => m.HostPropertiesComponent)
          },
          {
            path: 'properties/create',
            loadComponent: () => import('./features/properties/property-form/property-form.component').then(m => m.PropertyFormComponent)
          },
          {
            path: 'properties/edit/:id',
            loadComponent: () => import('./features/properties/property-form/property-form.component').then(m => m.PropertyFormComponent)
          },
          {
            path: 'bookings',
            loadComponent: () => import('./features/host/host-bookings/host-bookings.component').then(m => m.HostBookingsComponent)
          }
        ]
      },
      
      // Admin routes
      {
        path: 'admin',
        canActivate: [authGuard, adminGuard],
        loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      }
    ]
  },
  
  // 404
  {
    path: '**',
    loadComponent: () => import('./features/errors/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
