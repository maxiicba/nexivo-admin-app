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
        path: 'plans',
        loadComponent: () => import('./plans/turnos-plans.component').then(m => m.TurnosPlansComponent),
      },
    ]),
  ],
})
export class NexivoTurnosModule {}
