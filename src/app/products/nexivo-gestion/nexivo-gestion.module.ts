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
      {
        path: 'subscription-management',
        loadComponent: () => import('./subscription-management/subscription-management.component').then(m => m.SubscriptionManagementComponent),
      },
      {
        path: 'api-keys',
        loadComponent: () => import('./api-keys/api-keys.component').then(m => m.ApiKeysComponent),
      },
      { path: 'referrals', loadComponent: () => import('./referrals/referrals.component').then(m => m.ReferralsComponent) },
      { path: 'notifications', loadComponent: () => import('./notifications/notifications.component').then(m => m.NotificationsComponent) },
      { path: 'demos', loadComponent: () => import('./demos/demos.component').then(m => m.DemosComponent) },
    ]),
  ],
})
export class NexivoGestionModule {}
