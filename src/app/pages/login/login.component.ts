import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

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

        <div *ngIf="infoMsg" class="nx-login-info">
          <i class="pi pi-check-circle"></i>
          {{ infoMsg }}
        </div>

        <!-- Paso 1: credenciales -->
        <form *ngIf="step === 'credentials'" class="nx-login-form" (ngSubmit)="login()">
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

        <!-- Paso 2: segundo factor -->
        <form *ngIf="step === 'twofactor'" class="nx-login-form" (ngSubmit)="verifyCode()">
          <div class="nx-login-2fa-head">
            <div class="nx-login-2fa-icon">
              <i class="pi" [ngClass]="twoFactorMethod === 'email' ? 'pi-envelope' : 'pi-mobile'"></i>
            </div>
            <div class="nx-login-2fa-title">Verificación en dos pasos</div>
            <div class="nx-login-2fa-desc">
              <span *ngIf="twoFactorMethod === 'email'">Ingresá el código que enviamos a tu correo.</span>
              <span *ngIf="twoFactorMethod !== 'email'">Ingresá el código de tu app de autenticación.</span>
            </div>
          </div>

          <div class="nx-login-field">
            <label class="nx-login-label" for="code">Código de verificación</label>
            <input
              class="nx-login-input nx-login-input--code"
              id="code"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="8"
              [(ngModel)]="code"
              name="code"
              placeholder="123456"
              (keyup.enter)="verifyCode()"
            />
          </div>

          <label class="nx-login-check">
            <input type="checkbox" [(ngModel)]="trustDevice" name="trustDevice" />
            <span>Confiar en este dispositivo por 30 días</span>
          </label>

          <button
            type="submit"
            class="nx-login-btn"
            [class.nx-login-btn--loading]="loading"
            [disabled]="loading"
          >
            <span *ngIf="!loading">Verificar</span>
            <span *ngIf="loading">
              <i class="pi pi-spin pi-spinner"></i> Verificando...
            </span>
          </button>

          <div class="nx-login-2fa-actions">
            <button type="button" class="nx-login-link" (click)="backToCredentials()">
              <i class="pi pi-arrow-left"></i> Volver
            </button>
            <button
              *ngIf="twoFactorMethod === 'email'"
              type="button"
              class="nx-login-link"
              [disabled]="resending"
              (click)="resendCode()"
            >
              <i class="pi pi-refresh" [class.pi-spin]="resending"></i> Reenviar código
            </button>
          </div>
        </form>

        <p class="nx-login-note" *ngIf="step === 'credentials'">
          Requiere permisos de Super Administrador.<br>
          En producción el acceso es vía SSO.
        </p>
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

    .nx-login-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 10px;
      color: #059669;
      font-size: 0.875rem;
      margin-bottom: 1.25rem;
    }

    .nx-login-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .nx-login-2fa-head {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.4rem;
      margin-bottom: 0.25rem;
    }

    .nx-login-2fa-icon {
      width: 46px;
      height: 46px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      background: rgba(99, 102, 241, 0.1);
      color: #4f46e5;
      font-size: 1.3rem;
      margin-bottom: 0.35rem;
    }

    .nx-login-2fa-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.02em;
    }

    .nx-login-2fa-desc {
      font-size: 0.82rem;
      color: #64748b;
      line-height: 1.5;
    }

    .nx-login-input--code {
      text-align: center;
      letter-spacing: 0.5em;
      font-size: 1.15rem;
      font-weight: 600;
      padding-left: 0.5em;
    }

    .nx-login-check {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: #475569;
      cursor: pointer;
      user-select: none;
    }

    .nx-login-check input {
      width: 16px;
      height: 16px;
      accent-color: #5B5FF7;
      cursor: pointer;
    }

    .nx-login-2fa-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-top: 0.25rem;
    }

    .nx-login-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: none;
      border: none;
      padding: 0.25rem;
      color: #4f46e5;
      font-size: 0.8rem;
      font-weight: 600;
      font-family: 'Plus Jakarta Sans', sans-serif;
      cursor: pointer;
      transition: opacity 150ms ease;
    }

    .nx-login-link:hover:not(:disabled) {
      opacity: 0.75;
    }

    .nx-login-link:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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
  `],
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  errorMsg = '';
  infoMsg = '';

  // Estado del segundo factor
  step: 'credentials' | 'twofactor' = 'credentials';
  twoFactorMethod: 'totp' | 'email' | null = null;
  challengeToken = '';
  code = '';
  trustDevice = false;
  resending = false;

  constructor(private authService: AuthService, private router: Router) {}

  login(): void {
    if (!this.email || !this.password) {
      this.errorMsg = 'Completá todos los campos.';
      return;
    }
    this.loading = true;
    this.errorMsg = '';
    this.infoMsg = '';
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading = false;
        // El backend pide segundo factor: pasamos al paso de verificación.
        if (res?.twoFactorRequired) {
          this.step = 'twofactor';
          this.twoFactorMethod = res.method ?? null;
          this.challengeToken = res.challengeToken;
          this.code = '';
          this.trustDevice = false;
          if (this.twoFactorMethod === 'email') {
            this.infoMsg = 'Te enviamos un código de verificación a tu correo.';
          }
          return;
        }
        this.finishLogin(res);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Credenciales inválidas.';
      },
    });
  }

  verifyCode(): void {
    if (!this.code?.trim()) {
      this.errorMsg = 'Ingresá el código de verificación.';
      return;
    }
    this.loading = true;
    this.errorMsg = '';
    this.infoMsg = '';
    this.authService
      .verifyTwoFactor({
        challengeToken: this.challengeToken,
        code: this.code.trim(),
        trustDevice: this.trustDevice,
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.finishLogin(res);
        },
        error: (err) => {
          this.loading = false;
          this.errorMsg = err?.error?.message || 'El código de verificación no es válido.';
        },
      });
  }

  resendCode(): void {
    if (!this.challengeToken) return;
    this.resending = true;
    this.errorMsg = '';
    this.infoMsg = '';
    this.authService.resendTwoFactorCode(this.challengeToken).subscribe({
      next: () => {
        this.resending = false;
        this.infoMsg = 'Te reenviamos el código a tu correo.';
      },
      error: (err) => {
        this.resending = false;
        this.errorMsg = err?.error?.message || 'No pudimos reenviar el código. Intentá nuevamente.';
      },
    });
  }

  backToCredentials(): void {
    this.step = 'credentials';
    this.twoFactorMethod = null;
    this.challengeToken = '';
    this.code = '';
    this.trustDevice = false;
    this.errorMsg = '';
    this.infoMsg = '';
  }

  private finishLogin(res: any): void {
    const user = res?.user ?? res;
    if (!user?.isSuperAdmin) {
      this.errorMsg = 'Tu usuario no tiene permisos de Super Administrador.';
      return;
    }
    this.router.navigate(['/']);
  }
}
