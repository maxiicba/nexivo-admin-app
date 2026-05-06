import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { NexivoTurnosAdminService } from '../services/nexivo-turnos-admin.service';

@Component({
  selector: 'app-turnos-metrics',
  standalone: true,
  imports: [CommonModule, FormsModule, ChartModule, DropdownModule, CardModule, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './turnos-metrics.component.html',
})
export class TurnosMetricsComponent implements OnInit {
  loading = false;
  metrics: any = null;

  rangeMonths = 12;
  rangeOptions = [
    { label: 'Últimos 3 meses',  value: 3 },
    { label: 'Últimos 6 meses',  value: 6 },
    { label: 'Últimos 12 meses', value: 12 },
    { label: 'Últimos 24 meses', value: 24 },
  ];

  // Chart data
  mrrChart: any = null;
  newSubsChart: any = null;
  churnChart: any = null;
  conversionChart: any = null;
  planDistChart: any = null;
  mrrByPlanChart: any = null;
  ltvByPlanChart: any = null;

  // Common chart options
  baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'bottom' } },
  };

  constructor(
    private svc: NexivoTurnosAdminService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  onRangeChange(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    const { from, to } = this.computeRange(this.rangeMonths);
    this.svc.getMetrics(from, to).subscribe({
      next: (m) => {
        this.metrics = m;
        if (!m.noData) this.buildCharts(m);
        this.loading = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo cargar' });
        this.loading = false;
      },
    });
  }

  private computeRange(months: number): { from: string; to: string } {
    const now = new Date();
    const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const fromDate = new Date(now);
    fromDate.setMonth(fromDate.getMonth() - (months - 1));
    const from = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}`;
    return { from, to };
  }

  private buildCharts(m: any): void {
    const labels: string[] = m.mrrMonthly.map((p: any) => p.month);
    const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

    this.mrrChart = {
      labels,
      datasets: [{
        label: 'MRR (ARS)',
        data: m.mrrMonthly.map((p: any) => p.value),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.1)',
        tension: 0.3, fill: true,
      }],
    };

    this.newSubsChart = {
      labels,
      datasets: [{
        label: 'Nuevas suscripciones',
        data: m.newSubsMonthly.map((p: any) => p.value),
        backgroundColor: '#10b981',
      }],
    };

    this.churnChart = {
      labels,
      datasets: [{
        label: 'Churn (%)',
        data: m.churnMonthly.map((p: any) => p.value),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.1)',
        tension: 0.3, fill: true,
      }],
    };

    this.conversionChart = {
      labels,
      datasets: [{
        label: 'Conversión trial → active (%)',
        data: m.trialConversionMonthly.map((p: any) => p.value),
        backgroundColor: '#8b5cf6',
      }],
    };

    this.planDistChart = {
      labels: m.planDistribution.map((p: any) => p.displayName),
      datasets: [{
        data: m.planDistribution.map((p: any) => p.count),
        backgroundColor: palette.slice(0, m.planDistribution.length),
      }],
    };

    // Stacked bar: MRR por plan por mes
    const planNames = new Set<string>();
    m.mrrByPlanMonthly.forEach((row: any) => Object.keys(row.byPlan || {}).forEach((k) => planNames.add(k)));
    const planList = Array.from(planNames);
    this.mrrByPlanChart = {
      labels,
      datasets: planList.map((plan, i) => ({
        label: plan,
        data: m.mrrByPlanMonthly.map((row: any) => row.byPlan?.[plan] ?? 0),
        backgroundColor: palette[i % palette.length],
      })),
    };

    this.ltvByPlanChart = {
      labels: m.ltvByPlan.map((p: any) => p.displayName),
      datasets: [{
        label: 'LTV (ARS)',
        data: m.ltvByPlan.map((p: any) => p.ltv),
        backgroundColor: '#06b6d4',
      }],
    };
  }

  get stackedBarOptions() {
    return {
      ...this.baseOptions,
      scales: { x: { stacked: true }, y: { stacked: true } },
    };
  }
}
