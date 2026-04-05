import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ManagementSubscriptionService } from '../services/management-subscription.service';
import { Plan, Subscription, DashboardStats } from '../interfaces/subscription.interface';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { BadgeModule } from 'primeng/badge';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TabViewModule } from 'primeng/tabview';
import { ChipModule } from 'primeng/chip';
import { TooltipModule } from 'primeng/tooltip';
import { InputSwitchModule } from 'primeng/inputswitch';

export const ACCOUNT_MODE_CONFIG: Record<string, { label: string; icon: string }> = {
  simple: { label: 'Tienda Simple', icon: 'pi pi-shop' },
  full: { label: 'Gestión Completa', icon: 'pi pi-building' },
};

@Component({
  selector: 'app-subscription-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
    InputTextModule, InputNumberModule, InputTextareaModule, DropdownModule,
    BadgeModule, CardModule, DividerModule, ToastModule, ConfirmDialogModule,
    TagModule, TabViewModule, ChipModule, TooltipModule, InputSwitchModule,
    DragDropModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './subscription-management.component.html',
  styleUrls: ['./subscription-management.component.scss']
})
export class SubscriptionManagementComponent implements OnInit {
  // Dashboard
  stats: DashboardStats = { total: 0, byStatus: { trialing: 0, active: 0, past_due: 0, suspended: 0, cancelled: 0 }, mrr: 0, accountsWithoutSubscription: 0 };

  // Subscriptions
  subscriptions: Subscription[] = [];
  accountsWithoutSub: any[] = [];

  // Plans
  plans: Plan[] = [];
  accountModeConfig = ACCOUNT_MODE_CONFIG;
  accountModes: string[] = [];
  activePlanTab: number = 0;
  plansByModeCache: Record<string, Plan[]> = {};
  planDialog = false;
  editingPlan: Partial<Plan> = {};
  isNewPlan = true;

  // Assign subscription dialog
  assignDialog = false;
  assignData = { accountId: '', planId: '', billingCycle: 'monthly', freeMonths: 0 };

  // Edit subscription dialog
  editSubDialog = false;
  editingSub: Subscription | null = null;
  editSubData = { planId: '', billingCycle: 'monthly', currentPrice: 0, freeMonths: 0 };

  // Cancel dialog
  cancelDialog = false;
  cancelSubId = '';
  cancelReason = '';

  saving = false;
  loadingSubs = false;

  billingCycleOptions = [
    { label: 'Mensual', value: 'monthly' },
    { label: 'Anual', value: 'annual' }
  ];

  constructor(
    private subscriptionService: ManagementSubscriptionService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.subscriptionService.getDashboardStats().subscribe(s => this.stats = s);
    this.subscriptionService.getSubscriptions().subscribe(s => this.subscriptions = s);
    this.subscriptionService.getPlans().subscribe(p => {
      this.plans = p;
      const modes = [...new Set(p.map(plan => plan.accountMode || 'full'))] as string[];
      this.accountModes = Object.keys(ACCOUNT_MODE_CONFIG).filter(m => modes.includes(m));
      if (this.accountModes.length === 0) this.accountModes = Object.keys(ACCOUNT_MODE_CONFIG);
      this.rebuildPlansByModeCache();
    });
    this.subscriptionService.getAccountsWithoutSubscription().subscribe(a => this.accountsWithoutSub = a);
  }

  // ─── Status helpers ───
  getStatusLabel(status: string): string {
    const map: any = { trialing: 'Prueba', active: 'Activa', past_due: 'Vencida', suspended: 'Suspendida', cancelled: 'Cancelada' };
    return map[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
      trialing: 'info', active: 'success', past_due: 'warning', suspended: 'danger', cancelled: 'danger'
    };
    return map[status] || 'info';
  }

  // ─── Plans CRUD ───
  openNewPlan() {
    this.editingPlan = {
      name: '', displayName: '', description: '',
      monthlyPrice: 0, annualPrice: 0, features: [],
      maxSalePoints: 1, maxUsers: 3,
      maxProducts: 50, maxClients: 30, maxSuppliers: 10, maxMonthlySales: 100,
      hasOnlineStore: false, hasWhatsapp: false, hasAdvancedReports: false,
      hasCompras: false, hasGastos: false, hasWhatsappAlerts: false, hasGranularPermissions: false, hasPayroll: false, hasTreasury: false,
      hasMarketing: false, marketingAiDailyLimit: 0, marketingAiMonthlyLimit: 0,
      hasAiDescriptions: false, maxAiDescriptionsDaily: 0, maxAiDescriptionsMonthly: 0,
      hasAiImageAnalysis: false, maxMonthlyAiAnalysis: 0, maxDailyAiAnalysis: 0,
      hasChatBot: false, hasSupportAgent: false, hasMercadoPago: false, hasInvoiceFlexibility: false, hasPaymentMethodFees: false, hasStockTransfers: true, hasModuleManagement: true, hasWarehouse: false,
      maxChatBotQueriesDaily: 0, maxChatBotQueriesMonthly: 0,
      maxDailyDocumentScan: 0, maxMonthlyDocumentScan: 0,
      hasTrialPeriod: false, trialDays: 0,
      isActive: true, isRecommended: false, sortOrder: 0, accountMode: 'full'
    };
    this.isNewPlan = true;
    this.planDialog = true;
  }

  editPlan(plan: Plan) {
    this.editingPlan = { ...plan, features: [...(plan.features || [])] };
    this.isNewPlan = false;
    this.planDialog = true;
  }

  get featuresText(): string {
    return (this.editingPlan.features || []).join('\n');
  }

  set featuresText(val: string) {
    this.editingPlan.features = val.split('\n').filter(f => f.trim());
  }

  savePlan() {
    const obs = this.isNewPlan
      ? this.subscriptionService.createPlan(this.editingPlan)
      : this.subscriptionService.updatePlan(this.editingPlan.id!, this.editingPlan);

    obs.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Plan guardado' });
        this.planDialog = false;
        this.loadAll();
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al guardar plan' })
    });
  }

  confirmDeletePlan(plan: Plan) {
    this.confirmationService.confirm({
      message: `Eliminar el plan "${plan.displayName}"?`,
      accept: () => {
        this.subscriptionService.deletePlan(plan.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Plan eliminado' });
            this.loadAll();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo eliminar' })
        });
      }
    });
  }

  // ─── Assign subscription ───
  openAssignDialog(account?: any) {
    this.assignData = {
      accountId: account?.id || '',
      planId: this.plans.length > 0 ? this.plans[0].id : '',
      billingCycle: 'monthly',
      freeMonths: 0
    };
    this.assignDialog = true;
  }

  assignSubscription() {
    this.subscriptionService.createSubscription(this.assignData).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Suscripcion creada' });
        this.assignDialog = false;
        this.loadAll();
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al crear suscripcion' })
    });
  }

  // ─── Edit subscription ───
  openEditSub(sub: Subscription) {
    this.editingSub = sub;
    this.editSubData = {
      planId: sub.plan?.id || '',
      billingCycle: sub.billingCycle,
      currentPrice: sub.currentPrice,
      freeMonths: sub.freeMonths
    };
    this.editSubDialog = true;
  }

  saveSubEdit() {
    if (!this.editingSub) return;
    this.saving = true;
    const payload = {
      planId: this.editSubData.planId || null,
      billingCycle: this.editSubData.billingCycle,
      currentPrice: Number(this.editSubData.currentPrice) || 0,
      freeMonths: Number(this.editSubData.freeMonths) || 0,
    };
    this.subscriptionService.updateSubscription(this.editingSub.id, payload).subscribe({
      next: () => {
        this.saving = false;
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Suscripcion actualizada correctamente' });
        this.editSubDialog = false;
        this.loadAll();
      },
      error: (err) => {
        this.saving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo actualizar la suscripcion' });
      }
    });
  }

  // ─── Cancel / Reactivate ───
  openCancelDialog(sub: Subscription) {
    this.cancelSubId = sub.id;
    this.cancelReason = '';
    this.cancelDialog = true;
  }

  confirmCancel() {
    this.subscriptionService.cancelSubscription(this.cancelSubId, this.cancelReason).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Suscripcion cancelada' });
        this.cancelDialog = false;
        this.loadAll();
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message })
    });
  }

  reactivate(sub: Subscription) {
    this.confirmationService.confirm({
      message: `Reactivar la suscripcion de "${sub.account?.name}"?`,
      accept: () => {
        this.subscriptionService.reactivateSubscription(sub.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Suscripcion reactivada' });
            this.loadAll();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message })
        });
      }
    });
  }

  formatCurrency(val: number): string {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val);
  }

  formatLimit(val: number | undefined): string {
    if (val === undefined || val === null) return '-';
    return val >= 99999 ? 'Ilimitado' : val.toString();
  }

  generateFeatures(): void {
    const p = this.editingPlan;
    const lines: string[] = [];

    const fmt = (val: number | undefined) => !val || val >= 99999 ? 'Ilimitados' : `${val}`;
    const fmtSingle = (val: number | undefined) => !val || val >= 99999 ? 'Ilimitados' : `${val}`;

    lines.push(`${fmtSingle(p.maxSalePoints)} punto${(p.maxSalePoints ?? 0) !== 1 ? 's' : ''} de venta`);
    lines.push(`${fmtSingle(p.maxUsers)} usuario${(p.maxUsers ?? 0) !== 1 ? 's' : ''}`);
    lines.push(`${fmt(p.maxProducts)} productos`);
    lines.push(`${fmt(p.maxClients)} clientes`);
    lines.push(`${fmt(p.maxSuppliers)} proveedores`);
    lines.push(`${fmt(p.maxMonthlySales)} ventas por mes`);

    if (p.hasCompras) lines.push('Modulo de Compras');
    if (p.hasGastos) lines.push('Modulo de Gastos');
    if (p.hasOnlineStore) lines.push('Tienda online');
    if (p.hasWhatsapp) lines.push('Alertas por WhatsApp');
    if (p.hasAdvancedReports) lines.push('Reportes avanzados');
    if (p.hasWhatsappAlerts) lines.push('Alertas por WhatsApp');
    if (p.hasGranularPermissions) lines.push('Gestión de Roles');
    if (p.hasPayroll) lines.push('RRHH / Liquidaciones');
    if (p.hasTreasury) lines.push('Tesorería');
    if (p.hasVisualEditor) lines.push('Editor visual de tienda');
    if (p.hasAiDescriptions) {
      const daily = p.maxAiDescriptionsDaily && p.maxAiDescriptionsDaily < 99999 ? `${p.maxAiDescriptionsDaily}/dia` : '';
      const monthly = p.maxAiDescriptionsMonthly && p.maxAiDescriptionsMonthly < 99999 ? `${p.maxAiDescriptionsMonthly}/mes` : '';
      const limits = [daily, monthly].filter(Boolean).join(', ');
      lines.push(`Descripcion con IA${limits ? ` (${limits})` : ''}`);
    }

    if (p.hasChatBot) {
      const daily = p.maxChatBotQueriesDaily && p.maxChatBotQueriesDaily < 99999 ? `${p.maxChatBotQueriesDaily}/dia` : '';
      const monthly = p.maxChatBotQueriesMonthly && p.maxChatBotQueriesMonthly < 99999 ? `${p.maxChatBotQueriesMonthly}/mes` : '';
      const limits = [daily, monthly].filter(Boolean).join(', ');
      lines.push(`Chat Bot${limits ? ` (${limits})` : ''}`);
    }
    if (p.hasMarketing) {
      const daily = p.marketingAiDailyLimit && p.marketingAiDailyLimit < 99999 ? `${p.marketingAiDailyLimit}/dia` : '';
      const monthly = p.marketingAiMonthlyLimit && p.marketingAiMonthlyLimit < 99999 ? `${p.marketingAiMonthlyLimit}/mes` : '';
      const limits = [daily, monthly].filter(Boolean).join(', ');
      lines.push(`Marketing${limits ? ` (IA: ${limits})` : ''}`);
    }
    if (p.hasSupportAgent) lines.push('Soporte con agente');
    if (p.hasMercadoPago) lines.push('Mercado Pago');
    lines.push('Soporte por email');

    this.editingPlan.features = lines;
  }

  private rebuildPlansByModeCache(): void {
    this.plansByModeCache = {};
    for (const mode of this.accountModes) {
      this.plansByModeCache[mode] = this.plans
        .filter(p => (p.accountMode || 'full') === mode)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    }
  }

  getPlansByMode(mode: string): Plan[] {
    return this.plansByModeCache[mode] || [];
  }

  get accountModeOptions() {
    return Object.entries(ACCOUNT_MODE_CONFIG).map(([value, config]) => ({
      value,
      label: config.label,
    }));
  }

  onPlanDrop(event: CdkDragDrop<Plan[]>, mode: string): void {
    const modePlans = [...this.getPlansByMode(mode)];
    moveItemInArray(modePlans, event.previousIndex, event.currentIndex);

    // Optimistic update
    modePlans.forEach((plan, index) => {
      const original = this.plans.find(p => p.id === plan.id);
      if (original) original.sortOrder = index;
    });
    this.rebuildPlansByModeCache();

    const planIds = modePlans.map(p => p.id);
    this.subscriptionService.reorderPlans(planIds).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Orden actualizado', life: 2000 });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error al reordenar', life: 3000 });
        this.loadAll();
      }
    });
  }
}
