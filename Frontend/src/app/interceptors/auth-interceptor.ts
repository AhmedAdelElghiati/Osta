import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { Auth } from '../services/auth';
import { API_BASE_URL } from '../core/api.config';

// بنعتمد على httpOnly cookies (accessToken / refreshToken)
// فأي طلب رايح للـ API بنضيفله withCredentials تلقائيًا.
//
// لو رجع 401 لطلب مش خاص بالـ auth نفسه، بنحاول نجدد التوكين
// مرة واحدة، وبعدها نعيد الطلب الأصلي.
//
// مهم:
// الـInterceptor مش مسؤول عن تحويل المستخدم للـ Login.
// الـauthGuard هو المسؤول عن حماية الصفحات الخاصة.
// عشان كده لو مفيش User مسجل دخول، نسيب الصفحة العامة زي ما هي.
const AUTH_ENDPOINTS_TO_SKIP = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);

  const isApi = req.url.startsWith(API_BASE_URL);

  const request = isApi && !req.withCredentials ? req.clone({ withCredentials: true }) : req;

  const isAuthEndpoint = AUTH_ENDPOINTS_TO_SKIP.some((path) => request.url.includes(path));

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && isApi && !isAuthEndpoint) {
        return auth.refreshOnce().pipe(
          switchMap(() => next(request)),
          catchError((refreshError) => {
            auth.clearCurrentUser();

            // مفيش router.navigate هنا.
            // الـauthGuard هو اللي يتعامل مع الصفحات المحمية.

            return throwError(() => refreshError);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};
