import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { TabViewModule } from 'primeng/tabview';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PaginatorModule } from 'primeng/paginator';
import { DividerModule } from 'primeng/divider';
import { ConfirmationService, MessageService } from 'primeng/api';

import { AdminPanelService } from '../services/admin-panel.service';
import { ManagementSubscriptionService } from '../services/management-subscription.service';
import { DemosService } from '../services/demos.service';
import {
  AdminDashboardStats,
  AccountSummary,
  AccountDetail,
  ActivityLogEntry,
  AccountNote,
  StoreOverview,
} from '../interfaces/admin-panel.interface';
import { AdminPayment, PaymentStats, TransferSettings } from '../interfaces/subscription.interface';
import { environment } from '../../../../environments/environment';

interface DropdownOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-panel-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, ButtonModule, DialogModule,
    InputTextModule, InputSwitchModule, InputTextareaModule, DropdownModule,
    TagModule, TabViewModule, CalendarModule,
    ToastModule, TooltipModule, ConfirmDialogModule,
    PaginatorModule, DividerModule, RouterModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './panel-admin.component.html',
})
export class PanelAdminComponent implements OnInit {
  // Dashboard
  stats: AdminDashboardStats | null = null;
  loadingDashboard = false;

  // Accounts
  accounts: AccountSummary[] = [];
  loadingAccounts = false;
  showDetailDialog = false;
  accountDetail: AccountDetail | null = null;
  loadingDetail = false;

  // Stores
  storesMap: Map<string, StoreOverview> = new Map();
  loadingStores = false;
  detailStore: any = null;
  loadingDetailStore = false;

  // Activity
  activityLogs: ActivityLogEntry[] = [];
  activityTotal = 0;
  activityPage = 1;
  activityLimit = 20;
  loadingActivity = false;
  activityFilters = {
    accountId: null as string | null,
    controller: null as string | null,
    dateRange: [] as Date[],
  };
  controllerOptions: DropdownOption[] = [];
  accountOptions: DropdownOption[] = [];

  // Support
  selectedSupportAccountId: string | null = null;
  notes: AccountNote[] = [];
  loadingNotes = false;
  showNoteDialog = false;
  noteContent = '';
  editingNoteId: string | null = null;
  savingNote = false;

  // Detail notes
  detailNotes: AccountNote[] = [];
  detailNoteContent = '';
  savingDetailNote = false;

  // Payments
  payments: AdminPayment[] = [];
  paymentsTotal = 0;
  paymentsPage = 1;
  paymentsLimit = 20;
  loadingPayments = false;
  paymentStats: PaymentStats | null = null;
  paymentStatusFilter: string | null = null;
  paymentStatusOptions: DropdownOption[] = [
    { label: 'Pendiente', value: 'pending' },
    { label: 'Completado', value: 'completed' },
    { label: 'Vencido', value: 'overdue' },
  ];
  paymentMethodFilter: string | null = null;
  paymentMethodOptions: DropdownOption[] = [
    // 'awaiting_transfer' no es un metodo sino la bandeja de trabajo: transferencias
    // informadas por el cliente que todavia no confirmamos.
    { label: 'Transferencias por confirmar', value: 'awaiting_transfer' },
    { label: 'Transferencia', value: 'bank_transfer' },
    { label: 'Mercado Pago', value: 'mercado_pago' },
  ];

  // Confirmacion manual de transferencia
  showConfirmTransferDialog = false;
  transferPayment: AdminPayment | null = null;
  transferAdminNotes = '';
  confirmingTransfer = false;

  // Datos bancarios que se le muestran al cliente para transferir
  transferSettings: TransferSettings | null = null;
  showTransferSettingsDialog = false;
  editingTransferSettings: Partial<TransferSettings> = {};
  savingTransferSettings = false;

  // Demos
  demoStats: any = {};
  recentDemos: any[] = [];

  constructor(
    private adminService: AdminPanelService,
    private subscriptionService: ManagementSubscriptionService,
    private demosService: DemosService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  onTabChange(event: any): void {
    const index = event.index;
    if (index === 0 && !this.stats) this.loadDashboard();
    if (index === 1 && this.accounts.length === 0) this.loadAccounts();
    if (index === 2 && this.payments.length === 0) {
      this.loadPayments();
      this.loadPaymentStats();
    }
    if (index === 2 && !this.transferSettings) this.loadTransferSettings();
    if (index === 3 && this.activityLogs.length === 0) {
      this.loadActivity();
      this.loadControllerOptions();
    }
    if (index === 4 && this.accountOptions.length === 0) {
      this.loadAccounts();
    }
    if (index === 5 && this.recentDemos.length === 0) {
      this.loadDemoData();
    }
  }

  // ─── Dashboard ───

  loadDashboard(): void {
    this.loadingDashboard = true;
    this.adminService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loadingDashboard = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar estadísticas' });
        this.loadingDashboard = false;
      },
    });
  }

  // ─── Accounts ───

  loadAccounts(): void {
    this.loadingAccounts = true;
    this.adminService.getAccounts().subscribe({
      next: (data) => {
        this.accounts = data;
        this.accountOptions = data.map(a => ({ label: a.name, value: a.id }));
        this.loadingAccounts = false;
        this.loadStoresOverview();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar cuentas' });
        this.loadingAccounts = false;
      },
    });
  }

  loadStoresOverview(): void {
    this.loadingStores = true;
    this.adminService.getStoresOverview().subscribe({
      next: (stores) => {
        this.storesMap = new Map(stores.map(s => [s.accountId, s]));
        this.loadingStores = false;
      },
      error: () => {
        this.loadingStores = false;
      },
    });
  }

  getStoreForAccount(accountId: string): StoreOverview | undefined {
    return this.storesMap.get(accountId);
  }

  getStoreUrl(slug: string): string {
    return `${environment.appUrl}/tienda/${slug}`;
  }

  openAccountDetail(account: AccountSummary): void {
    this.showDetailDialog = true;
    this.loadingDetail = true;
    this.accountDetail = null;
    this.detailNotes = [];
    this.detailNoteContent = '';
    this.detailStore = null;

    this.adminService.getAccountDetail(account.id).subscribe({
      next: (data) => {
        this.accountDetail = data;
        this.loadingDetail = false;
        this.loadDetailNotes(account.id);
        this.loadDetailStore(account.id);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar detalle' });
        this.loadingDetail = false;
      },
    });
  }

  private loadDetailStore(accountId: string): void {
    this.loadingDetailStore = true;
    this.adminService.getAccountStore(accountId).subscribe({
      next: (store) => {
        this.detailStore = store;
        this.loadingDetailStore = false;
      },
      error: () => {
        this.detailStore = null;
        this.loadingDetailStore = false;
      },
    });
  }

  private loadDetailNotes(accountId: string): void {
    this.adminService.getAccountNotes(accountId).subscribe({
      next: (notes) => (this.detailNotes = notes),
      error: () => {},
    });
  }

  addDetailNote(): void {
    if (!this.detailNoteContent.trim() || !this.accountDetail) return;
    this.savingDetailNote = true;
    this.adminService.createNote(this.accountDetail.account.id, this.detailNoteContent).subscribe({
      next: () => {
        this.detailNoteContent = '';
        this.savingDetailNote = false;
        this.loadDetailNotes(this.accountDetail!.account.id);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear nota' });
        this.savingDetailNote = false;
      },
    });
  }

  // ─── Activity ───

  loadActivity(): void {
    this.loadingActivity = true;
    const params: any = {
      page: this.activityPage,
      limit: this.activityLimit,
    };
    if (this.activityFilters.accountId) params.accountId = this.activityFilters.accountId;
    if (this.activityFilters.controller) params.controller = this.activityFilters.controller;
    if (this.activityFilters.dateRange?.length === 2 && this.activityFilters.dateRange[1]) {
      params.dateFrom = this.activityFilters.dateRange[0].toISOString();
      params.dateTo = this.activityFilters.dateRange[1].toISOString();
    }

    this.adminService.getActivityLog(params).subscribe({
      next: (res) => {
        this.activityLogs = res.data;
        this.activityTotal = res.total;
        this.loadingActivity = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar actividad' });
        this.loadingActivity = false;
      },
    });
  }

  loadControllerOptions(): void {
    this.adminService.getControllerList().subscribe({
      next: (list) => {
        this.controllerOptions = list.map(c => ({ label: this.formatControllerName(c), value: c }));
      },
    });
  }

  onActivityPageChange(event: any): void {
    this.activityPage = (event.page || 0) + 1;
    this.activityLimit = event.rows || 20;
    this.loadActivity();
  }

  clearActivityFilters(): void {
    this.activityFilters = { accountId: null, controller: null, dateRange: [] };
    this.activityPage = 1;
    this.loadActivity();
  }

  // ─── Support ───

  onSupportAccountChange(): void {
    if (this.selectedSupportAccountId) {
      this.loadNotes();
    } else {
      this.notes = [];
    }
  }

  loadNotes(): void {
    if (!this.selectedSupportAccountId) return;
    this.loadingNotes = true;
    this.adminService.getAccountNotes(this.selectedSupportAccountId).subscribe({
      next: (data) => {
        this.notes = data;
        this.loadingNotes = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar notas' });
        this.loadingNotes = false;
      },
    });
  }

  openNewNote(): void {
    this.noteContent = '';
    this.editingNoteId = null;
    this.showNoteDialog = true;
  }

  openEditNote(note: AccountNote): void {
    this.noteContent = note.content;
    this.editingNoteId = note.id;
    this.showNoteDialog = true;
  }

  saveNote(): void {
    if (!this.noteContent.trim()) return;
    this.savingNote = true;

    const obs = this.editingNoteId
      ? this.adminService.updateNote(this.editingNoteId, this.noteContent)
      : this.adminService.createNote(this.selectedSupportAccountId!, this.noteContent);

    obs.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: this.editingNoteId ? 'Nota actualizada' : 'Nota creada' });
        this.showNoteDialog = false;
        this.savingNote = false;
        this.loadNotes();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar nota' });
        this.savingNote = false;
      },
    });
  }

  deleteNote(note: AccountNote): void {
    this.confirmationService.confirm({
      message: '¿Eliminar esta nota?',
      header: 'Confirmar',
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.adminService.deleteNote(note.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Nota eliminada' });
            this.loadNotes();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar nota' });
          },
        });
      },
    });
  }

  // ─── Payments ───

  loadPayments(): void {
    this.loadingPayments = true;
    this.subscriptionService.getAllPayments({
      status: this.paymentStatusFilter || undefined,
      method: this.paymentMethodFilter || undefined,
      page: this.paymentsPage,
      limit: this.paymentsLimit,
    }).subscribe({
      next: (res) => {
        this.payments = res.data;
        this.paymentsTotal = res.total;
        this.loadingPayments = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar pagos' });
        this.loadingPayments = false;
      },
    });
  }

  loadPaymentStats(): void {
    this.subscriptionService.getPaymentStats().subscribe({
      next: (stats) => this.paymentStats = stats,
      error: () => {},
    });
  }

  onPaymentsPageChange(event: any): void {
    this.paymentsPage = (event.page || 0) + 1;
    this.paymentsLimit = event.rows || 20;
    this.loadPayments();
  }

  onPaymentStatusFilterChange(): void {
    this.paymentsPage = 1;
    this.loadPayments();
  }

  clearPaymentFilters(): void {
    this.paymentStatusFilter = null;
    this.paymentMethodFilter = null;
    this.paymentsPage = 1;
    this.loadPayments();
  }

  /** Atajo del KPI: deja la tabla mostrando solo lo que hay que confirmar a mano. */
  filterAwaitingTransfers(): void {
    this.paymentStatusFilter = null;
    this.paymentMethodFilter = 'awaiting_transfer';
    this.paymentsPage = 1;
    this.loadPayments();
  }

  // ─── Datos bancarios para transferencias ───

  loadTransferSettings(): void {
    this.subscriptionService.getTransferSettings().subscribe({
      next: (s) => this.transferSettings = s,
      error: () => {},
    });
  }

  /** True si el cliente realmente va a ver la opcion de transferir. */
  get transferSettingsActive(): boolean {
    return !!this.transferSettings?.isEnabled
      && !!(this.transferSettings?.cbu || this.transferSettings?.alias);
  }

  openTransferSettings(): void {
    this.editingTransferSettings = { ...(this.transferSettings || { isEnabled: false }) } as Partial<TransferSettings>;
    this.showTransferSettingsDialog = true;
  }

  saveTransferSettings(): void {
    this.savingTransferSettings = true;
    const d = this.editingTransferSettings;

    this.subscriptionService.updateTransferSettings({
      isEnabled: !!d.isEnabled,
      bankName: d.bankName ?? null,
      accountHolder: d.accountHolder ?? null,
      cuit: d.cuit ?? null,
      cbu: d.cbu ?? null,
      alias: d.alias ?? null,
      accountNumber: d.accountNumber ?? null,
      contact: d.contact ?? null,
      instructions: d.instructions ?? null,
    }).subscribe({
      next: (s) => {
        this.savingTransferSettings = false;
        this.transferSettings = s;
        this.showTransferSettingsDialog = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Datos guardados',
          detail: s.isEnabled ? 'La opcion de transferencia esta activa' : 'La opcion de transferencia quedo desactivada',
        });
      },
      error: (err) => {
        this.savingTransferSettings = false;
        const msg = err?.error?.message;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: Array.isArray(msg) ? msg.join(' ') : (msg || 'No se pudieron guardar los datos'),
        });
      },
    });
  }

  // ─── Confirmacion manual de transferencias ───

  /**
   * Se puede acreditar cualquier pago no completado, lo haya informado el cliente o
   * no: muchos avisan por WhatsApp y la transferencia se carga igual.
   */
  canConfirmTransfer(payment: AdminPayment): boolean {
    return payment.status !== 'completed';
  }

  isAwaitingTransfer(payment: AdminPayment): boolean {
    return !!payment.transferReportedAt && payment.status !== 'completed';
  }

  openConfirmTransfer(payment: AdminPayment): void {
    this.transferPayment = payment;
    this.transferAdminNotes = '';
    this.showConfirmTransferDialog = true;
  }

  confirmTransfer(): void {
    if (!this.transferPayment) return;
    this.confirmingTransfer = true;

    this.subscriptionService.confirmTransferPayment(this.transferPayment.id, this.transferAdminNotes.trim() || undefined)
      .subscribe({
        next: () => {
          this.confirmingTransfer = false;
          this.showConfirmTransferDialog = false;
          this.transferPayment = null;
          this.messageService.add({
            severity: 'success',
            summary: 'Pago acreditado',
            detail: 'La suscripcion avanzo de periodo y la cuenta quedo al dia',
          });
          this.loadPayments();
          this.loadPaymentStats();
        },
        error: (err) => {
          this.confirmingTransfer = false;
          const msg = err?.error?.message;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: Array.isArray(msg) ? msg.join(' ') : (msg || 'No se pudo acreditar el pago'),
          });
        },
      });
  }

  getPaymentMethodLabel(payment: AdminPayment): string {
    return payment.paymentMethod === 'bank_transfer' ? 'Transferencia' : 'Mercado Pago';
  }

  getPaymentStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pendiente', completed: 'Completado', overdue: 'Vencido',
    };
    return map[status] || status;
  }

  getPaymentStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'secondary' | 'info' | 'warning' | 'danger'> = {
      pending: 'warning', completed: 'success', overdue: 'danger',
    };
    return map[status] ?? 'secondary';
  }

  getMpStatusLabel(status: string): string {
    if (!status) return '-';
    const map: Record<string, string> = {
      approved: 'Aprobado', pending: 'Pendiente', rejected: 'Rechazado',
      authorized: 'Autorizado', cancelled: 'Cancelado', paused: 'Pausado',
    };
    return map[status] || status;
  }

  getMpStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    if (!status) return 'secondary';
    const map: Record<string, 'success' | 'secondary' | 'info' | 'warning' | 'danger'> = {
      approved: 'success', authorized: 'success', pending: 'warning',
      rejected: 'danger', cancelled: 'danger', paused: 'warning',
    };
    return map[status] ?? 'secondary';
  }

  getAutoDebitLabel(sub: any): string {
    if (!sub?.mercadoPagoPreapprovalId) return 'Manual';
    const map: Record<string, string> = {
      authorized: 'Automatico', pending: 'Pendiente auth', paused: 'Pausado', cancelled: 'Cancelado',
    };
    return map[sub.mercadoPagoSubscriptionStatus] || 'Manual';
  }

  getAutoDebitSeverity(sub: any): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    if (!sub?.mercadoPagoPreapprovalId) return 'secondary';
    const map: Record<string, 'success' | 'secondary' | 'info' | 'warning' | 'danger'> = {
      authorized: 'success', pending: 'warning', paused: 'warning', cancelled: 'danger',
    };
    return map[sub.mercadoPagoSubscriptionStatus] ?? 'secondary';
  }

  // ─── Demos ───

  loadDemoData() {
    this.demosService.getStats().subscribe(stats => this.demoStats = stats);
    this.demosService.getRequests({ limit: 10 }).subscribe(res => this.recentDemos = res.data || []);
  }

  getDemoStatusLabel(status: string): string {
    const labels: any = { pending: 'Pendiente', contacted: 'Contactado', completed: 'Completada', cancelled: 'Cancelada', rescheduled: 'Reprogramada' };
    return labels[status] || status;
  }

  getDemoStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    const severities: Record<string, 'success' | 'secondary' | 'info' | 'warning' | 'danger'> = {
      pending: 'warning', contacted: 'info', completed: 'success', cancelled: 'danger', rescheduled: 'secondary',
    };
    return severities[status] ?? 'info';
  }

  // ─── Helpers ───

  getModeLabel(mode: string): string {
    const labels: Record<string, string> = { simple: 'Simple', full: 'Completo' };
    return labels[mode] || mode || '-';
  }

  getModeSeverity(mode: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    return mode === 'simple' ? 'warning' : 'info';
  }

  getAuthProviderLabel(provider: string | undefined): string {
    if (provider === 'google') return 'Google';
    return 'Email';
  }

  getAuthProviderSeverity(provider: string | undefined): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    return provider === 'google' ? 'info' : 'secondary';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Activa', inactive: 'Inactiva', suspended: 'Suspendida',
      trialing: 'Trial', past_due: 'Vencida', cancelled: 'Cancelada',
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    const severities: Record<string, 'success' | 'secondary' | 'info' | 'warning' | 'danger'> = {
      active: 'success', inactive: 'secondary', suspended: 'danger',
      trialing: 'info', past_due: 'warning', cancelled: 'danger',
    };
    return severities[status] ?? 'secondary';
  }

  getMethodSeverity(method: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'secondary' | 'info' | 'warning' | 'danger'> = {
      POST: 'success', PUT: 'info', PATCH: 'warning', DELETE: 'danger',
    };
    return map[method] ?? 'secondary';
  }

  formatControllerName(name: string): string {
    return name.replace('Controller', '');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount || 0);
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-AR');
  }

  formatDateTime(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  getNoteAuthor(note: AccountNote): string {
    if (note.createdByUser) {
      const u = note.createdByUser;
      return u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username;
    }
    return 'Admin';
  }

  onGlobalFilter(table: any, event: Event): void {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }
}
