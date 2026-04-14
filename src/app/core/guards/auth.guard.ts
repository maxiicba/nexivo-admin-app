import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const cachedUser = authService.getCurrentUser();
  if (authService.isLoggedIn() && cachedUser) {
    if (!cachedUser.isSuperAdmin) return router.parseUrl('/unauthorized');
    return true;
  }

  const redirectToLogin = () => {
    if (environment.localLogin) {
      return router.parseUrl('/login');
    }
    const fullReturnUrl = `${environment.appUrl}${state.url}`;
    window.location.href = `${environment.ssoUrl}/login?returnUrl=${encodeURIComponent(fullReturnUrl)}`;
    return false;
  };

  return authService.checkAuthStatus().pipe(
    map(user => {
      if (!user) return redirectToLogin();
      if (!user.isSuperAdmin) return router.parseUrl('/unauthorized');
      return true;
    }),
    catchError(() => {
      if (environment.localLogin) return of(router.parseUrl('/login'));
      const fullReturnUrl = `${environment.appUrl}/`;
      window.location.href = `${environment.ssoUrl}/login?returnUrl=${encodeURIComponent(fullReturnUrl)}`;
      return of(false);
    }),
  );
};
