import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TabViewModule } from 'primeng/tabview';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipModule } from 'primeng/chip';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { forkJoin, Subscription as RxSub } from 'rxjs';
import { NexivoTurnosAdminService } from '../services/nexivo-turnos-admin.service';

const ACTION_LABELS: Record<string, string> = {
  plan_changed: 'Cambio de plan',
  cancelled: 'Cancelación',
  reactivated: 'Reactivada',
  suspended: 'Suspendida',
  comp_granted: 'Tiempo regalado',
  coupon_applied: 'Crédito aplicado',
  payment_retried: 'Reintento de pago',
  payment_refunded: 'Pago reembolsado',
  note_added: 'Nota agregada',
  mp_webhook_received: 'Webhook MP',
  cron_billing_run: 'Cron de facturación',
  trial_expired: 'Trial vencido',
  auto_suspended_past_due: 'Auto suspensión (vencida)',
  bulk_notification_sent: 'Notificación masiva',
};

const ACTION_ICONS: Record<string, string> = {
  plan_changed: 'pi pi-tag',
  cancelled: 'pi pi-ban',
  reactivated: 'pi pi-replay',
  suspended: 'pi pi-pause',
  comp_granted: 'pi pi-gift',
  coupon_applied: 'pi pi-percentage',
  payment_retried: 'pi pi-refresh',
  payment_refunded: 'pi pi-undo',
  note_added: 'pi pi-pencil',
  mp_webhook_received: 'pi pi-bolt',
  cron_billing_run: 'pi pi-clock',
  trial_expired: 'pi pi-hourglass',
  auto_suspended_past_due: 'pi pi-exclamation-triangle',
  bulk_notification_sent: 'pi pi-send',
};

@Component({
  selector: 'app-subscription-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TabViewModule, ButtonModule, TagModule, TableModule,
    CardModule, DialogModule, InputTextModule, InputTextareaModule, InputNumberModule,
    DropdownModule, CheckboxModule, ChipModule, ProgressBarModule, ToastModule, ConfirmDialogModule,
    TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './subscription-detail.component.html',
})
export class SubscriptionDetailComponent implements OnInit, OnDestroy {
  id!: string;
  detail: any = null;
  payments: any[] = [];
  audit: { items: any[]; total: number; page: number; pageSize: number } = { items: [], total: 0, page: 1, pageSize: 50 };
  notes: any[] = [];
  credits: any[] = [];

  loading = false;
  saving = false;
  activeTab = 0;

  // Audit filters
  auditActor: string | null = null;
  auditShowCron = false;

  // Notes
  newNoteBody = '';
  editingNoteId: string | null = null;
  editingNoteBody = '';

  // Dialogs
  grantCompDialog = false;
  grantCompMonths = 1;
  grantCompDays = 0;
  grantCompReason = '';

  applyCreditDialog = false;
  creditAmount = 0;
  creditType: 'fixed' | 'percentage' = 'percentage';
  creditReason = '';

  changeStatusDialog = false;
  newStatus = 'active';
  statusReason = '';

  cancelDialog = false;
  cancelReason = '';
  cancelImmediate = false;

  retryPaymentDialog = false;

  markRefundedDialog = false;
  refundingPayment: any = null;
  refundReason = '';

  manualLinkDialog = false;
  manualLinkResult: { checkoutUrl: string; preferenceId: string } | null = null;

  // Options
  statusOptions = [
    { label: 'Activa',     value: 'active' },
    { label: 'Suspendida', value: 'suspended' },
    { label: 'Vencida',    value: 'past_due' },
    { label: 'Cancelada',  value: 'cancelled' },
  ];
  creditTypeOptions = [
    { label: '% (porcentaje)', value: 'percentage' },
    { label: '$ (monto fijo)', value: 'fixed' },
  ];
  actorFilterOptions = [
    { label: 'Todos',  value: null },
    { label: 'Admin',  value: 'admin' },
    { label: 'Sistema',value: 'system' },
    { label: 'Usuario',value: 'user' },
  ];

  private loadSub?: RxSub;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private svc: NexivoTurnosAdminService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id')!;
    this.loadAll();
  }

  ngOnDestroy(): void {
    this.loadSub?.unsubscribe();
  }

  loadAll(): void {
    this.loading = true;
    this.loadSub?.unsubscribe();
    this.loadSub = forkJoin({
      detail: this.svc.getDetail(this.id),
      payments: this.svc.getPayments(this.id),
      audit: this.svc.getAudit(this.id, this.buildAuditParams()),
      notes: this.svc.getNotes(this.id),
      credits: this.svc.getCredits(this.id),
    }).subscribe({
      next: ({ detail, payments, audit, notes, credits }) => {
        this.detail = detail;
        this.payments = payments;
        this.audit = audit;
        this.notes = notes;
        this.credits = credits;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo cargar' });
      },
    });
  }

  refreshOne(key: 'payments' | 'audit' | 'notes' | 'credits'): void {
    if (key === 'payments') this.svc.getPayments(this.id).subscribe((p) => (this.payments = p));
    if (key === 'audit') this.svc.getAudit(this.id, this.buildAuditParams()).subscribe((a) => (this.audit = a));
    if (key === 'notes') this.svc.getNotes(this.id).subscribe((n) => (this.notes = n));
    if (key === 'credits') this.svc.getCredits(this.id).subscribe((c) => (this.credits = c));
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  back(): void {
    this.router.navigate(['/products/nexivo-turnos/subscriptions']);
  }

  formatCurrency(v: number): string {
    return `$${Number(v ?? 0).toLocaleString('es-AR')}`;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | undefined {
    const map: Record<string, any> = {
      active: 'success', trialing: 'info', past_due: 'warning', suspended: 'danger', cancelled: 'secondary',
    };
    return map[status];
  }

  getPaymentTypeSeverity(type: string): 'success' | 'info' | 'warning' | 'secondary' {
    if (type === 'comp') return 'info';
    if (type === 'refund') return 'warning';
    return 'success';
  }

  getPaymentStatusSeverity(status: string): 'success' | 'warning' | 'danger' | 'secondary' {
    if (status === 'approved') return 'success';
    if (status === 'pending') return 'warning';
    if (status === 'rejected') return 'danger';
    return 'secondary';
  }

  usagePct(used: number, limit: number): number {
    if (!limit || limit < 0) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  }

  usageColor(pct: number): string {
    if (pct >= 90) return 'var(--red-500, #ef4444)';
    if (pct >= 70) return 'var(--yellow-500, #f59e0b)';
    return 'var(--green-500, #10b981)';
  }

  moduleKeys(modules: any): string[] {
    return Object.keys(modules || {}).filter((k) => modules[k]);
  }

  moduleLabel(key: string): string {
    const labels: Record<string, string> = {
      whatsappBotSequential: 'WhatsApp Bot Secuencial',
      whatsappBotAI: 'WhatsApp Bot AI',
      onlineBooking: 'Reservas online',
      promotions: 'Promociones',
      coupons: 'Cupones',
      advancedReports: 'Reportes avanzados',
      finance: 'Finanzas',
      customBranding: 'Branding custom',
      audioTranscription: 'Transcripción audio',
      serviceInfoBot: 'Bot info servicios',
      leaderboard: 'Leaderboard',
      cashbox: 'Caja',
    };
    return labels[key] || key;
  }

  actionLabel(action: string): string {
    return ACTION_LABELS[action] || action;
  }

  actionIcon(action: string): string {
    return ACTION_ICONS[action] || 'pi pi-circle';
  }

  jsonPreview(meta: any): string {
    if (!meta || Object.keys(meta).length === 0) return '';
    return JSON.stringify(meta, null, 2);
  }

  // ── Audit filters ──────────────────────────────────────────────────────────

  private buildAuditParams() {
    const params: any = { page: 1, pageSize: 50 };
    if (this.auditActor) params.actor = this.auditActor;
    if (!this.auditShowCron) params.excludeActions = 'cron_billing_run';
    return params;
  }

  applyAuditFilters(): void {
    this.refreshOne('audit');
  }

  // ── Grant comp ─────────────────────────────────────────────────────────────

  openGrantComp(): void {
    this.grantCompMonths = 1;
    this.grantCompDays = 0;
    this.grantCompReason = '';
    this.grantCompDialog = true;
  }

  confirmGrantComp(): void {
    if (this.grantCompMonths <= 0 && this.grantCompDays <= 0) return;
    if (!this.grantCompReason.trim()) return;
    this.saving = true;
    this.svc.grantComp(this.id, {
      months: this.grantCompMonths || undefined,
      days: this.grantCompDays || undefined,
      reason: this.grantCompReason,
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Tiempo regalado' });
        this.grantCompDialog = false;
        this.saving = false;
        this.loadAll();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo aplicar' });
        this.saving = false;
      },
    });
  }

  // ── Apply credit ───────────────────────────────────────────────────────────

  openApplyCredit(): void {
    this.creditAmount = 0;
    this.creditType = 'percentage';
    this.creditReason = '';
    this.applyCreditDialog = true;
  }

  confirmApplyCredit(): void {
    if (this.creditAmount <= 0) return;
    if (this.creditType === 'percentage' && this.creditAmount > 100) return;
    if (!this.creditReason.trim()) return;
    this.saving = true;
    this.svc.applyCredit(this.id, { amount: this.creditAmount, type: this.creditType, reason: this.creditReason }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Crédito aplicado' });
        this.applyCreditDialog = false;
        this.saving = false;
        this.refreshOne('credits');
        this.refreshOne('audit');
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo aplicar' });
        this.saving = false;
      },
    });
  }

  deleteCredit(credit: any): void {
    this.confirmationService.confirm({
      message: '¿Eliminar este crédito pendiente?',
      accept: () => {
        this.svc.deleteCredit(credit.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Crédito eliminado' });
            this.refreshOne('credits');
            this.refreshOne('audit');
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo eliminar' }),
        });
      },
    });
  }

  // ── Change status ──────────────────────────────────────────────────────────

  openChangeStatus(): void {
    this.newStatus = this.detail?.subscription?.status === 'active' ? 'suspended' : 'active';
    this.statusReason = '';
    this.changeStatusDialog = true;
  }

  confirmChangeStatus(): void {
    if (!this.statusReason.trim()) return;
    this.saving = true;
    this.svc.changeStatus(this.id, { status: this.newStatus, reason: this.statusReason }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Estado actualizado' });
        this.changeStatusDialog = false;
        this.saving = false;
        this.loadAll();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo cambiar' });
        this.saving = false;
      },
    });
  }

  reactivate(): void {
    this.confirmationService.confirm({
      message: '¿Reactivar la suscripción?',
      accept: () => {
        this.svc.reactivate(this.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Reactivada' });
            this.loadAll();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo reactivar' }),
        });
      },
    });
  }

  // ── Cancel ─────────────────────────────────────────────────────────────────

  openCancel(): void {
    this.cancelReason = '';
    this.cancelImmediate = false;
    this.cancelDialog = true;
  }

  confirmCancel(): void {
    const proceed = () => {
      this.saving = true;
      this.svc.cancelSubscription(this.id, this.cancelReason || 'Cancelled by admin', this.cancelImmediate).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'OK', detail: this.cancelImmediate ? 'Cancelada inmediatamente' : 'Marcada para cancelar al fin del período' });
          this.cancelDialog = false;
          this.saving = false;
          this.loadAll();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo cancelar' });
          this.saving = false;
        },
      });
    };
    if (this.cancelImmediate) {
      this.confirmationService.confirm({
        message: 'Esto cancelará la suscripción AHORA y revocará el preapproval en MercadoPago. ¿Continuar?',
        accept: proceed,
      });
    } else proceed();
  }

  // ── Reconcile + manual link + mark refunded ────────────────────────────────

  reconcilePayments(): void {
    this.confirmationService.confirm({
      message: '¿Buscar pagos en MercadoPago que no llegaron por webhook?',
      accept: () => {
        this.svc.reconcilePayments(this.id).subscribe({
          next: (res) => {
            this.messageService.add({ severity: 'success', summary: 'OK', detail: `Recuperados: ${res.recovered}` });
            this.refreshOne('payments');
            this.refreshOne('audit');
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Falló reconcile' }),
        });
      },
    });
  }

  generateManualLink(): void {
    this.svc.generateManualCheckoutLink(this.id).subscribe({
      next: (res) => {
        this.manualLinkResult = res;
        this.manualLinkDialog = true;
        this.refreshOne('audit');
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo generar' }),
    });
  }

  copyManualLink(): void {
    if (!this.manualLinkResult) return;
    navigator.clipboard.writeText(this.manualLinkResult.checkoutUrl).then(() => {
      this.messageService.add({ severity: 'info', summary: 'Copiado', detail: 'Link al portapapeles' });
    });
  }

  openMarkRefunded(p: any): void {
    this.refundingPayment = p;
    this.refundReason = '';
    this.markRefundedDialog = true;
  }

  confirmMarkRefunded(): void {
    if (!this.refundingPayment || !this.refundReason.trim()) return;
    this.confirmationService.confirm({
      message: 'Esto marcará el pago como REEMBOLSADO en el sistema. El refund real debe hacerse en la consola de MercadoPago. ¿Continuar?',
      accept: () => {
        this.saving = true;
        this.svc.markRefunded(this.refundingPayment.id, this.refundReason).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Marcado como reembolsado' });
            this.markRefundedDialog = false;
            this.saving = false;
            this.refreshOne('payments');
            this.refreshOne('audit');
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo marcar' });
            this.saving = false;
          },
        });
      },
    });
  }

  // ── Notes ──────────────────────────────────────────────────────────────────

  addNote(): void {
    if (!this.newNoteBody.trim()) return;
    this.saving = true;
    this.svc.createNote(this.id, this.newNoteBody).subscribe({
      next: () => {
        this.newNoteBody = '';
        this.saving = false;
        this.refreshOne('notes');
        this.refreshOne('audit');
      },
      error: () => { this.saving = false; },
    });
  }

  startEditNote(note: any): void {
    this.editingNoteId = note.id;
    this.editingNoteBody = note.body;
  }

  cancelEditNote(): void {
    this.editingNoteId = null;
    this.editingNoteBody = '';
  }

  saveEditNote(): void {
    if (!this.editingNoteId || !this.editingNoteBody.trim()) return;
    this.svc.updateNote(this.editingNoteId, this.editingNoteBody).subscribe({
      next: () => {
        this.editingNoteId = null;
        this.editingNoteBody = '';
        this.refreshOne('notes');
      },
    });
  }

  deleteNote(note: any): void {
    this.confirmationService.confirm({
      message: '¿Eliminar esta nota?',
      accept: () => {
        this.svc.deleteNote(note.id).subscribe({
          next: () => this.refreshOne('notes'),
        });
      },
    });
  }
}
