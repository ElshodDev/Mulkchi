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
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
        title: 'Kirish'
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
        title: 'Ro\'yxatdan o\'tish'
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
        title: 'Parolni tiklash'
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
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
        title: 'Bosh sahifa'
      },
      {
        path: 'properties',
        loadComponent: () => import('./features/properties/property-list/property-list.component').then(m => m.PropertyListComponent),
        title: 'E\'lonlar'
      },
      {
        path: 'properties/:id',
        loadComponent: () => import('./features/properties/property-detail/property-detail.component').then(m => m.PropertyDetailComponent),
        title: 'E\'lon tafsilotlari'
      },
      {
        path: 'ai-recommendations',
        loadComponent: () => import('./features/properties/ai-recommendations/ai-recommendations.component').then(m => m.AiRecommendationsComponent),
        title: 'AI Tavsiyalar'
      },
      {
        path: 'market-analytics',
        loadComponent: () => import('./features/market-analytics/market-analytics.component').then(m => m.MarketAnalyticsComponent),
        title: 'Bozor tahlili'
      },
      {
        path: 'compare',
        loadComponent: () => import('./features/properties/property-compare/property-compare.component').then(m => m.PropertyCompareComponent),
        title: 'Solishtirish'
      },
      
      // Protected routes (Guest)
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
        title: 'Profil'
      },
      {
        path: 'bookings',
        canActivate: [authGuard],
        loadComponent: () => import('./features/bookings/booking-list/booking-list.component').then(m => m.BookingListComponent),
        title: 'Bronlar'
      },
      {
        path: 'favorites',
        canActivate: [authGuard],
        loadComponent: () => import('./features/favorites/favorites.component').then(m => m.FavoritesComponent),
        title: 'Sevimlilar'
      },
      {
        path: 'messages',
        canActivate: [authGuard],
        loadComponent: () => import('./features/messages/messages.component').then(m => m.MessagesComponent),
        title: 'Xabarlar'
      },
      {
        path: 'ai-price',
        canActivate: [authGuard],
        loadComponent: () => import('./features/ai-price/ai-price.component').then(m => m.AiPriceComponent),
        title: 'Narx bashorati'
      },

      // Seamless listing creation: Any authenticated user can create listings
      // Backend auto-upgrades them to Host role on first property creation
      {
        path: 'listings/create',
        canActivate: [authGuard], // Only auth check, no hostGuard required
        loadComponent: () => import('./features/properties/property-form/property-form.component').then(m => m.PropertyFormComponent),
        title: 'Yangi e\'lon qo\'shish'
      },

      // Protected routes (Host)
      {
        path: 'host',
        canActivate: [authGuard, hostGuard],
        title: 'Mezbon paneli',
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
            loadComponent: () => import('./features/host/host-properties/host-properties.component').then(m => m.HostPropertiesComponent),
            title: 'Mening e\'lonlarim'
          },
          {
            path: 'properties/create',
            loadComponent: () => import('./features/properties/property-form/property-form.component').then(m => m.PropertyFormComponent),
            title: 'E\'lon yaratish'
          },
          {
            path: 'properties/edit/:id',
            loadComponent: () => import('./features/properties/property-form/property-form.component').then(m => m.PropertyFormComponent),
            title: 'E\'lonni tahrirlash'
          },
          {
            path: 'bookings',
            loadComponent: () => import('./features/host/host-bookings/host-bookings.component').then(m => m.HostBookingsComponent),
            title: 'Mezbon bronlari'
          }
        ]
      },
      
      // Admin routes
      {
        path: 'admin',
        canActivate: [authGuard, adminGuard],
        loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        title: 'Administrator paneli'
      }
    ]
  },
  
  // 404
  {
    path: '**',
    loadComponent: () => import('./features/errors/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Sahifa topilmadi'
  }
];
