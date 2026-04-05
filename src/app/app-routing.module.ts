import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppLayoutComponent } from './layout/app.layout.component';
import { authGuard } from './core/guards/auth.guard';

@NgModule({
  imports: [
    RouterModule.forRoot([
      {
        path: '',
        component: AppLayoutComponent,
        canActivate: [authGuard],
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
          },
          {
            path: 'products/nexivo-gestion',
            loadChildren: () => import('./products/nexivo-gestion/nexivo-gestion.module').then(m => m.NexivoGestionModule),
          },
          {
            path: 'products/nexivo-turnos',
            loadChildren: () => import('./products/nexivo-turnos/nexivo-turnos.module').then(m => m.NexivoTurnosModule),
          },
          {
            path: 'unauthorized',
            loadComponent: () => import('./pages/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent),
          },
        ],
      },
      { path: '**', redirectTo: '' },
    ])
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
