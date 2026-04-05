import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="flex flex-column align-items-center justify-content-center" style="min-height: 60vh; gap: 1rem;">
      <i class="pi pi-lock" style="font-size: 4rem; color: var(--red-400)"></i>
      <h2>Acceso no autorizado</h2>
      <p class="text-color-secondary">Esta sección requiere permisos de Super Administrador.</p>
      <button pButton label="Volver" icon="pi pi-arrow-left" (click)="goBack()"></button>
    </div>
  `,
})
export class UnauthorizedComponent {
  goBack() { window.location.href = environment.ssoUrl; }
}
