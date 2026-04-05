import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: '', redirectTo: 'subscriptions', pathMatch: 'full' },
      {
        path: 'subscriptions',
        loadComponent: () => import('./subscriptions/gestion-subscriptions.component').then(m => m.GestionSubscriptionsComponent),
      },
      {
        path: 'plans',
        loadComponent: () => import('./plans/gestion-plans.component').then(m => m.GestionPlansComponent),
      },
    ]),
  ],
})
export class NexivoGestionModule {}
