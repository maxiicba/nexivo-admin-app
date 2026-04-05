import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, CardModule],
  template: `
    <div class="flex align-items-center justify-content-center" style="min-height: 100vh; background: var(--surface-ground, #f8fafc);">
      <p-card [style]="{ width: '400px' }">
        <ng-template pTemplate="header">
          <div class="text-center p-4">
            <h2 style="margin: 0; color: var(--primary-color, #6366f1);">Nexivo Admin</h2>
            <p style="color: var(--text-color-secondary, #64748b); margin-top: 0.5rem;">Login de desarrollo</p>
          </div>
        </ng-template>

        <div class="flex flex-column gap-3">
          <div *ngIf="errorMsg" class="p-3 border-round" style="background: #fef2f2; color: #dc2626; font-size: 0.875rem;">
            {{ errorMsg }}
          </div>

          <div class="flex flex-column gap-1">
            <label for="email">Correo electrónico</label>
            <input pInputText id="email" [(ngModel)]="email" placeholder="admin@nexivo.com.ar" class="w-full" />
          </div>

          <div class="flex flex-column gap-1">
            <label for="password">Contraseña</label>
            <input pInputText id="password" type="password" [(ngModel)]="password"
                   placeholder="••••••••" class="w-full" (keyup.enter)="login()" />
          </div>

          <p-button label="Iniciar sesión" [loading]="loading" (onClick)="login()" styleClass="w-full mt-2"></p-button>

          <p style="font-size: 0.75rem; color: var(--text-color-secondary, #94a3b8); text-align: center; margin-top: 0.5rem;">
            Requiere permisos de Super Administrador.<br>En producción el acceso es vía SSO.
          </p>
        </div>
      </p-card>
    </div>
  `,
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  errorMsg = '';

  constructor(private authService: AuthService, private router: Router) {}

  login(): void {
    if (!this.email || !this.password) {
      this.errorMsg = 'Completá todos los campos.';
      return;
    }
    this.loading = true;
    this.errorMsg = '';
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        const user = res.user ?? res;
        this.loading = false;
        if (!user.isSuperAdmin) {
          this.errorMsg = 'Tu usuario no tiene permisos de Super Administrador.';
          return;
        }
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Credenciales inválidas.';
      },
    });
  }
}
