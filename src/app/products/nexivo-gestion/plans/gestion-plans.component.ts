import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { TabViewModule } from 'primeng/tabview';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { forkJoin } from 'rxjs';
import { NexivoGestionAdminService } from '../services/nexivo-gestion-admin.service';

export const ACCOUNT_MODE_CONFIG: Record<string, { label: string; icon: string }> = {
  simple: { label: 'Tienda Simple', icon: 'pi pi-shop' },
  full: { label: 'Gestión Completa', icon: 'pi pi-building' },
};

const DEFAULT_PLAN = () => ({
  name: '', displayName: '', description: '',
  monthlyPrice: 0, annualPrice: 0, sortOrder: 0, isActive: true, isRecommended: false,
  accountMode: 'full',
  maxSalePoints: 1, maxUsers: 3, maxProducts: 50, maxClients: 30, maxSuppliers: 10, maxMonthlySales: 100,
  hasOnlineStore: false, hasWhatsapp: false, hasAdvancedReports: false,
  hasCompras: false, hasGastos: false, hasWhatsappAlerts: false, hasGranularPermissions: false,
  hasPayroll: false, hasTreasury: false, hasAiSearch: false, hasVisualEditor: false,
  hasSupportAgent: false, hasMercadoPago: false, hasInvoiceFlexibility: false,
  hasPaymentMethodFees: false, hasStockTransfers: true, hasModuleManagement: true, hasWarehouse: false,
  hasAiDescriptions: false, maxAiDescriptionsDaily: 0, maxAiDescriptionsMonthly: 0,
  hasAiImageAnalysis: false, maxDailyAiAnalysis: 0, maxMonthlyAiAnalysis: 0,
  maxDailyDocumentScan: 0, maxMonthlyDocumentScan: 0,
  hasChatBot: false, maxChatBotQueriesDaily: 0, maxChatBotQueriesMonthly: 0,
  hasMarketing: false, marketingAiDailyLimit: 0, marketingAiMonthlyLimit: 0,
  hasTrialPeriod: false, trialDays: 0,
  features: [] as string[],
});

@Component({
  selector: 'app-gestion-plans',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, DialogModule, InputTextModule,
    InputTextareaModule, InputNumberModule, InputSwitchModule, ToastModule,
    ConfirmDialogModule, CardModule, DividerModule, TagModule, DragDropModule,
    TooltipModule, DropdownModule, TabViewModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './gestion-plans.component.html',
})
export class GestionPlansComponent implements OnInit {
  plans: any[] = [];
  loading = false;
  planDialog = false;
  isNewPlan = true;
  editingPlan: any = DEFAULT_PLAN();
  saving = false;

  accountModeConfig = ACCOUNT_MODE_CONFIG;
  accountModes: string[] = [];
  activePlanTab = 0;
  plansByModeCache: Record<string, any[]> = {};

  constructor(
    private svc: NexivoGestionAdminService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void { this.loadPlans(); }

  loadPlans(): void {
    this.loading = true;
    this.svc.getAllPlans().subscribe({
      next: (data) => {
        this.plans = [...data].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        const modes = [...new Set(data.map((p: any) => p.accountMode || 'full'))] as string[];
        this.accountModes = Object.keys(ACCOUNT_MODE_CONFIG).filter(m => modes.includes(m));
        if (this.accountModes.length === 0) this.accountModes = Object.keys(ACCOUNT_MODE_CONFIG);
        this.rebuildPlansByModeCache();
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  openNew(): void {
    this.editingPlan = DEFAULT_PLAN();
    this.editingPlan.sortOrder = this.plans.length;
    this.isNewPlan = true;
    this.planDialog = true;
  }

  openEdit(plan: any): void {
    this.editingPlan = { ...plan, features: [...(plan.features || [])] };
    this.isNewPlan = false;
    this.planDialog = true;
  }

  get featuresText(): string {
    return (this.editingPlan.features || []).join('\n');
  }

  set featuresText(val: string) {
    this.editingPlan.features = val.split('\n').filter((f: string) => f.trim());
  }

  savePlan(): void {
    this.saving = true;
    const op = this.isNewPlan
      ? this.svc.createPlan(this.editingPlan)
      : this.svc.updatePlan(this.editingPlan.id, this.editingPlan);

    op.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Plan guardado' });
        this.planDialog = false;
        this.saving = false;
        this.loadPlans();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al guardar plan' });
        this.saving = false;
      },
    });
  }

  confirmDelete(plan: any): void {
    this.confirmationService.confirm({
      message: `Eliminar el plan "${plan.displayName}"?`,
      accept: () => {
        this.svc.deletePlan(plan.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Plan eliminado' });
            this.loadPlans();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo eliminar' }),
        });
      },
    });
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

  formatCurrency(val: number): string {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val);
  }

  formatLimit(val: number | undefined): string {
    if (val === undefined || val === null) return '-';
    return val >= 99999 ? 'Ilimitado' : val.toString();
  }

  get accountModeOptions() {
    return Object.entries(ACCOUNT_MODE_CONFIG).map(([value, config]) => ({
      value,
      label: config.label,
    }));
  }

  private rebuildPlansByModeCache(): void {
    this.plansByModeCache = {};
    for (const mode of this.accountModes) {
      this.plansByModeCache[mode] = this.plans
        .filter(p => (p.accountMode || 'full') === mode)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    }
  }

  getPlansByMode(mode: string): any[] {
    return this.plansByModeCache[mode] || [];
  }

  onPlanDrop(event: CdkDragDrop<any[]>, mode: string): void {
    const modePlans = [...this.getPlansByMode(mode)];
    moveItemInArray(modePlans, event.previousIndex, event.currentIndex);

    modePlans.forEach((plan, index) => {
      const original = this.plans.find(p => p.id === plan.id);
      if (original) original.sortOrder = index;
    });
    this.rebuildPlansByModeCache();

    const updates = modePlans.map((p, i) => this.svc.updatePlan(p.id, { sortOrder: i }));
    forkJoin(updates).subscribe({
      next: () => this.messageService.add({ severity: 'success', summary: 'Orden actualizado', life: 2000 }),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error al reordenar', life: 3000 });
        this.loadPlans();
      },
    });
  }
}
