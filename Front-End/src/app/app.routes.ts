import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { CraftsmanRegister } from './pages/craftsman-register/craftsman-register';
import { ClientRegister } from './pages/client-register/client-register';

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
    path: '**',
    redirectTo: '',
  },
];
