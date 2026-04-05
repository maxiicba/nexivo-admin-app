import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.getCurrentUser()) return true;

  return authService.checkAuthStatus().pipe(
    map(user => {
      if (!user) {
        window.location.href = `${environment.ssoUrl}/login?returnUrl=${encodeURIComponent(window.location.href)}`;
        return false;
      }
      if (!user.isSuperAdmin) return router.parseUrl('/unauthorized');
      return true;
    }),
    catchError(() => {
      window.location.href = `${environment.ssoUrl}/login`;
      return of(false);
    }),
  );
};
