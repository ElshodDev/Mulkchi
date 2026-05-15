import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then((module) => module.LoginComponent),
    title: 'Kirish',
  },
  {
    path: 'register',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./forgot-password/forgot-password.component').then(
        (module) => module.ForgotPasswordComponent,
      ),
    title: 'Parolni tiklash',
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
];
