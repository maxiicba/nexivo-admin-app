import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService, ConfirmationService } from 'primeng/api';
import { forkJoin, Subject, Subscription as RxSub } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NexivoTurnosAdminService } from '../services/nexivo-turnos-admin.service';

@Component({
  selector: 'app-turnos-subscriptions',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, TagModule,
    DialogModule, InputTextModule, InputNumberModule, InputTextareaModule, DropdownModule,
    ToastModule, ConfirmDialogModule, CardModule, TooltipModule, CheckboxModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './turnos-subscriptions.component.html',
  styleUrls: ['./turnos-subscriptions.component.scss'],
})
export class TurnosSubscriptionsComponent implements OnInit, OnDestroy {
  subscriptions: any[] = [];
  totalRecords = 0;
  plans: any[] = [];
  plansRaw: any[] = [];
  stats: any = { total: 0, mrr: 0, byStatus: { active: 0, trialing: 0, past_due: 0, suspended: 0 } };
  loading = false;

  // Selection
  selected: any[] = [];

  // Filters
  filters: {
    status?: string; planId?: string; mpStatus?: string; search?: string;
    expiringInDays?: number; sortBy?: string; sortDir?: 'ASC' | 'DESC';
  } = { sortBy: 'createdAt', sortDir: 'DESC' };
  searchInput = '';
  private searchDebounce$ = new Subject<string>();

  // Pagination
  page = 1;
  pageSize = 20;

  // Edit dialog
  editDialog = false;
  editingSub: any = null;
  editData: any = { planId: '', billingCycle: 'monthly', currentPrice: 0 };

  // Cancel dialog
  cancelDialog = false;
  cancelSubId = '';
  cancelReason = '';
  cancelImmediate = false;

  // Bulk dialogs
  bulkCompDialog = false;
  bulkCompMonths = 1;
  bulkCompReason = '';

  bulkStatusDialog = false;
  bulkStatusValue = 'active';
  bulkStatusReason = '';

  bulkNotifyDialog = false;
  bulkNotifyChannel: 'email' | 'whatsapp' = 'email';
  bulkNotifyTemplate = 'reminder';
  bulkNotifyMessage = '';

  // Bulk failures dialog
  bulkFailuresDialog = false;
  bulkFailures: { id: string; error: string }[] = [];

  saving = false;

  // Options
  billingCycleOptions = [
    { label: 'Mensual', value: 'monthly' },
    { label: 'Anual',   value: 'annual' },
  ];
  statusOptions = [
    { label: 'Todos',       value: null },
    { label: 'Prueba',      value: 'trialing' },
    { label: 'Activa',      value: 'active' },
    { label: 'Vencida',     value: 'past_due' },
    { label: 'Suspendida',  value: 'suspended' },
    { label: 'Cancelada',   value: 'cancelled' },
  ];
  bulkStatusOptions = [
    { label: 'Activar',     value: 'active' },
    { label: 'Suspender',   value: 'suspended' },
    { label: 'Marcar past_due', value: 'past_due' },
  ];
  notifyChannelOptions = [
    { label: 'Email',    value: 'email' },
    { label: 'WhatsApp', value: 'whatsapp' },
  ];
  mpStatusOptions = [
    { label: 'Todos',      value: null },
    { label: 'Authorized', value: 'authorized' },
    { label: 'Paused',     value: 'paused' },
    { label: 'Cancelled',  value: 'cancelled' },
    { label: 'Pending',    value: 'pending' },
  ];

  private loadSub?: RxSub;

  constructor(
    private svc: NexivoTurnosAdminService,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {
    this.searchDebounce$.pipe(debounceTime(300), distinctUntilChanged()).subscribe((v) => {
      this.filters.search = v || undefined;
      this.page = 1;
      this.load();
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loadSub?.unsubscribe();
    this.loading = true;
    const listParams = { ...this.filters, page: this.page, pageSize: this.pageSize };
    this.loadSub = forkJoin({
      list: this.svc.listWithFilters(listParams),
      stats: this.svc.getStats(),
      plans: this.svc.getAllPlans(),
    }).subscribe({
      next: ({ list, stats, plans }) => {
        this.subscriptions = list.items ?? [];
        this.totalRecords = list.total ?? 0;
        this.stats = stats;
        this.plansRaw = plans;
        this.plans = plans.map((pl: any) => ({ label: pl.displayName, value: pl.id }));
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  ngOnDestroy(): void {
    this.loadSub?.unsubscribe();
    this.searchDebounce$.complete();
  }

  // ── Filters ────────────────────────────────────────────────────────────────

  onSearchChange(v: string): void {
    this.searchInput = v;
    this.searchDebounce$.next(v);
  }

  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  clearFilters(): void {
    this.filters = { sortBy: 'createdAt', sortDir: 'DESC' };
    this.searchInput = '';
    this.page = 1;
    this.load();
  }

  onPageChange(event: any): void {
    this.page = (event.first / event.rows) + 1;
    this.pageSize = event.rows;
    this.load();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | undefined {
    const map: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
      active: 'success', trialing: 'info', past_due: 'warning', suspended: 'danger', cancelled: 'secondary'
    };
    return map[status];
  }

  statusLabelEs(status: string): string {
    const map: Record<string, string> = {
      active: 'Activa',
      trialing: 'Prueba',
      past_due: 'Vencida',
      suspended: 'Suspendida',
      cancelled: 'Cancelada',
    };
    return map[status] ?? status;
  }

  daysUntil(date: any): number {
    if (!date) return 0;
    return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  daysBadgeSeverity(days: number): 'success' | 'warning' | 'danger' {
    if (days < 0) return 'danger';
    if (days <= 7) return 'warning';
    return 'success';
  }

  formatCurrency(val: number): string {
    return `$${Number(val ?? 0).toLocaleString('es-AR')}`;
  }

  // KPI proportion (% of total) — null when total is 0 to hide the bar
  kpiPct(value: number): number | null {
    const total = this.stats?.total || 0;
    if (!total || !value) return null;
    return Math.min(100, Math.round((Number(value) / total) * 100));
  }

  // Active filter chips (only those that are set)
  get activeFilterChips(): { key: string; label: string }[] {
    const chips: { key: string; label: string }[] = [];
    if (this.filters.search)         chips.push({ key: 'search',          label: `Busqueda: "${this.filters.search}"` });
    if (this.filters.status)         chips.push({ key: 'status',          label: `Estado: ${this.statusLabel(this.filters.status)}` });
    if (this.filters.planId)         chips.push({ key: 'planId',          label: `Plan: ${this.planLabel(this.filters.planId)}` });
    if (this.filters.mpStatus)       chips.push({ key: 'mpStatus',        label: `MP: ${this.filters.mpStatus}` });
    if (this.filters.expiringInDays) chips.push({ key: 'expiringInDays',  label: `Vence en ${this.filters.expiringInDays}d` });
    return chips;
  }

  removeFilter(key: string): void {
    if (key === 'search') {
      this.filters.search = undefined;
      this.searchInput = '';
    } else {
      (this.filters as any)[key] = undefined;
    }
    this.page = 1;
    this.load();
  }

  private statusLabel(value: string): string {
    return this.statusOptions.find((o) => o.value === value)?.label ?? value;
  }

  private planLabel(value: string): string {
    return this.plans.find((o) => o.value === value)?.label ?? value;
  }

  // Initials for business avatar
  initials(name: string | undefined | null): string {
    if (!name) return '?';
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }

  // Stable color hash for the avatar — same business gets same color
  avatarColor(name: string | undefined | null): string {
    if (!name) return '#94a3b8';
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    const palette = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6'];
    return palette[hash % palette.length];
  }

  // ── Row click → detail ─────────────────────────────────────────────────────

  goToDetail(sub: any): void {
    this.router.navigate(['/products/nexivo-turnos/subscriptions', sub.id]);
  }

  // ── Edit ───────────────────────────────────────────────────────────────────

  openEdit(sub: any, $event?: Event): void {
    $event?.stopPropagation();
    this.editingSub = sub;
    this.editData = {
      planId: sub.planId || sub.plan?.id,
      billingCycle: sub.billingCycle || 'monthly',
      currentPrice: sub.currentPrice ?? 0,
    };
    this.editDialog = true;
  }

  onEditPlanChange(): void {
    this.editData.currentPrice = this.suggestedPrice(this.editData.planId, this.editData.billingCycle);
  }

  onEditCycleChange(): void {
    this.editData.currentPrice = this.suggestedPrice(this.editData.planId, this.editData.billingCycle);
  }

  private suggestedPrice(planId: string, cycle: 'monthly' | 'annual'): number {
    const pl = this.plansRaw.find((p) => p.id === planId);
    if (!pl) return this.editData.currentPrice ?? 0;
    return cycle === 'annual' ? Number(pl.annualPrice ?? 0) : Number(pl.monthlyPrice ?? 0);
  }

  saveEdit(): void {
    if (!this.editingSub) return;
    this.saving = true;
    this.svc.updateSubscription(this.editingSub.id, this.editData).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Suscripción actualizada' });
        this.editDialog = false;
        this.saving = false;
        this.load();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' });
        this.saving = false;
      },
    });
  }

  // ── Cancel ─────────────────────────────────────────────────────────────────

  openCancel(sub: any, $event?: Event): void {
    $event?.stopPropagation();
    this.cancelSubId = sub.id;
    this.cancelReason = '';
    this.cancelImmediate = false;
    this.cancelDialog = true;
  }

  confirmCancel(): void {
    const proceed = () => {
      this.saving = true;
      this.svc.cancelSubscription(this.cancelSubId, this.cancelReason, this.cancelImmediate).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Cancelado', detail: this.cancelImmediate ? 'Cancelada inmediatamente' : 'Cancelación marcada al fin del período' });
          this.cancelDialog = false;
          this.saving = false;
          this.load();
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
        header: 'Cancelación inmediata',
        icon: 'pi pi-exclamation-triangle',
        accept: proceed,
      });
    } else {
      proceed();
    }
  }

  // ── Bulk ───────────────────────────────────────────────────────────────────

  openBulkComp(): void {
    if (!this.selected.length) return;
    this.bulkCompMonths = 1;
    this.bulkCompReason = '';
    this.bulkCompDialog = true;
  }

  confirmBulkComp(): void {
    const ids = this.selected.map((s) => s.id);
    const apply = () => {
      this.saving = true;
      this.svc.bulkGrantComp(ids, this.bulkCompMonths, this.bulkCompReason).subscribe({
        next: (res) => {
          this.handleBulkResult(res, 'meses regalados');
          this.bulkCompDialog = false;
          this.saving = false;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Falló la acción masiva' });
          this.saving = false;
        },
      });
    };
    if (ids.length > 10) {
      this.confirmationService.confirm({
        message: `Estás por regalar ${this.bulkCompMonths} mes(es) a ${ids.length} suscripciones. ¿Confirmar?`,
        header: 'Confirmar acción masiva',
        accept: apply,
      });
    } else apply();
  }

  openBulkStatus(): void {
    if (!this.selected.length) return;
    this.bulkStatusValue = 'active';
    this.bulkStatusReason = '';
    this.bulkStatusDialog = true;
  }

  confirmBulkStatus(): void {
    const ids = this.selected.map((s) => s.id);
    const apply = () => {
      this.saving = true;
      this.svc.bulkChangeStatus(ids, this.bulkStatusValue, this.bulkStatusReason).subscribe({
        next: (res) => {
          this.handleBulkResult(res, 'estado actualizado');
          this.bulkStatusDialog = false;
          this.saving = false;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Falló la acción masiva' });
          this.saving = false;
        },
      });
    };
    if (ids.length > 10) {
      this.confirmationService.confirm({
        message: `Estás por cambiar el estado de ${ids.length} suscripciones a "${this.bulkStatusValue}". ¿Confirmar?`,
        header: 'Confirmar acción masiva',
        accept: apply,
      });
    } else apply();
  }

  openBulkNotify(): void {
    if (!this.selected.length) return;
    this.bulkNotifyChannel = 'email';
    this.bulkNotifyTemplate = 'reminder';
    this.bulkNotifyMessage = '';
    this.bulkNotifyDialog = true;
  }

  confirmBulkNotify(): void {
    const ids = this.selected.map((s) => s.id);
    this.saving = true;
    this.svc.bulkNotify(ids, this.bulkNotifyChannel, this.bulkNotifyTemplate, this.bulkNotifyMessage || undefined).subscribe({
      next: (res) => {
        this.handleBulkResult(res, 'notificadas');
        this.bulkNotifyDialog = false;
        this.saving = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Falló la notificación masiva' });
        this.saving = false;
      },
    });
  }

  private handleBulkResult(res: { success: string[]; failed: { id: string; error: string }[] }, verb: string): void {
    const ok = res.success.length;
    const ko = res.failed.length;
    if (ko === 0) {
      this.messageService.add({ severity: 'success', summary: 'OK', detail: `${ok} ${verb}` });
    } else {
      this.bulkFailures = res.failed;
      this.messageService.add({
        severity: 'warn', summary: 'Parcial',
        detail: `${ok} ${verb}, ${ko} fallaron — abrí el detalle para ver`,
        sticky: true,
      });
    }
    this.selected = [];
    this.load();
  }

  openBulkFailures(): void {
    this.bulkFailuresDialog = true;
  }
}
