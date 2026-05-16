import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LayoutService } from "./service/app.layout.service";
import { Router, NavigationEnd } from '@angular/router';
import { ConfirmPopup } from 'primeng/confirmpopup';
import { AuthService } from '../core/services/auth.service';
import { environment } from '../../environments/environment';
import { Subscription, filter } from 'rxjs';

interface Crumb { label: string; url: string | null; }

@Component({
  selector: 'app-topbar',
  templateUrl: './app.topbar.component.html'
})
export class AppTopBarComponent implements OnInit, OnDestroy {
  userData: any = null;
  pswdDialogVisible: boolean = false;
  breadcrumbs: Crumb[] = [];
  private routerSub?: Subscription;
  private userSub?: Subscription;

  private static readonly LABELS: Record<string, string> = {
    'products': 'Productos',
    'nexivo-turnos': 'Nexivo Turnos',
    'nexivo-gestion': 'Nexivo Gestión',
    'subscriptions': 'Suscripciones',
    'plans': 'Planes',
    'metrics': 'Métricas',
    'dashboard': 'Dashboard',
    'users': 'Usuarios',
    'billing': 'Facturación',
    'settings': 'Configuración',
    'arca-config': 'ARCA',
    'whatsapp': 'WhatsApp',
    'sales': 'Ventas',
    'sales_point': 'Punto de venta',
    'supplier': 'Proveedores',
    'product-variants': 'Variantes',
    'store-products': 'Productos tienda',
  };

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showCurrentPassword: boolean = false;
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;
  submitted: boolean = false;
  errorMessage: string = '';

  @ViewChild('menubutton') menuButton!: ElementRef;
  @ViewChild('topbarmenubutton') topbarMenuButton!: ElementRef;
  @ViewChild('topbarmenu') menu!: ElementRef;
  @ViewChild(ConfirmPopup) confirmPopup!: ConfirmPopup;

  get isDarkMode(): boolean {
    return this.layoutService.config.colorScheme === 'dark';
  }

  constructor(
    public layoutService: LayoutService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.userSub = this.authService.currentUser$.subscribe(u => this.userData = u);
    if (!this.userData) this.userData = this.authService.getCurrentUser();
    this.computeBreadcrumbs(this.router.url);
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => this.computeBreadcrumbs(e.urlAfterRedirects || e.url));
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.userSub?.unsubscribe();
  }

  private computeBreadcrumbs(url: string): void {
    const clean = (url || '/').split('?')[0].split('#')[0];
    const segs = clean.split('/').filter(Boolean);
    const crumbs: Crumb[] = [];
    let path = '';
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      path += '/' + seg;
      // Skip UUID-like segments, fall back to label map
      if (/^[0-9a-f-]{16,}$/i.test(seg)) {
        crumbs.push({ label: 'Detalle', url: null });
        continue;
      }
      const label = AppTopBarComponent.LABELS[seg] || this.toTitle(seg);
      crumbs.push({ label, url: i === segs.length - 1 ? null : path });
    }
    this.breadcrumbs = crumbs;
  }

  private toTitle(s: string): string {
    return s.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  get userInitials(): string {
    const f = (this.userData?.first_name || '').charAt(0);
    const l = (this.userData?.last_name || '').charAt(0);
    const fb = (this.userData?.email || 'N').charAt(0);
    return ((f + l) || fb).toUpperCase();
  }

  toggleDarkMode(): void {
    const themeLink = <HTMLLinkElement>document.getElementById('app-theme');
    if (!themeLink) return;
    const isDark = this.layoutService.config.colorScheme === 'dark';
    const newTheme = isDark ? 'lara-light-blue' : 'lara-dark-blue';
    const newScheme = isDark ? 'light' : 'dark';
    const newHref = `assets/layout/styles/theme/${newTheme}/theme.css`;
    const id = 'app-theme';
    const cloneLink = <HTMLLinkElement>themeLink.cloneNode(true);
    cloneLink.setAttribute('href', newHref);
    cloneLink.setAttribute('id', id + '-clone');
    themeLink.parentNode!.insertBefore(cloneLink, themeLink.nextSibling);
    cloneLink.addEventListener('load', () => {
      themeLink.remove();
      cloneLink.setAttribute('id', id);
      this.layoutService.config.theme = newTheme;
      this.layoutService.config.colorScheme = newScheme;
      localStorage.setItem('appConfig', JSON.stringify({ ...this.layoutService.config }));
      this.layoutService.onConfigUpdate();
    });
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      localStorage.clear();
      if (environment.localLogin) {
        this.router.navigate(['/login']);
      } else {
        window.location.href = `${environment.ssoUrl}/login`;
      }
    });
  }

  accept(): void {
    this.confirmPopup.accept();
  }

  reject(): void {
    this.confirmPopup.reject();
  }

  showDialog(): void {
    this.resetForm();
    this.pswdDialogVisible = true;
  }

  cancelPasswordChange(): void {
    this.resetForm();
    this.pswdDialogVisible = false;
  }

  private resetForm(): void {
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.showCurrentPassword = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;
    this.submitted = false;
    this.errorMessage = '';
  }

  changeUserPassword(): void {
    this.submitted = true;
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.showWarning("Por favor completa todos los campos.");
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.showWarning("Las contraseñas no coinciden.");
      return;
    }
    // TODO: wire up to auth service in Task 3+
    this.showWarning("Funcionalidad pendiente de implementación.");
  }

  showWarning(detail: string): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Atención!',
      detail: detail,
      life: 3000
    });
  }

  showSuccess(detail: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: detail,
      life: 3000
    });
  }
}
