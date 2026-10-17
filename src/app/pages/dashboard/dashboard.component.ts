import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';
import { PRODUCTS, ProductConfig } from '../../core/services/product-registry';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface ProductStats {
  product: ProductConfig;
  total: number;
  mrr: number;
  active: number;
  trialing: number;
  past_due: number;
  suspended: number;
  error: boolean;
}

/** Tramo de la barra de distribución por estado. */
interface StatusSlice {
  key: 'active' | 'trialing' | 'past_due' | 'suspended';
  label: string;
  tone: 'success' | 'sky' | 'warn' | 'danger';
  value: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SkeletonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  productStats: ProductStats[] = [];
  totalMrr = 0;
  loading = true;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const requests = PRODUCTS.map(product =>
      this.http.get<any>(`${product.apiUrl}/subscriptions/admin/stats`, { withCredentials: true }).pipe(
        catchError(() => of(null))
      )
    );

    forkJoin(requests).subscribe(results => {
      this.productStats = PRODUCTS.map((product, i) => {
        const data = results[i];
        return {
          product,
          total: data?.total ?? 0,
          mrr: data?.mrr ?? 0,
          active: data?.byStatus?.active ?? 0,
          trialing: data?.byStatus?.trialing ?? 0,
          past_due: data?.byStatus?.past_due ?? 0,
          suspended: data?.byStatus?.suspended ?? 0,
          error: !data,
        };
      });
      this.totalMrr = this.productStats.reduce((sum, s) => sum + s.mrr, 0);
      this.loading = false;
    });
  }

  // ── Totales entre productos (sólo los que respondieron) ──────────────────
  private sum(key: 'total' | 'active' | 'trialing' | 'past_due' | 'suspended'): number {
    return this.productStats.filter(s => !s.error).reduce((acc, s) => acc + s[key], 0);
  }

  get totalSubs(): number { return this.sum('total'); }
  get totalActive(): number { return this.sum('active'); }
  get totalTrialing(): number { return this.sum('trialing'); }
  get totalPastDue(): number { return this.sum('past_due'); }
  get totalSuspended(): number { return this.sum('suspended'); }

  get onlineProducts(): number { return this.productStats.filter(s => !s.error).length; }
  get offlineProducts(): ProductStats[] { return this.productStats.filter(s => s.error); }

  /** Producto con más vencidas: a dónde manda el botón de la banda. */
  get worstProduct(): ProductStats | null {
    const candidates = this.productStats.filter(s => !s.error && s.past_due > 0);
    if (!candidates.length) return null;
    return candidates.reduce((a, b) => (b.past_due > a.past_due ? b : a));
  }

  /** MRR promedio por suscripción activa: dice cuánto vale cada cobro que se cae. */
  get avgTicket(): number {
    return this.totalActive ? Math.round(this.totalMrr / this.totalActive) : 0;
  }

  slices(s: ProductStats): StatusSlice[] {
    return [
      { key: 'active', label: 'Activas', tone: 'success', value: s.active },
      { key: 'trialing', label: 'En prueba', tone: 'sky', value: s.trialing },
      { key: 'past_due', label: 'Vencidas', tone: 'warn', value: s.past_due },
      { key: 'suspended', label: 'Suspendidas', tone: 'danger', value: s.suspended },
    ];
  }

  pct(value: number, total: number): number {
    return total ? Math.round((value / total) * 100) : 0;
  }

  formatCurrency(val: number): string {
    return `$${Number(val).toLocaleString('es-AR')}`;
  }
}
