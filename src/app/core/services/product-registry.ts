import { environment } from '../../../environments/environment';

export interface ProductConfig {
  key: string;
  label: string;
  icon: string;
  apiUrl: string;
  routePath: string;
}

export const PRODUCTS: ProductConfig[] = [
  {
    key: 'nexivo-gestion',
    label: 'Nexivo Gestión',
    icon: 'pi pi-building',
    apiUrl: environment.managementApiUrl,
    routePath: '/products/nexivo-gestion',
  },
  {
    key: 'nexivo-turnos',
    label: 'Nexivo Turnos',
    icon: 'pi pi-calendar',
    apiUrl: environment.turnosApiUrl,
    routePath: '/products/nexivo-turnos',
  },
];
