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
      {
        path: 'panel-admin',
        loadComponent: () => import('./panel-admin/panel-admin.component').then(m => m.PanelAdminComponent),
      },
      {
        path: 'accounts',
        loadComponent: () => import('./accounts/accounts.component').then(m => m.AccountsComponent),
      },
    ]),
  ],
})
export class NexivoGestionModule {}
