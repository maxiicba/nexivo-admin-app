import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { TabViewModule } from 'primeng/tabview';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { InputSwitchModule } from 'primeng/inputswitch';
import { MessageService } from 'primeng/api';
import { ReferralService } from '../services/referral.service';
import { Referrer, ReferralCommission, ReferralDashboardStats, CommissionType } from '../interfaces/referral.interface';
import { LowercaseDirective } from '../accounts/lowercase.directive';

@Component({
  selector: 'app-referrals',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
    InputTextModule, InputNumberModule, DropdownModule, TagModule,
    TabViewModule, ToastModule, TooltipModule, CheckboxModule, InputSwitchModule, LowercaseDirective,
  ],
  providers: [MessageService],
  templateUrl: './referrals.component.html',
})
export class ReferralsComponent implements OnInit {

  private destroyRef = inject(DestroyRef);

  // Dashboard
  stats: ReferralDashboardStats = { totalReferrers: 0, activeReferrals: 0, pendingCommissions: 0, paidCommissions: 0 };

  // Referrers
  referrers: Referrer[] = [];
  loadingReferrers = false;

  // Commissions
  commissions: ReferralCommission[] = [];
  loadingCommissions = false;
  commissionStatusFilter = '';
  selectedCommissions: ReferralCommission[] = [];

  // Referrer dialog
  showReferrerDialog = false;
  editingReferrer = false;
  referrer: Partial<Referrer> = {};
  savingReferrer = false;

  // Detail dialog
  showDetailDialog = false;
  selectedReferrer: Referrer | null = null;

  commissionTypeOptions = [
    { label: '% primer pago', value: CommissionType.PERCENTAGE_FIRST },
    { label: '% recurrente', value: CommissionType.PERCENTAGE_RECURRING },
    { label: 'Monto fijo', value: CommissionType.FIXED_AMOUNT },
  ];

  commissionStatusOptions = [
    { label: 'Todos', value: '' },
    { label: 'Pendientes', value: 'pending' },
    { label: 'Pagadas', value: 'paid' },
  ];

  constructor(
    private referralService: ReferralService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadReferrers();
  }

  // ─── DATA LOADING ──────────────────────────────────────

  loadStats(): void {
    this.referralService.getDashboardStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => this.stats = stats,
        error: () => this.toast('error', 'Error al cargar estadísticas'),
      });
  }

  loadReferrers(): void {
    this.loadingReferrers = true;
    this.referralService.getReferrers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.referrers = data; this.loadingReferrers = false; },
        error: () => { this.loadingReferrers = false; this.toast('error', 'Error al cargar referentes'); },
      });
  }

  loadCommissions(): void {
    this.loadingCommissions = true;
    this.referralService.getAllCommissions(this.commissionStatusFilter || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.commissions = data; this.loadingCommissions = false; },
        error: () => { this.loadingCommissions = false; this.toast('error', 'Error al cargar comisiones'); },
      });
  }

  onTabChange(event: any): void {
    if (event.index === 1 && this.commissions.length === 0) {
      this.loadCommissions();
    }
  }

  // ─── REFERRER CRUD ─────────────────────────────────────

  openNewReferrer(): void {
    this.referrer = {
      discountPercentage: 10,
      commissionType: CommissionType.PERCENTAGE_FIRST,
      commissionValue: 10,
    };
    this.editingReferrer = false;
    this.showReferrerDialog = true;
  }

  openEditReferrer(r: Referrer): void {
    this.referrer = { ...r };
    this.editingReferrer = true;
    this.showReferrerDialog = true;
  }

  saveReferrer(): void {
    if (!this.referrer.name?.trim()) {
      this.toast('warn', 'El nombre es requerido');
      return;
    }

    this.savingReferrer = true;
    const obs = this.editingReferrer
      ? this.referralService.updateReferrer(this.referrer.id!, this.referrer)
      : this.referralService.createReferrer(this.referrer);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.showReferrerDialog = false;
        this.savingReferrer = false;
        this.loadReferrers();
        this.loadStats();
        this.toast('success', this.editingReferrer ? 'Referente actualizado' : 'Referente creado');
      },
      error: (err) => {
        this.savingReferrer = false;
        this.toast('error', err?.error?.message || 'Error al guardar referente');
      },
    });
  }

  toggleReferrerStatus(r: Referrer): void {
    this.referralService.toggleStatus(r.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          const idx = this.referrers.findIndex(ref => ref.id === r.id);
          if (idx >= 0) this.referrers[idx].status = updated.status;
          this.toast('success', `Referente ${updated.status === 'active' ? 'activado' : 'desactivado'}`);
        },
        error: () => this.toast('error', 'Error al cambiar estado'),
      });
  }

  // ─── DETAIL DIALOG ────────────────────────────────────

  openDetail(r: Referrer): void {
    this.referralService.getReferrer(r.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail) => {
          this.selectedReferrer = detail;
          this.showDetailDialog = true;
        },
        error: () => this.toast('error', 'Error al cargar detalle'),
      });
  }

  // ─── COMMISSIONS ──────────────────────────────────────

  filterCommissions(): void {
    this.loadCommissions();
  }

  markSelectedPaid(): void {
    const ids = this.selectedCommissions
      .filter(c => c.status === 'pending')
      .map(c => c.id);

    if (ids.length === 0) {
      this.toast('warn', 'No hay comisiones pendientes seleccionadas');
      return;
    }

    this.referralService.markCommissionsPaid(ids)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.selectedCommissions = [];
          this.loadCommissions();
          this.loadStats();
          this.toast('success', `${ids.length} comisiones marcadas como pagadas`);
        },
        error: () => this.toast('error', 'Error al marcar comisiones'),
      });
  }

  // ─── HELPERS ──────────────────────────────────────────

  copyCode(code: string): void {
    navigator.clipboard.writeText(code);
    this.toast('success', 'Código copiado al portapapeles');
  }

  getCommissionTypeLabel(type: CommissionType): string {
    const opt = this.commissionTypeOptions.find(o => o.value === type);
    return opt?.label || type;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'danger';
      case 'pending': return 'warning';
      case 'paid': return 'success';
      default: return 'info';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'pending': return 'Pendiente';
      case 'paid': return 'Pagado';
      default: return status;
    }
  }

  formatPercent(val: number): string {
    return Number(val).toString();
  }

  formatCurrency(val: number): string {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val);
  }

  private toast(severity: string, detail: string): void {
    this.messageService.add({ severity, summary: severity === 'error' ? 'Error' : 'Info', detail, life: 3000 });
  }
}
