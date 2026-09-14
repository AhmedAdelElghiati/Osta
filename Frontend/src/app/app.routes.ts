import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { CraftsmanRegister } from './pages/craftsman-register/craftsman-register';
import { ClientRegister } from './pages/client-register/client-register';
import { CraftsmenGuide } from './pages/craftsmen-guide/craftsmen-guide';
import { ContactUs } from './pages/contact-us/contact-us';

export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'register',
    redirectTo: 'client-register',
    pathMatch: 'full',
  },
  {
    path: 'craftsman-register',
    component: CraftsmanRegister,
  },
  {
    path: 'client-register',
    component: ClientRegister,
  },
  {
    path: 'craftsmen-guide',
    component: CraftsmenGuide,
  },
  {
    path: 'contact-us',
    component: ContactUs,
  },
  {
    path: 'how-it-works',
    redirectTo: '',
  },
  {
    path: 'jobs-market',
    redirectTo: '',
  },
  {
    path: 'privacy-policy',
    loadComponent: () =>
      import('./pages/privacy-policy/privacy-policy').then((m) => m.PrivacyPolicy),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
