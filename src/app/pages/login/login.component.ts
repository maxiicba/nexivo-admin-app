import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, SessionConflictResponse, isSessionConflict } from '../../core/services/auth.service';
import { deviceKindLabel, deviceLabel } from '../../core/utils/device-label.util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="nx-login-bg">
      <div class="nx-login-blob nx-login-blob--1"></div>
      <div class="nx-login-blob nx-login-blob--2"></div>
      <div class="nx-login-blob nx-login-blob--3"></div>

      <div class="nx-login-card nx-animate-fade-up">
        <div class="nx-login-brand">
          <div class="nx-login-logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#5B5FF7"/>
              <rect x="8" y="10" width="16" height="3" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="8" y="14.5" width="10" height="3" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="8" y="19" width="16" height="3" rx="1.5" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <div class="nx-login-brand-text">
            <span class="nx-login-brand-name">Nexivo Admin</span>
            <span class="nx-login-brand-subtitle">Panel de administración</span>
          </div>
        </div>

        <div *ngIf="errorMsg" class="nx-login-error">
          <i class="pi pi-exclamation-circle"></i>
          {{ errorMsg }}
        </div>

        <form class="nx-login-form" (ngSubmit)="login()">
          <div class="nx-login-field">
            <label class="nx-login-label" for="email">Correo electrónico</label>
            <input
              class="nx-login-input"
              id="email"
              type="email"
              [(ngModel)]="email"
              name="email"
              placeholder="admin@nexivo.com.ar"
              autocomplete="email"
            />
          </div>

          <div class="nx-login-field">
            <label class="nx-login-label" for="password">Contraseña</label>
            <input
              class="nx-login-input"
              id="password"
              type="password"
              [(ngModel)]="password"
              name="password"
              placeholder="••••••••"
              autocomplete="current-password"
            />
          </div>

          <button
            type="submit"
            class="nx-login-btn"
            [class.nx-login-btn--loading]="loading"
            [disabled]="loading"
          >
            <span *ngIf="!loading">Iniciar sesión</span>
            <span *ngIf="loading">
              <i class="pi pi-spin pi-spinner"></i> Ingresando...
            </span>
          </button>
        </form>

        <p class="nx-login-note">
          Requiere permisos de Super Administrador.<br>
          En producción el acceso es vía SSO.
        </p>
      </div>

      <!--
        Sesión única: las credenciales YA se validaron, pero la cuenta tiene una
        sesión abierta en otro dispositivo. Todavía no hay sesión emitida acá ni
        se tocó la otra: si cancela, el otro dispositivo no se entera de nada.
      -->
      <div class="nx-takeover" *ngIf="sessionConflict" role="dialog" aria-modal="true">
        <div class="nx-takeover-card">
          <h2 class="nx-takeover-title">Ya tenés una sesión abierta en {{ conflictDeviceKindLabel }}</h2>
          <p class="nx-takeover-sub">
            Podés usar la cuenta en una computadora y en un celular a la vez, pero no en dos
            del mismo tipo.
          </p>

          <div class="nx-takeover-device">
            <strong>{{ conflictDeviceLabel }}</strong>
            <span *ngIf="conflictIp">IP {{ conflictIp }}</span>
          </div>

          <p class="nx-takeover-warning">
            Si continuás, <strong>esa sesión se va a cerrar</strong>.
          </p>

          <div class="nx-takeover-actions">
            <button type="button" class="nx-takeover-btn" (click)="cancelSessionTakeover()"
              [disabled]="takeoverLoading">Cancelar</button>
            <button type="button" class="nx-login-btn nx-takeover-btn" (click)="confirmSessionTakeover()"
              [disabled]="takeoverLoading">
              {{ takeoverLoading ? 'Cerrando...' : 'Cerrar la otra e ingresar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .nx-login-bg {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      position: relative;
      overflow: hidden;
      padding: 1.5rem;
    }

    .nx-login-blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
      animation: nx-blob-float 20s ease-in-out infinite;
    }

    .nx-login-blob--1 {
      width: 400px; height: 400px;
      top: -100px; left: -100px;
      background: rgba(91, 95, 247, 0.12);
      animation-duration: 25s;
    }

    .nx-login-blob--2 {
      width: 300px; height: 300px;
      bottom: -80px; right: -80px;
      background: rgba(6, 182, 212, 0.10);
      animation-duration: 20s;
      animation-delay: -8s;
    }

    .nx-login-blob--3 {
      width: 200px; height: 200px;
      top: 40%; left: 60%;
      background: rgba(139, 92, 246, 0.07);
      animation-duration: 30s;
      animation-delay: -15s;
    }

    @keyframes nx-blob-float {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33%       { transform: translate(20px, -20px) scale(1.04); }
      66%       { transform: translate(-15px, 15px) scale(0.97); }
    }

    .nx-login-card {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 400px;
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 18px;
      padding: 2.5rem 2rem;
      box-shadow:
        0 4px 24px rgba(99, 102, 241, 0.08),
        0 1px 3px rgba(0, 0, 0, 0.06),
        0 0 0 1px rgba(0, 0, 0, 0.02);
    }

    .nx-login-brand {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      margin-bottom: 2rem;
    }

    .nx-login-logo {
      width: 42px; height: 42px;
      border-radius: 10px;
      overflow: hidden;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(91, 95, 247, 0.25);
    }

    .nx-login-logo svg {
      width: 42px; height: 42px; display: block;
    }

    .nx-login-brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1.3;
    }

    .nx-login-brand-name {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 1.25rem;
      font-weight: 800;
      color: #09090B;
      letter-spacing: -0.03em;
    }

    .nx-login-brand-subtitle {
      font-size: 0.78rem;
      color: #64748b;
    }

    .nx-login-error {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 10px;
      color: #dc2626;
      font-size: 0.875rem;
      margin-bottom: 1.25rem;
    }

    .nx-login-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .nx-login-field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .nx-login-label {
      font-size: 0.82rem;
      font-weight: 600;
      color: #334155;
      letter-spacing: 0.01em;
    }

    .nx-login-input {
      width: 100%;
      padding: 0.65rem 0.9rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.9);
      color: #0f172a;
      font-size: 0.9rem;
      font-family: 'Plus Jakarta Sans', sans-serif;
      transition: border-color 150ms ease, box-shadow 150ms ease;
      outline: none;
      box-sizing: border-box;
    }

    .nx-login-input::placeholder {
      color: #94a3b8;
    }

    .nx-login-input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
    }

    .nx-login-btn {
      width: 100%;
      margin-top: 0.5rem;
      padding: 0.7rem 1.25rem;
      border: 1px solid rgba(99, 102, 241, 0.22);
      border-radius: 10px;
      background: linear-gradient(135deg, #5B5FF7, #4F46E5);
      color: #fff;
      font-size: 0.92rem;
      font-weight: 600;
      font-family: 'Plus Jakarta Sans', sans-serif;
      cursor: pointer;
      transition: transform 150ms ease, box-shadow 150ms ease;
      box-shadow: 0 8px 20px rgba(91, 95, 247, 0.22), inset 0 1px 0 rgba(255,255,255,0.18);
    }

    .nx-login-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 12px 28px rgba(99, 102, 241, 0.28), inset 0 1px 0 rgba(255,255,255,0.22);
    }

    .nx-login-btn:active:not(:disabled) {
      transform: scale(0.98);
    }

    .nx-login-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .nx-login-note {
      margin-top: 1.5rem;
      font-size: 0.75rem;
      color: #94a3b8;
      text-align: center;
      line-height: 1.6;
    }

    /* ── Aviso de sesión abierta en otro dispositivo ── */
    .nx-takeover {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(3px);
    }

    .nx-takeover-card {
      width: 100%;
      max-width: 400px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1.75rem 1.5rem 1.5rem;
      box-shadow: 0 24px 60px -20px rgba(0, 0, 0, 0.35);
    }

    .nx-takeover-title {
      margin: 0 0 0.35rem;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 1.15rem;
      font-weight: 800;
      color: #09090B;
      letter-spacing: -0.02em;
    }

    .nx-takeover-sub {
      margin: 0 0 1rem;
      font-size: 0.85rem;
      color: #64748b;
    }

    .nx-takeover-device {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      padding: 0.75rem 0.9rem;
      margin-bottom: 1rem;
      border-radius: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      font-size: 0.85rem;
      color: #475569;
    }

    .nx-takeover-device strong { color: #0f172a; }

    .nx-takeover-warning {
      margin: 0 0 1.25rem;
      font-size: 0.85rem;
      line-height: 1.55;
      color: #475569;
    }

    .nx-takeover-warning strong { color: #0f172a; }

    .nx-takeover-actions {
      display: grid;
      grid-template-columns: 1fr 1.4fr;
      gap: 0.6rem;
    }

    /* Anula el margen que el botón primario trae del formulario. */
    .nx-takeover-btn { margin-top: 0; }

    /* Secundario: visible sobre la tarjeta sin competir con el primario. */
    button.nx-takeover-btn:not(.nx-login-btn) {
      padding: 0.7rem 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #f1f5f9;
      color: #475569;
      font-size: 0.9rem;
      font-weight: 600;
      font-family: 'Plus Jakarta Sans', sans-serif;
      cursor: pointer;
    }

    button.nx-takeover-btn:not(.nx-login-btn):hover:not(:disabled) {
      background: #e2e8f0;
      color: #0f172a;
    }

    button.nx-takeover-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  `],
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  errorMsg = '';

  /**
   * Login válido pero FRENADO porque la cuenta ya tiene una sesión abierta.
   * Mientras esto no sea null no hay sesión emitida: si se cancela, el otro
   * dispositivo sigue intacto.
   */
  sessionConflict: SessionConflictResponse | null = null;
  takeoverLoading = false;

  constructor(private authService: AuthService, private router: Router) {}

  get conflictDeviceLabel(): string {
    return deviceLabel(this.sessionConflict?.activeSession?.userAgent ?? null);
  }

  /**
   * "otra computadora" / "otro celular": con el cupo doble hay que decir CUÁL
   * se cierra, si no la persona no sabe qué está por perder.
   */
  get conflictDeviceKindLabel(): string {
    return deviceKindLabel(this.sessionConflict?.activeSession?.deviceKind ?? null);
  }

  get conflictIp(): string | null {
    return this.sessionConflict?.activeSession?.ip ?? null;
  }

  login(): void {
    if (!this.email || !this.password) {
      this.errorMsg = 'Completá todos los campos.';
      return;
    }
    this.loading = true;
    this.errorMsg = '';
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading = false;
        // Sesión abierta en otro dispositivo: avisamos antes de cerrarla.
        if (isSessionConflict(res)) {
          this.sessionConflict = res;
          return;
        }
        this.enterPanel(res);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Credenciales inválidas.';
      },
    });
  }

  /** Confirma: cierra la otra sesión y termina el login que quedó frenado. */
  confirmSessionTakeover(): void {
    const takeoverToken = this.sessionConflict?.takeoverToken;
    if (!takeoverToken || this.takeoverLoading) return;

    this.takeoverLoading = true;
    this.authService.confirmSessionTakeover(takeoverToken).subscribe({
      next: (res) => {
        this.takeoverLoading = false;
        this.sessionConflict = null;
        this.enterPanel(res);
      },
      error: (err) => {
        this.takeoverLoading = false;
        this.sessionConflict = null;
        this.password = '';
        // 401 = el token de confirmación (5 min) venció.
        this.errorMsg = err?.error?.message || 'No se pudo cerrar la otra sesión. Intentá de nuevo.';
      },
    });
  }

  /** Cancela el ingreso: la otra sesión queda abierta y acá no se entra. */
  cancelSessionTakeover(): void {
    this.sessionConflict = null;
    this.password = '';
  }

  private enterPanel(res: any): void {
    const user = res.user ?? res;
    if (!user?.isSuperAdmin) {
      this.errorMsg = 'Tu usuario no tiene permisos de Super Administrador.';
      return;
    }
    this.router.navigate(['/']);
  }
}
