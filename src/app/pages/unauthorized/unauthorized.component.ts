import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="un">
      <div class="un-card">
        <span class="un-icon"><i class="pi pi-lock"></i></span>
        <h2 class="un-title">Acceso no autorizado</h2>
        <p class="un-sub">Esta sección requiere permisos de Super Administrador.</p>
        <button type="button" class="un-btn" (click)="goBack()">
          <i class="pi pi-arrow-left"></i> Volver
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .un {
      min-height: 60vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
      font-family: var(--c-font);
    }

    .un-card {
      width: 100%;
      max-width: 380px;
      background: var(--c-surface);
      border: 1px solid var(--c-border);
      border-radius: var(--r-card);
      padding: 28px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .un-icon {
      width: 40px; height: 40px;
      display: flex; align-items: center; justify-content: center;
      border-radius: var(--r-ctl);
      background: var(--c-danger-soft);
      color: var(--c-danger);
      font-size: 18px;
      margin-bottom: 14px;
    }

    .un-title { margin: 0; font-size: 18px; font-weight: 650; letter-spacing: -.02em; color: var(--c-ink); }
    .un-sub { margin: 4px 0 20px; font-size: 13px; line-height: 1.5; color: var(--c-ink-2); }

    .un-btn {
      width: 100%;
      height: 40px;
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      border: 1px solid var(--c-accent);
      border-radius: var(--r-ctl);
      background: var(--c-accent);
      color: var(--c-accent-on);
      font-family: var(--c-font);
      font-size: 14px; font-weight: 600;
      cursor: pointer;
      transition: background 150ms ease, border-color 150ms ease;
    }
    .un-btn:hover { background: var(--c-accent-ink); border-color: var(--c-accent-ink); }
    .un-btn:focus-visible { outline: none; box-shadow: var(--ring-accent); }
  `],
})
export class UnauthorizedComponent {
  goBack() { window.location.href = environment.ssoUrl; }
}
