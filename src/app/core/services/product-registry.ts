import { environment } from '../../../environments/environment';

export interface ProductConfig {
  key: string;
  label: string;
  icon: string;
  apiUrl: string;
  routePath: string;
  menuItems?: { label: string; icon: string; routeSuffix: string }[];
}

export const PRODUCTS: ProductConfig[] = [
  {
    key: 'nexivo-gestion',
    label: 'Nexivo Gestión',
    icon: 'pi pi-building',
    apiUrl: environment.managementApiUrl,
    routePath: '/products/nexivo-gestion',
    menuItems: [
      { label: 'Suscripciones',      icon: 'pi pi-list',        routeSuffix: 'subscriptions' },
      { label: 'Planes',             icon: 'pi pi-tag',         routeSuffix: 'plans' },
      { label: 'Panel Admin',        icon: 'pi pi-home',        routeSuffix: 'panel-admin' },
      { label: 'Cuentas',            icon: 'pi pi-briefcase',   routeSuffix: 'accounts' },
      { label: 'Gestión Suscrip.',   icon: 'pi pi-credit-card', routeSuffix: 'subscription-management' },
      { label: 'API Keys',           icon: 'pi pi-key',         routeSuffix: 'api-keys' },
      { label: 'Referidos',          icon: 'pi pi-share-alt',   routeSuffix: 'referrals' },
      { label: 'Notificaciones',     icon: 'pi pi-bell',        routeSuffix: 'notifications' },
      { label: 'Chat soporte',       icon: 'pi pi-comments',    routeSuffix: 'chat' },
      { label: 'Config chat',        icon: 'pi pi-cog',         routeSuffix: 'chat-config' },
      { label: 'Demos',              icon: 'pi pi-desktop',     routeSuffix: 'demos' },
    ],
  },
  {
    key: 'nexivo-turnos',
    label: 'Nexivo Turnos',
    icon: 'pi pi-calendar',
    apiUrl: environment.turnosApiUrl,
    routePath: '/products/nexivo-turnos',
  },
];
