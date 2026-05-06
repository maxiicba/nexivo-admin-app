import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        redirectTo: 'subscriptions',
        pathMatch: 'full',
      },
      {
        path: 'subscriptions',
        loadComponent: () => import('./subscriptions/turnos-subscriptions.component').then(m => m.TurnosSubscriptionsComponent),
      },
      {
        path: 'subscriptions/:id',
        loadComponent: () => import('./subscription-detail/subscription-detail.component').then(m => m.SubscriptionDetailComponent),
      },
      {
        path: 'plans',
        loadComponent: () => import('./plans/turnos-plans.component').then(m => m.TurnosPlansComponent),
      },
      {
        path: 'metrics',
        loadComponent: () => import('./metrics/turnos-metrics.component').then(m => m.TurnosMetricsComponent),
      },
    ]),
  ],
})
export class NexivoTurnosModule {}
