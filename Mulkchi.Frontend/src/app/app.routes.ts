import { Routes } from '@angular/router';

import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { hostGuard } from './core/guards/host.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [noAuthGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((module) => module.AUTH_ROUTES),
  },
  {
    path: '',
    loadComponent: () =>
      import('./core/layout/layout/layout.component').then((module) => module.LayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home.component').then((module) => module.HomeComponent),
        title: 'Mulkchi - Uy ijarasi',
        data: { preload: true, preloadPriority: 0 },
      },
      {
        path: 'properties',
        loadComponent: () =>
          import('./features/properties/property-list/property-list.component').then(
            (module) => module.PropertyListComponent,
          ),
        title: 'Mulklar',
        data: { preload: true, preloadPriority: 0 },
      },
      {
        path: 'properties/:id',
        loadComponent: () =>
          import('./features/properties/property-detail/property-detail.component').then(
            (module) => module.PropertyDetailComponent,
          ),
        title: 'Mulk tafsilotlari',
      },
      {
        path: 'ai-tools',
        loadComponent: () =>
          import('./features/ai-tools/ai-tools.component').then(
            (module) => module.AiToolsComponent,
          ),
        title: 'AI Yordamchi',
        data: { preload: true, preloadPriority: 1 },
      },
      {
        path: 'market',
        loadComponent: () =>
          import('./features/market/market.component').then((module) => module.MarketComponent),
        title: 'Bozor',
        data: { preload: true, preloadPriority: 1 },
      },
      {
        path: 'subscriptions',
        loadComponent: () =>
          import('./features/subscriptions/subscriptions.component').then(
            (module) => module.SubscriptionsComponent,
          ),
        title: 'Obunalar',
      },
      {
        path: 'ai-recommendations',
        loadComponent: () =>
          import('./features/properties/ai-recommendations/ai-recommendations.component').then(
            (module) => module.AiRecommendationsComponent,
          ),
        title: 'Shaxsiy Tavsiyalar',
      },

      {
        path: 'compare',
        loadComponent: () =>
          import('./features/properties/comparison/comparison.component').then(
            (module) => module.ComparisonComponent,
          ),
        title: 'Taqqoslash',
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/profile/profile.component').then((module) => module.ProfileComponent),
        title: 'Profil',
      },
      {
        path: 'bookings',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/bookings/booking-list/booking-list.component').then(
            (module) => module.BookingListComponent,
          ),
        title: 'Bronlar',
      },
      {
        path: 'favorites',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/favorites/favorites.component').then(
            (module) => module.FavoritesComponent,
          ),
        title: 'Sevimlilar',
      },
      {
        path: 'messages',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/messages/messages.component').then(
            (module) => module.MessagesComponent,
          ),
        title: 'Xabarlar',
      },
      {
        path: 'ai-price',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/ai-price/ai-price.component').then(
            (module) => module.AiPriceComponent,
          ),
        title: 'Narx bashorati',
      },
      {
        path: 'elon-berish',
        canActivate: [authGuard],
        children: [
          {
            path: 'tur',
            loadComponent: () =>
              import('./features/properties/listing-type-select/listing-type-select.component').then(
                (module) => module.ListingTypeSelectComponent,
              ),
            title: "E'lon turi tanlash",
          },
          {
            path: ':type',
            canDeactivate: [unsavedChangesGuard],
            loadComponent: () =>
              import('./features/properties/property-form/property-form.component').then(
                (module) => module.PropertyFormComponent,
              ),
            title: "Yangi e'lon",
          },
        ],
      },
      {
        path: 'listings/create',
        canActivate: [authGuard],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./features/properties/property-form/property-form.component').then(
            (module) => module.PropertyFormComponent,
          ),
        title: "Yangi e'lon",
      },
      {
        path: 'host',
        canActivate: [authGuard, hostGuard],
        loadChildren: () =>
          import('./features/host/host.routes').then((module) => module.HOST_ROUTES),
        title: 'Mezbon paneli',
      },
      {
        path: 'admin',
        canActivate: [authGuard, adminGuard],
        loadChildren: () =>
          import('./features/admin/admin.routes').then((module) => module.ADMIN_ROUTES),
      },
      {
        path: 'admin-panel',
        redirectTo: 'admin',
        pathMatch: 'full',
      },
      {
        path: 'admin-dashboard',
        redirectTo: 'admin',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./features/errors/forbidden/forbidden.component').then(
        (module) => module.ForbiddenComponent,
      ),
    title: 'Ruxsat yo‘q',
  },
  {
    path: 'server-error',
    loadComponent: () =>
      import('./features/errors/server-error/server-error.component').then(
        (module) => module.ServerErrorComponent,
      ),
    title: 'Server xatosi',
  },
  {
    path: 'not-found',
    loadComponent: () =>
      import('./features/errors/not-found/not-found.component').then(
        (module) => module.NotFoundComponent,
      ),
    title: 'Sahifa topilmadi',
  },
  {
    path: '**',
    redirectTo: 'not-found',
  },
];
