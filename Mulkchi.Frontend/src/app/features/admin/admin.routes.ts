import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin-dashboard/admin-dashboard.component').then(
        (module) => module.AdminDashboardComponent,
      ),
    title: 'Administrator paneli',
  },
  {
    path: 'announcements',
    loadComponent: () =>
      import('./admin-dashboard/announcements-management.component').then(
        (module) => module.AnnouncementsManagementComponent,
      ),
    title: "E'lonlarni boshqarish",
  },
];
