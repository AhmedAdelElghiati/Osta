import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { Auth } from '../services/auth';

// Ensures the user is logged in; when the route defines data.role it also
// ensures the role matches (customers can't enter the artisan dashboard
// and vice versa) — otherwise redirects to the correct dashboard.
export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(Auth);
  const router = inject(Router);

  return auth.fetchCurrentUser().pipe(
    map((user) => {
      if (!user) {
        return router.createUrlTree(['/login']);
      }

      const requiredRole = route.data?.['role'];
      if (requiredRole && user.role !== requiredRole) {
        const target =
          user.role === 'artisan'
            ? '/craftsman-dashboard'
            : user.role === 'customer'
              ? '/customer-dashboard'
              : '/';
        return router.createUrlTree([target]);
      }

      return true;
    }),
  );
};
