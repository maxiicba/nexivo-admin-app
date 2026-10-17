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
    <div class="lg">
      <aside class="lg-brand">
        <div class="lg-brand-top">
          <span class="lg-tile">N</span>
          <span class="lg-wordmark">Nexivo Admin</span>
        </div>

        <div class="lg-brand-body">
          <div class="lg-kicker">Panel interno</div>
          <h1 class="lg-heading">Todo Nexivo, en un solo lugar.</h1>
          <p class="lg-lead">Gestión de cuentas, suscripciones y productos de la plataforma.</p>
        </div>

        <ul class="lg-facts">
          <li>Turnos</li>
          <li>Management</li>
          <li><span class="lg-dot"></span>Operativo</li>
        </ul>
      </aside>

      <main class="lg-main">
        <div class="lg-card">
          <ng-container *ngIf="step === 'credentials'">
            <h2 class="lg-title">Iniciar sesión</h2>
            <p class="lg-sub">Ingresá con tu cuenta de administrador.</p>
          </ng-container>

          <div *ngIf="errorMsg" class="lg-alert lg-alert--error">
            <i class="pi pi-exclamation-circle"></i>
            <span>{{ errorMsg }}</span>
          </div>

          <div *ngIf="infoMsg" class="lg-alert lg-alert--info">
            <i class="pi pi-check-circle"></i>
            <span>{{ infoMsg }}</span>
          </div>

          <!-- Paso 1: credenciales -->
          <form *ngIf="step === 'credentials'" class="lg-form" (ngSubmit)="login()">
            <div class="lg-field">
              <label class="lg-label" for="email">Correo electrónico</label>
              <input
                class="lg-input"
                id="email"
                type="email"
                [(ngModel)]="email"
                name="email"
                placeholder="admin@nexivo.com.ar"
                autocomplete="email"
              />
            </div>

            <div class="lg-field">
              <label class="lg-label" for="password">Contraseña</label>
              <input
                class="lg-input"
                id="password"
                type="password"
                [(ngModel)]="password"
                name="password"
                placeholder="••••••••"
                autocomplete="current-password"
              />
            </div>

            <button type="submit" class="lg-btn" [disabled]="loading">
              <span *ngIf="!loading">Iniciar sesión</span>
              <span *ngIf="loading">
                <i class="pi pi-spin pi-spinner"></i> Ingresando...
              </span>
            </button>
          </form>

          <!-- Paso 2: segundo factor -->
          <form *ngIf="step === 'twofactor'" class="lg-form" (ngSubmit)="verifyCode()">
            <div class="lg-2fa-head">
              <div class="lg-2fa-icon">
                <i class="pi" [ngClass]="twoFactorMethod === 'email' ? 'pi-envelope' : 'pi-mobile'"></i>
              </div>
              <h2 class="lg-title">Verificación en dos pasos</h2>
              <p class="lg-sub">
                <span *ngIf="twoFactorMethod === 'email'">Ingresá el código que enviamos a tu correo.</span>
                <span *ngIf="twoFactorMethod !== 'email'">Ingresá el código de tu app de autenticación.</span>
              </p>
            </div>

            <div class="lg-field">
              <label class="lg-label" for="code">Código de verificación</label>
              <input
                class="lg-input lg-input--code"
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

            <label class="lg-check">
              <input type="checkbox" [(ngModel)]="trustDevice" name="trustDevice" />
              <span>Confiar en este dispositivo por 30 días</span>
            </label>

            <button type="submit" class="lg-btn" [disabled]="loading">
              <span *ngIf="!loading">Verificar</span>
              <span *ngIf="loading">
                <i class="pi pi-spin pi-spinner"></i> Verificando...
              </span>
            </button>

            <div class="lg-2fa-actions">
              <button type="button" class="lg-link" (click)="backToCredentials()">
                <i class="pi pi-arrow-left"></i> Volver
              </button>
              <button
                *ngIf="twoFactorMethod === 'email'"
                type="button"
                class="lg-link"
                [disabled]="resending"
                (click)="resendCode()"
              >
                <i class="pi pi-refresh" [class.pi-spin]="resending"></i> Reenviar código
              </button>
            </div>
          </form>

          <p class="lg-note" *ngIf="step === 'credentials'">
            Requiere permisos de Super Administrador.<br>
            En producción el acceso es vía SSO.
          </p>
        </div>
      </main>

      <!--
        Sesión única: las credenciales YA se validaron, pero la cuenta tiene una
        sesión abierta en otro dispositivo. Todavía no hay sesión emitida acá ni
        se tocó la otra: si cancela, el otro dispositivo no se entera de nada.
      -->
      <div class="lg-modal" *ngIf="sessionConflict" role="dialog" aria-modal="true">
        <div class="lg-modal-card">
          <h2 class="lg-modal-title">Ya tenés una sesión abierta en {{ conflictDeviceKindLabel }}</h2>
          <p class="lg-modal-sub">
            Podés usar la cuenta en una computadora y en un celular a la vez, pero no en dos
            del mismo tipo.
          </p>

          <div class="lg-modal-device">
            <strong>{{ conflictDeviceLabel }}</strong>
            <span *ngIf="conflictIp">IP {{ conflictIp }}</span>
          </div>

          <p class="lg-modal-warning">
            Si continuás, <strong>esa sesión se va a cerrar</strong>.
          </p>

          <div class="lg-modal-actions">
            <button type="button" class="lg-btn lg-btn--ghost" (click)="cancelSessionTakeover()"
              [disabled]="takeoverLoading">Cancelar</button>
            <button type="button" class="lg-btn" (click)="confirmSessionTakeover()"
              [disabled]="takeoverLoading">
              {{ takeoverLoading ? 'Cerrando...' : 'Cerrar la otra e ingresar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .lg {
      min-height: 100vh;
      display: grid;
      grid-template-columns: minmax(340px, 5fr) 7fr;
      background: var(--c-bg);
      font-family: var(--c-font);
      color: var(--c-ink);
    }

    /* Panel de marca */
    .lg-brand {
      background: var(--nxa-navy);
      color: #fff;
      padding: 40px 48px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 48px;
    }

    .lg-brand-top { display: flex; align-items: center; gap: 12px; }

    .lg-tile {
      width: 32px; height: 32px;
      border-radius: 8px;
      background: var(--nxa-amber);
      color: var(--nxa-ink);
      display: inline-flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 16px;
    }

    .lg-wordmark { font-size: 16px; font-weight: 650; letter-spacing: -.02em; color: #fff; }

    .lg-brand-body { max-width: 420px; }

    .lg-kicker {
      font-family: var(--c-mono);
      font-size: 11px;
      letter-spacing: .12em;
      text-transform: uppercase;
      color: var(--nxa-amber);
      margin-bottom: 14px;
    }

    .lg-heading {
      margin: 0 0 12px;
      font-size: 32px;
      line-height: 1.15;
      font-weight: 650;
      letter-spacing: -.03em;
      color: #fff;
    }

    .lg-lead { margin: 0; font-size: 15px; line-height: 1.55; color: rgba(255, 255, 255, .66); }

    .lg-facts {
      list-style: none;
      margin: 0; padding: 16px 0 0;
      display: flex; flex-wrap: wrap; gap: 8px 24px;
      border-top: 1px solid rgba(255, 255, 255, .16);
      font-family: var(--c-mono);
      font-variant-numeric: tabular-nums;
      font-size: 11px;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, .66);
    }

    .lg-facts li { display: inline-flex; align-items: center; gap: 8px; }

    .lg-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--nxa-amber); }

    /* Panel del formulario */
    .lg-main {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px 24px;
    }

    .lg-card {
      width: 100%;
      max-width: 380px;
      background: var(--c-surface);
      border: 1px solid var(--c-border);
      border-radius: var(--r-card);
      padding: 28px;
    }

    .lg-title { margin: 0; font-size: 18px; font-weight: 650; letter-spacing: -.02em; color: var(--c-ink); }
    .lg-sub { margin: 4px 0 20px; font-size: 13px; line-height: 1.5; color: var(--c-ink-2); }

    .lg-alert {
      display: flex; align-items: flex-start; gap: 8px;
      padding: 10px 12px;
      border-radius: var(--r-ctl);
      font-size: 13px;
      line-height: 1.45;
      margin-bottom: 16px;
    }
    .lg-alert i { margin-top: 2px; }
    .lg-alert--error { background: var(--c-danger-soft); color: var(--c-danger); }
    .lg-alert--info { background: var(--c-success-soft); color: var(--c-success); }

    .lg-form { display: flex; flex-direction: column; gap: 16px; }
    .lg-field { display: flex; flex-direction: column; gap: 6px; }
    .lg-label { font-size: 12px; font-weight: 500; color: var(--c-ink-2); }

    .lg-input {
      width: 100%;
      height: 40px;
      padding: 0 12px;
      box-sizing: border-box;
      border: 1px solid var(--c-border-strong);
      border-radius: var(--r-ctl);
      background: var(--c-surface);
      color: var(--c-ink);
      font-family: var(--c-font);
      font-size: 14px;
      outline: none;
      transition: border-color 150ms ease, box-shadow 150ms ease;
    }
    .lg-input::placeholder { color: var(--c-ink-3); }
    .lg-input:focus { border-color: var(--c-accent); box-shadow: var(--ring-accent); }

    .lg-input--code {
      height: 48px;
      text-align: center;
      font-family: var(--c-mono);
      font-variant-numeric: tabular-nums;
      font-size: 22px;
      font-weight: 600;
      letter-spacing: .4em;
      padding-left: calc(12px + .4em);
    }

    .lg-btn {
      width: 100%;
      height: 40px;
      padding: 0 16px;
      border: 1px solid var(--c-accent);
      border-radius: var(--r-ctl);
      background: var(--c-accent);
      color: var(--c-accent-on);
      font-family: var(--c-font);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
    }
    .lg-btn:hover:not(:disabled) { background: var(--c-accent-ink); border-color: var(--c-accent-ink); }
    .lg-btn:focus-visible { outline: none; box-shadow: var(--ring-accent); }
    .lg-btn:disabled { opacity: .6; cursor: not-allowed; }

    .lg-btn--ghost {
      background: var(--c-surface);
      border-color: var(--c-border-strong);
      color: var(--c-ink);
    }
    .lg-btn--ghost:hover:not(:disabled) { background: var(--c-surface-2); border-color: var(--c-border-strong); }

    .lg-2fa-head { display: flex; flex-direction: column; align-items: flex-start; }
    .lg-2fa-head .lg-sub { margin-bottom: 4px; }
    .lg-2fa-icon {
      width: 40px; height: 40px;
      display: flex; align-items: center; justify-content: center;
      border-radius: var(--r-ctl);
      background: var(--c-accent-soft);
      color: var(--c-ink);
      font-size: 18px;
      margin-bottom: 14px;
    }

    .lg-check {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; color: var(--c-ink-2);
      cursor: pointer; user-select: none;
    }
    .lg-check input { width: 16px; height: 16px; accent-color: var(--c-accent); cursor: pointer; }

    .lg-2fa-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; }

    .lg-link {
      display: inline-flex; align-items: center; gap: 6px;
      background: none; border: none; padding: 4px;
      border-radius: 6px;
      color: var(--c-ink-2);
      font-family: var(--c-font);
      font-size: 13px; font-weight: 500;
      cursor: pointer;
      transition: color 150ms ease;
    }
    .lg-link:hover:not(:disabled) { color: var(--c-ink); }
    .lg-link:focus-visible { outline: none; box-shadow: var(--ring-accent); }
    .lg-link:disabled { opacity: .5; cursor: not-allowed; }

    .lg-note { margin: 20px 0 0; font-size: 12px; line-height: 1.6; color: var(--c-ink-3); text-align: center; }

    /* Aviso de sesión abierta en otro dispositivo */
    .lg-modal {
      position: fixed; inset: 0; z-index: 100;
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
      background: rgba(10, 22, 40, .6);
    }

    .lg-modal-card {
      width: 100%; max-width: 400px;
      background: var(--c-surface);
      border: 1px solid var(--c-border);
      border-radius: var(--r-card);
      padding: 24px;
    }

    .lg-modal-title { margin: 0 0 4px; font-size: 18px; font-weight: 650; letter-spacing: -.02em; color: var(--c-ink); }
    .lg-modal-sub { margin: 0 0 16px; font-size: 13px; line-height: 1.5; color: var(--c-ink-2); }

    .lg-modal-device {
      display: flex; flex-direction: column; gap: 4px;
      padding: 12px;
      margin-bottom: 16px;
      border-radius: var(--r-ctl);
      background: var(--c-surface-2);
      border: 1px solid var(--c-border);
      font-size: 13px;
      color: var(--c-ink-2);
    }
    .lg-modal-device strong { color: var(--c-ink); font-weight: 600; }
    .lg-modal-device span { font-family: var(--c-mono); font-variant-numeric: tabular-nums; font-size: 12px; }

    .lg-modal-warning { margin: 0 0 20px; font-size: 13px; line-height: 1.55; color: var(--c-ink-2); }
    .lg-modal-warning strong { color: var(--c-ink); }

    .lg-modal-actions { display: grid; grid-template-columns: 1fr 1.4fr; gap: 8px; }

    /* Mobile: el panel de marca pasa a ser una tira compacta */
    @media (max-width: 899px) {
      .lg { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
      .lg-brand { padding: 16px 20px; gap: 0; flex-direction: row; align-items: center; }
      .lg-brand-body, .lg-facts { display: none; }
      .lg-main { align-items: flex-start; padding: 24px 16px; }
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
    this.infoMsg = '';
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading = false;
        // Sesión abierta en otro dispositivo: avisamos antes de cerrarla.
        if (isSessionConflict(res)) {
          this.sessionConflict = res;
          return;
        }
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

  /** Confirma: cierra la otra sesión y termina el login que quedó frenado. */
  confirmSessionTakeover(): void {
    const takeoverToken = this.sessionConflict?.takeoverToken;
    if (!takeoverToken || this.takeoverLoading) return;

    this.takeoverLoading = true;
    this.authService.confirmSessionTakeover(takeoverToken).subscribe({
      next: (res) => {
        this.takeoverLoading = false;
        this.sessionConflict = null;
        this.finishLogin(res);
      },
      error: (err) => {
        this.takeoverLoading = false;
        this.sessionConflict = null;
        this.password = '';
        this.backToCredentials();
        // 401 = el token de confirmación (5 min) venció.
        this.errorMsg = err?.error?.message || 'No se pudo cerrar la otra sesión. Intentá de nuevo.';
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
          // El segundo factor también puede quedar frenado por una sesión abierta.
          if (isSessionConflict(res)) {
            this.sessionConflict = res;
            return;
          }
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

  /** Cancela el ingreso: la otra sesión queda abierta y acá no se entra. */
  cancelSessionTakeover(): void {
    this.sessionConflict = null;
    this.password = '';
    this.backToCredentials();
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
