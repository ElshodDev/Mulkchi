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
    loadComponent: () =>
      import('./register/register.component').then((module) => module.RegisterComponent),
    title: "Ro'yxatdan o'tish",
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
