import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: '', redirectTo: 'subscriptions', pathMatch: 'full' },
    ]),
  ],
})
export class NexivoTurnosModule {}
