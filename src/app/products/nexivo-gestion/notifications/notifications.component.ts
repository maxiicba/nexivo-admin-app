import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MessageService } from 'primeng/api';

import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { MultiSelectModule } from 'primeng/multiselect';

import { environment } from '../../../../environments/environment';
import { AccountsService } from '../services/accounts.service';
import { Account } from '../interfaces/account.interface';

interface UserOption {
  id: string;
  label: string;
  email: string;
  role?: string;
}

interface RoleOption {
  id: number;
  label: string;
}

interface SentNotification {
  title: string;
  type: string;
  severity: string;
  targetType: string;
  accountName: string;
  createdAt: Date;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    DropdownModule, InputTextModule, InputTextareaModule,
    ButtonModule, CardModule, ToastModule, TagModule,
    DividerModule, TableModule, TooltipModule,
    MultiSelectModule,
  ],
  providers: [MessageService],
  templateUrl: './notifications.component.html',
})
export class NotificationsComponent implements OnInit {

  private destroyRef = inject(DestroyRef);
  private baseUrl = environment.managementApiUrl;

  // Send mode
  sendMode: string = 'single';  // 'all' | 'multiple' | 'single'
  selectedAccounts: Account[] = [];
  activeAccountCount = 0;

  sendModes = [
    { label: 'Una cuenta', value: 'single', icon: 'pi pi-building' },
    { label: 'Seleccionar cuentas', value: 'multiple', icon: 'pi pi-list' },
    { label: 'Todas las activas', value: 'all', icon: 'pi pi-globe' },
  ];

  // Form
  selectedAccount: Account | null = null;
  targetType: string = 'account';
  selectedRole: RoleOption | null = null;
  selectedUser: UserOption | null = null;
  notifType: string = 'system';
  severity: string = 'info';
  title: string = '';
  message: string = '';
  actionUrl: string = '';

  // Data
  accounts: Account[] = [];
  roles: RoleOption[] = [];
  users: UserOption[] = [];
  sentHistory: SentNotification[] = [];

  // UI
  sending = false;
  loadingUsers = false;
  loadingRoles = false;

  // Dropdown options
  targetTypes = [
    { label: 'Toda la cuenta', value: 'account', icon: 'pi pi-building' },
    { label: 'Un rol especifico', value: 'role', icon: 'pi pi-users' },
    { label: 'Un usuario especifico', value: 'user', icon: 'pi pi-user' },
  ];

  notifTypes = [
    { label: 'Sistema', value: 'system' },
    { label: 'Ventas', value: 'sales' },
    { label: 'Stock', value: 'stock' },
    { label: 'Suscripcion', value: 'subscription' },
    { label: 'Admin', value: 'admin' },
    { label: 'Personalizada', value: 'custom' },
  ];

  severities = [
    { label: 'Info', value: 'info' },
    { label: 'Exito', value: 'success' },
    { label: 'Advertencia', value: 'warning' },
    { label: 'Error', value: 'error' },
  ];

  constructor(
    private http: HttpClient,
    private accountsService: AccountsService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.accountsService.getAccounts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (accounts) => {
          this.accounts = accounts;
          this.activeAccountCount = accounts.filter(a => a.status === 'active').length;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las cuentas', life: 3000 });
        },
      });
  }

  onAccountChange(): void {
    this.selectedRole = null;
    this.selectedUser = null;
    this.roles = [];
    this.users = [];

    if (!this.selectedAccount) return;

    if (this.targetType === 'role') {
      this.loadRoles();
    } else if (this.targetType === 'user') {
      this.loadUsers();
    }
  }

  onSendModeChange(): void {
    this.selectedAccount = null;
    this.selectedAccounts = [];
    this.selectedRole = null;
    this.selectedUser = null;
    this.roles = [];
    this.users = [];
  }

  onTargetTypeChange(): void {
    this.selectedRole = null;
    this.selectedUser = null;

    if (!this.selectedAccount) return;

    if (this.targetType === 'role' && this.roles.length === 0) {
      this.loadRoles();
    } else if (this.targetType === 'user' && this.users.length === 0) {
      this.loadUsers();
    }
  }

  private loadRoles(): void {
    this.loadingRoles = true;
    this.http.get<any[]>(`${this.baseUrl}/roles`, {
      withCredentials: true,
      headers: { 'X-Account-Id': this.selectedAccount!.id },
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (roles) => {
          this.roles = roles.map(r => ({ id: r.id, label: r.alias || r.name }));
          this.loadingRoles = false;
        },
        error: () => {
          this.loadingRoles = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los roles', life: 3000 });
        },
      });
  }

  private loadUsers(): void {
    this.loadingUsers = true;
    this.http.get<any[]>(`${this.baseUrl}/user/account/${this.selectedAccount!.id}`, {
      withCredentials: true,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => {
          this.users = users.map(u => ({
            id: u.id,
            label: `${u.first_name} ${u.last_name}`,
            email: u.email,
            role: u.role?.alias || u.role?.name,
          }));
          this.loadingUsers = false;
        },
        error: () => {
          this.loadingUsers = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los usuarios', life: 3000 });
        },
      });
  }

  get isValid(): boolean {
    if (!this.title.trim() || !this.message.trim()) return false;

    if (this.sendMode === 'single') {
      if (!this.selectedAccount) return false;
      if (this.targetType === 'role' && !this.selectedRole) return false;
      if (this.targetType === 'user' && !this.selectedUser) return false;
    } else if (this.sendMode === 'multiple') {
      if (this.selectedAccounts.length === 0) return false;
    }
    // 'all' mode: no account selection needed

    return true;
  }

  send(): void {
    if (!this.isValid || this.sending) return;

    this.sending = true;

    if (this.sendMode === 'single') {
      this.sendSingle();
    } else {
      this.sendBroadcast();
    }
  }

  private sendSingle(): void {
    const body: any = {
      accountId: this.selectedAccount!.id,
      type: this.notifType,
      title: this.title.trim(),
      message: this.message.trim(),
      severity: this.severity,
      targetType: this.targetType,
    };

    if (this.actionUrl.trim()) {
      body.actionUrl = this.actionUrl.trim();
    }
    if (this.targetType === 'role' && this.selectedRole) {
      body.targetRoleId = this.selectedRole.id;
    }
    if (this.targetType === 'user' && this.selectedUser) {
      body.targetUserId = this.selectedUser.id;
    }

    this.http.post(`${this.baseUrl}/notifications`, body, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Notificacion enviada',
            detail: `Se envio "${this.title}" a ${this.getTargetLabel()}`,
          });

          this.sentHistory.unshift({
            title: this.title,
            type: this.notifType,
            severity: this.severity,
            targetType: this.targetType,
            accountName: this.selectedAccount!.name,
            createdAt: new Date(),
          });

          this.resetForm();
          this.sending = false;
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo enviar la notificacion',
          });
          this.sending = false;
        },
      });
  }

  private sendBroadcast(): void {
    const body: any = {
      allActive: this.sendMode === 'all',
      type: this.notifType,
      title: this.title.trim(),
      message: this.message.trim(),
      severity: this.severity,
      targetType: this.targetType,
    };

    if (this.sendMode === 'multiple') {
      body.accountIds = this.selectedAccounts.map(a => a.id);
    }

    if (this.actionUrl.trim()) {
      body.actionUrl = this.actionUrl.trim();
    }
    if (this.targetType === 'role' && this.selectedRole) {
      body.targetRoleId = this.selectedRole.id;
    }

    this.http.post<{ sent: number; failed: number }>(`${this.baseUrl}/notifications/broadcast`, body, { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          const detail = result.failed > 0
            ? `Enviada a ${result.sent} cuentas, ${result.failed} fallidas`
            : `Enviada a ${result.sent} cuentas`;

          this.messageService.add({
            severity: result.failed > 0 ? 'warn' : 'success',
            summary: 'Broadcast completado',
            detail,
          });

          const accountLabel = this.sendMode === 'all'
            ? `Todas las activas (${result.sent})`
            : `${result.sent} cuentas seleccionadas`;

          this.sentHistory.unshift({
            title: this.title,
            type: this.notifType,
            severity: this.severity,
            targetType: this.targetType,
            accountName: accountLabel,
            createdAt: new Date(),
          });

          this.resetForm();
          this.sending = false;
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo enviar el broadcast',
          });
          this.sending = false;
        },
      });
  }

  private getTargetLabel(): string {
    if (this.targetType === 'account') return this.selectedAccount!.name;
    if (this.targetType === 'role') return `rol ${this.selectedRole!.label} en ${this.selectedAccount!.name}`;
    return `${this.selectedUser!.label} en ${this.selectedAccount!.name}`;
  }

  private resetForm(): void {
    this.title = '';
    this.message = '';
    this.actionUrl = '';
  }

  getSeverityTag(severity: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
      info: 'info',
      success: 'success',
      warning: 'warning',
      error: 'danger',
    };
    return map[severity] ?? 'info';
  }

  getTypeLabel(type: string): string {
    return this.notifTypes.find(t => t.value === type)?.label || type;
  }

  getTargetTypeLabel(targetType: string): string {
    return this.targetTypes.find(t => t.value === targetType)?.label || targetType;
  }
}
