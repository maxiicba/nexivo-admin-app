import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { NexivoTurnosAdminService } from '../services/nexivo-turnos-admin.service';

type SeriesKey = 'mrrMonthly' | 'churnMonthly' | 'trialConversionMonthly' | 'newSubsMonthly';

/** Una celda de la tira de KPIs: valor actual, variación real contra el mes anterior y sparkline. */
interface Kpi {
  label: string;
  value: string;
  /** Texto de la variación ("+8,2%", "-0,4pp") o null si no hay mes anterior. */
  delta: string | null;
  /** Si la variación es buena para el negocio (el churn que baja es bueno). */
  good: boolean | null;
  foot: string;
  spark: string;
}

@Component({
  selector: 'app-turnos-metrics',
  standalone: true,
  imports: [CommonModule, FormsModule, ChartModule, DropdownModule, ButtonModule, ToastModule, SkeletonModule],
  providers: [MessageService],
  templateUrl: './turnos-metrics.component.html',
  styleUrls: ['./turnos-metrics.component.scss'],
})
export class TurnosMetricsComponent implements OnInit {
  loading = false;
  metrics: any = null;
  kpis: Kpi[] = [];

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

  // Common chart options (se completan con los colores del tema en buildCharts)
  baseOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'bottom' } },
  };
  barOptions: any = {};
  stackedBarOptions: any = {};
  pieOptions: any = {};

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
        if (!m.noData) {
          this.buildCharts(m);
          this.buildKpis();
        }
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

  // ── Tema: canvas no lee variables CSS, así que se leen una vez acá ─────────
  private token(name: string, fallback: string): string {
    const v = getComputedStyle(document.body).getPropertyValue(name).trim();
    return v || fallback;
  }

  private alpha(hex: string, a: number): string {
    const m = /^#([0-9a-f]{6})$/i.exec(hex);
    if (!m) return hex;
    const n = parseInt(m[1], 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }

  private buildCharts(m: any): void {
    const c1 = this.token('--c-chart-1', '#0f2a47');
    const c2 = this.token('--c-chart-2', '#ffb547');
    const c3 = this.token('--c-chart-3', '#5b84ad');
    const c4 = this.token('--c-chart-4', '#0f7a4f');
    const c5 = this.token('--c-chart-5', '#a8361f');
    const c6 = this.token('--c-chart-6', '#0b5f8a');
    const grid = this.token('--c-chart-grid', 'rgba(10, 22, 40, 0.08)');
    const ink2 = this.token('--c-ink-2', '#45546a');
    const ink3 = this.token('--c-ink-3', '#7f8ca0');
    const font = { family: this.token('--c-font', 'Geist, sans-serif'), size: 11 };
    const palette = [c1, c2, c3, c4, c6, c5, ink3];

    const scale = {
      grid: { color: grid, drawTicks: false },
      border: { display: false },
      ticks: { color: ink3, font, padding: 6 },
    };
    this.baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { color: ink2, font, usePointStyle: true, pointStyle: 'circle', boxWidth: 6, boxHeight: 6, padding: 14 },
        },
        tooltip: { backgroundColor: '#0a1628', titleFont: font, bodyFont: font, padding: 10, cornerRadius: 8, boxPadding: 4 },
      },
      scales: { x: { ...scale, grid: { display: false } }, y: scale },
      elements: {
        bar: { borderRadius: 4, borderSkipped: false },
        line: { borderWidth: 2 },
        point: { radius: 0, hoverRadius: 4 },
      },
    };
    // Barras: la escala x con `offset` deja medio paso a cada lado; sin eso la
    // primera y la última barra quedan cortadas contra el borde.
    this.barOptions = {
      ...this.baseOptions,
      scales: { ...this.baseOptions.scales, x: { ...this.baseOptions.scales.x, offset: true } },
    };
    this.stackedBarOptions = {
      ...this.baseOptions,
      scales: { x: { ...this.baseOptions.scales.x, offset: true, stacked: true }, y: { ...this.baseOptions.scales.y, stacked: true } },
    };
    this.pieOptions = {
      ...this.baseOptions,
      scales: {},
      cutout: '62%',
    };

    const labels: string[] = m.mrrMonthly.map((p: any) => p.month);

    this.mrrChart = {
      labels,
      datasets: [{
        label: 'MRR (ARS)',
        data: m.mrrMonthly.map((p: any) => p.value),
        borderColor: c1,
        backgroundColor: this.alpha(c1, 0.08),
        tension: 0.3, fill: true,
      }],
    };

    this.newSubsChart = {
      labels,
      datasets: [{
        label: 'Nuevas suscripciones',
        data: m.newSubsMonthly.map((p: any) => p.value),
        backgroundColor: c1,
        maxBarThickness: 28,
      }],
    };

    this.churnChart = {
      labels,
      datasets: [{
        label: 'Churn (%)',
        data: m.churnMonthly.map((p: any) => p.value),
        borderColor: c5,
        backgroundColor: this.alpha(c5, 0.08),
        tension: 0.3, fill: true,
      }],
    };

    this.conversionChart = {
      labels,
      datasets: [{
        label: 'Conversión trial → active (%)',
        data: m.trialConversionMonthly.map((p: any) => p.value),
        backgroundColor: c4,
        maxBarThickness: 28,
      }],
    };

    this.planDistChart = {
      labels: m.planDistribution.map((p: any) => p.displayName),
      datasets: [{
        data: m.planDistribution.map((p: any) => p.count),
        backgroundColor: palette.slice(0, m.planDistribution.length),
        borderWidth: 0,
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
        maxBarThickness: 28,
      })),
    };

    this.ltvByPlanChart = {
      labels: m.ltvByPlan.map((p: any) => p.displayName),
      datasets: [{
        label: 'LTV (ARS)',
        data: m.ltvByPlan.map((p: any) => p.ltv),
        backgroundColor: c3,
        maxBarThickness: 40,
      }],
    };
  }

  // ── KPIs: todo sale de la serie real, nada fijo ───────────────────────────
  private series(key: SeriesKey): number[] {
    const s = this.metrics?.[key];
    return Array.isArray(s) ? s.map((p: any) => Number(p?.value ?? 0)) : [];
  }

  private previousValue(key: SeriesKey): number | null {
    const s = this.series(key);
    return s.length >= 2 ? s[s.length - 2] : null;
  }

  /** Path SVG (viewBox 0 0 200 40) de la serie; vacío si no hay al menos 2 puntos. */
  private sparkPath(values: number[]): string {
    if (values.length < 2) return '';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const step = 200 / (values.length - 1);
    return values
      .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(36 - ((v - min) / span) * 32).toFixed(1)}`)
      .join(' ');
  }

  private pctDelta(cur: number, prev: number | null): string | null {
    if (prev === null || prev === 0) return null;
    const d = ((cur - prev) / prev) * 100;
    return `${d >= 0 ? '+' : ''}${d.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%`;
  }

  private ppDelta(cur: number, prev: number | null): string | null {
    if (prev === null) return null;
    const d = cur - prev;
    return `${d >= 0 ? '+' : ''}${d.toLocaleString('es-AR', { maximumFractionDigits: 1 })}pp`;
  }

  private buildKpis(): void {
    const mrr = this.latestValue('mrrMonthly');
    const mrrPrev = this.previousValue('mrrMonthly');
    const churn = this.latestValue('churnMonthly');
    const churnPrev = this.previousValue('churnMonthly');
    const conv = this.latestValue('trialConversionMonthly');
    const convPrev = this.previousValue('trialConversionMonthly');

    this.kpis = [
      {
        label: 'MRR',
        value: this.formatCompact(mrr),
        delta: this.pctDelta(mrr, mrrPrev),
        good: mrrPrev === null ? null : mrr >= mrrPrev,
        foot: 'ingreso recurrente del último mes',
        spark: this.sparkPath(this.series('mrrMonthly')),
      },
      {
        label: 'ARR',
        value: this.formatCompact(mrr * 12),
        delta: this.pctDelta(mrr, mrrPrev),
        good: mrrPrev === null ? null : mrr >= mrrPrev,
        foot: 'el MRR actual sostenido 12 meses',
        spark: this.sparkPath(this.series('mrrMonthly').map(v => v * 12)),
      },
      {
        label: 'Churn mensual',
        value: this.formatPercent(churn),
        delta: this.ppDelta(churn, churnPrev),
        good: churnPrev === null ? null : churn <= churnPrev,
        foot: 'suscripciones que se dieron de baja',
        spark: this.sparkPath(this.series('churnMonthly')),
      },
      {
        label: 'Conversión trial',
        value: this.formatPercent(conv),
        delta: this.ppDelta(conv, convPrev),
        good: convPrev === null ? null : conv >= convPrev,
        foot: 'pruebas que pasaron a pagar',
        spark: this.sparkPath(this.series('trialConversionMonthly')),
      },
    ];
  }

  /** Frase de la banda: por qué el número importa este mes. */
  get bandWhy(): string {
    const mrr = this.latestValue('mrrMonthly');
    const prev = this.previousValue('mrrMonthly');
    const churn = this.latestValue('churnMonthly');
    if (prev === null) {
      return `Es el primer mes con datos en el rango. Churn del mes: ${this.formatPercent(churn)}.`;
    }
    const diff = mrr - prev;
    const dir = diff >= 0 ? 'subió' : 'bajó';
    return `El MRR ${dir} ${this.formatCompact(Math.abs(diff))} contra el mes anterior, con un churn de ${this.formatPercent(churn)}: ` +
      `${churn > 5 ? 'por encima del 5%, las bajas se están comiendo el crecimiento.' : 'las bajas están bajo control.'}`;
  }

  // Helpers for KPI summary cards
  latestValue(key: 'mrrMonthly' | 'churnMonthly' | 'trialConversionMonthly'): number {
    const series = this.metrics?.[key];
    if (!Array.isArray(series) || series.length === 0) return 0;
    return Number(series[series.length - 1]?.value ?? 0);
  }

  formatCompact(val: number): string {
    const n = Number(val ?? 0);
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
    return `$${n.toLocaleString('es-AR')}`;
  }

  formatPercent(val: number): string {
    return `${Number(val ?? 0).toFixed(1)}%`;
  }

  exportCsv(): void {
    this.messageService.add({ severity: 'info', summary: 'Próximamente', detail: 'Exportación CSV' });
  }
}
