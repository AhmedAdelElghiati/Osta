import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { Auth } from '../services/auth';

const homeFor = (role: string) =>
  role === 'artisan' ? '/dashboard/home' : role === 'customer' ? '/customer-dashboard' : role === 'admin' ? '/admin-dashboard' : '/';

// Ensures the user is logged in; when the route defines data.role it also
// ensures the role matches (customers can't enter the artisan dashboard
// and vice versa) — otherwise redirects to the correct dashboard.
export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const cachedUser = auth.currentUserValue;

  if (cachedUser) {
    const requiredRole = route.data?.['role'];
    if (requiredRole && cachedUser.role !== requiredRole) {
      return router.createUrlTree([homeFor(cachedUser.role)]);
    }
    return true;
  }

  return auth.fetchCurrentUser().pipe(
    map((user) => {
      if (!user) {
        return router.createUrlTree(['/login']);
      }

      const requiredRole = route.data?.['role'];
      if (requiredRole && user.role !== requiredRole) {
        return router.createUrlTree([homeFor(user.role)]);
      }

      return true;
    }),
  );
};
