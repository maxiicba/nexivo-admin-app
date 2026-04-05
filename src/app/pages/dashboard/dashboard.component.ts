import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, TagModule],
  templateUrl: './dashboard.component.html',
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

  formatCurrency(val: number): string {
    return `$${Number(val).toLocaleString('es-AR')}`;
  }
}
