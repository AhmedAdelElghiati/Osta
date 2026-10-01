import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { CraftsmanRegister } from './pages/craftsman-register/craftsman-register';
import { ClientRegister } from './pages/client-register/client-register';
import { CraftsmenGuide } from './pages/craftsmen-guide/craftsmen-guide';
import { ContactUs } from './pages/contact-us/contact-us';
import { HowItWorks } from './pages/how-it-works/how-it-works';
import { JobsMarket } from './pages/jobs-market/jobs-market';
import { CustomerDashboard } from './pages/customer-dashboard/customer-dashboard';
import { CraftsmanDashboardPlaceholder } from './pages/craftsman-dashboard-placeholder/craftsman-dashboard-placeholder';
import { authGuard } from './guards/auth-guard';

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
    path: 'customer-dashboard',
    component: CustomerDashboard,
    canActivate: [authGuard],
    data: { role: 'customer' },
  },
  {
    path: 'craftsman-dashboard',
    component: CraftsmanDashboardPlaceholder,
    canActivate: [authGuard],
    data: { role: 'artisan' },
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
    component: HowItWorks,
  },
  {
    path: 'jobs-market',
    component: JobsMarket,
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
