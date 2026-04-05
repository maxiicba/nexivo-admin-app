import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { PRODUCTS } from '../core/services/product-registry';

@Component({
  selector: 'app-menu',
  templateUrl: './app.menu.component.html',
})
export class AppMenuComponent implements OnInit {
  model: MenuItem[] = [];

  ngOnInit() {
    this.model = [
      {
        label: 'General',
        items: [
          { label: 'Dashboard', icon: 'pi pi-home', routerLink: ['/'] },
        ]
      },
      {
        label: 'Productos',
        items: PRODUCTS.map(p => ({
          label: p.label,
          icon: p.icon,
          items: [
            { label: 'Suscripciones', icon: 'pi pi-list', routerLink: [`${p.routePath}/subscriptions`] },
            { label: 'Planes', icon: 'pi pi-tag', routerLink: [`${p.routePath}/plans`] },
          ]
        }))
      }
    ];
  }
}
