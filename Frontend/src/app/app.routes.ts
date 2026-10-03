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
import { CustomerDashboard } from './pages/dashboard-customer/customer-dashboard';
import { authGuard } from './guards/auth-guard';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { ResetPassword } from './pages/reset-password/reset-password';
import { Chat } from './pages/chat/chat';
import { UserProfile } from './pages/user-profile/user-profile';
import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';

// Dashboard
import { DashboardLayout } from './pages/dashboard-craftsmen/dashboard-layout/dashboard-layout';
import { Home as DashboardHome } from './pages/dashboard-craftsmen/dashboard-home/dashboard-home';
import { AvailableRequests } from './pages/dashboard-craftsmen/available-requests/available-requests';
import { SentOffers } from './pages/dashboard-craftsmen/sent-offers/sent-offers';
import { MyJobs } from './pages/dashboard-craftsmen/my-jobs/my-jobs';
import { Earnings } from './pages/dashboard-craftsmen/earnings/earnings';
import { Profile } from './pages/dashboard-craftsmen/profile/profile';
import { Settings } from './pages/dashboard-craftsmen/settings/settings';

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
    path: 'admin-dashboard',
    component: AdminDashboard,
    canActivate: [authGuard],
    data: { role: 'admin' },
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

  { path: 'forgot-password', component: ForgotPassword },
  { path: 'reset-password', component: ResetPassword },

  {
    path: 'chat/:jobId',
    component: Chat,
    canActivate: [authGuard],
  },

  {
    path: 'profile',
    component: UserProfile,
    canActivate: [authGuard],
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
      import('./pages/privacy-policy/privacy-policy').then((m) => m.PrivacyPolicy),
  },

  // =========================
  // Not Found
  // =========================

  {
    path: '**',
    redirectTo: '',
  },
];
