import { Routes } from '@angular/router';

import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const HOST_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'properties',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./host-dashboard/host-dashboard.component').then(
        (module) => module.HostDashboardComponent,
      ),
    title: "Kengaytirilgan Analitika",
  },
  {
    path: 'properties',
    loadComponent: () =>
      import('./host-properties/host-properties.component').then(
        (module) => module.HostPropertiesComponent,
      ),
    title: "Mening e'lonlarim",
  },
  {
    path: 'properties/create',
    loadComponent: () =>
      import('../properties/property-form/property-form.component').then(
        (module) => module.PropertyFormComponent,
      ),
    title: "E'lon yaratish",
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'properties/edit/:id',
    loadComponent: () =>
      import('../properties/property-form/property-form.component').then(
        (module) => module.PropertyFormComponent,
      ),
    title: "E'lonni tahrirlash",
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'bookings',
    loadComponent: () =>
      import('./host-bookings/host-bookings.component').then(
        (module) => module.HostBookingsComponent,
      ),
    title: 'Mezbon bronlari',
  },
];
