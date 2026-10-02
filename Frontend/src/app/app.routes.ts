

import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { CraftsmanRegister } from './pages/craftsman-register/craftsman-register';
import { ClientRegister } from './pages/client-register/client-register';
import { CraftsmenGuide } from './pages/craftsmen-guide/craftsmen-guide';
import { ContactUs } from './pages/contact-us/contact-us';
import { JobsMarket } from './pages/jobs-market/jobs-market';
import { HowItWorks } from './pages/how-it-works/how-it-works';
import { Developers } from './pages/developers/developers';
import { CustomerDashboard } from './pages/customer-dashboard/customer-dashboard';
import { authGuard } from './guards/auth-guard';

// Dashboard
import { DashboardLayout } from './dashboard/dashboard-layout/dashboard-layout';
import { Home as DashboardHome } from './dashboard/dashboard-home/dashboard-home';
import { AvailableRequests } from './dashboard/available-requests/available-requests';
import { SentOffers } from './dashboard/sent-offers/sent-offers';
import { MyJobs } from './dashboard/my-jobs/my-jobs';
import { Earnings } from './dashboard/earnings/earnings';
import { Profile } from './dashboard/profile/profile';
import { Settings } from './dashboard/settings/settings';


export const routes: Routes = [

  // =========================
  // Website
  // =========================

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
    redirectTo: 'dashboard/home',
    pathMatch: 'full',
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
  },{
  path: 'developers',
  component: Developers,
},


  // =========================
  // Dashboard
  // =========================

  {
    path: 'dashboard',
    component: DashboardLayout,
    canActivate: [authGuard],
    data: { role: 'artisan' },

    children: [

      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },

      {
        path: 'home',
        component: DashboardHome,
      },

      {
        path: 'available-requests',
        component: AvailableRequests,
      },

      {
        path: 'sent-offers',
        component: SentOffers,
      },

      {
        path: 'my-jobs',
        component: MyJobs,
      },

      {
        path: 'earnings',
        component: Earnings,
      },

      {
        path: 'profile',
        component: Profile,
      },

      {
        path: 'settings',
        component: Settings,
      },

    ],
  },


  // =========================
  // Privacy
  // =========================

  {
    path: 'privacy-policy',

    loadComponent: () =>
      import('./pages/privacy-policy/privacy-policy')
        .then((m) => m.PrivacyPolicy),
  },


  // =========================
  // Not Found
  // =========================

  {
    path: '**',
    redirectTo: '',
  },

];
