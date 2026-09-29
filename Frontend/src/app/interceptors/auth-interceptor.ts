import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { Auth } from '../services/auth';

// اتشال الـ Bearer header بالكامل. بقينا بنعتمد على httpOnly cookies
// (accessToken / refreshToken) اللي الباك اند بيحطها، وكل استدعاء في
// auth.ts بيضيف withCredentials صراحة بنفسه.
//
// دلوقتي كمان بيمسك أي 401 (access token expired) لطلب مش خاص بالـ
// auth نفسه، بيحاول يجدد التوكين مرة واحدة عبر /auth/refresh، ولو
// نجحت بيعيد الطلب الأصلي تاني، ولو فشلت بيصفّي حالة اليوزر ويودّيه
// على صفحة الـ login.
const AUTH_ENDPOINTS_TO_SKIP = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const router = inject(Router);

  const isAuthEndpoint = AUTH_ENDPOINTS_TO_SKIP.some((path) => req.url.includes(path));

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthEndpoint) {
        return auth.refresh().pipe(
          switchMap(() => next(req)),
          catchError((refreshError) => {
            auth.clearCurrentUser();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};
