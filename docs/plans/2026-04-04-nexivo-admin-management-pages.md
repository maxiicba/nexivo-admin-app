# Management Pages Migration — nexivo-admin-app Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring all 10 management-app admin pages into nexivo-admin-app as additional routes under Nexivo Gestión, keeping management-app unchanged as fallback.

**Architecture:** Each page is a standalone Angular component placed under `src/app/products/nexivo-gestion/{page}/`. Services are copied from management-app to `src/app/products/nexivo-gestion/services/` and adapted by replacing `environment.apiUrl` → `environment.managementApiUrl`. The sidebar is updated by extending `ProductConfig` with an optional `menuItems` array and hardcoding the full Nexivo Gestión submenu.

**Tech Stack:** Angular 17 standalone components, PrimeNG 17.18.x, PrimeFlex 3, socket.io-client (Chat), @angular/cdk/drag-drop (SubscriptionManagement), Reactive Forms (Accounts).

---

## Source paths (management-app)

All source files are under:
```
c:/Users/maxi_/Documents/SIETEMA GESTION/management-app/src/app/
```

Key source files:
| Page | Component TS | Service |
|------|-------------|---------|
| Panel Admin | `pages/admin-panel/admin-panel.component.ts` + `.html` | `services/admin-panel.service.ts` |
| Cuentas | `pages/accounts/accounts.component.ts` + `.html` | `services/accounts.service.ts` |
| Gestión Suscripciones | `pages/subscription-management/subscription-management.component.ts` + `.html` | `services/subscription.service.ts` |
| API Keys | `pages/integration-api-keys/integration-api-keys.component.ts` + `.html` | `services/integration-api-key.service.ts` |
| Referidos | `pages/referral-management/referral-management.component.ts` + `.html` | `services/referral.service.ts` |
| Notificaciones | `pages/send-notifications/send-notifications.component.ts` + `.html` | (uses HttpClient directly + AccountsService) |
| Chat soporte | `pages/chat/chat-dashboard/chat-dashboard.component.ts` + `.html` | `services/chat.service.ts` |
| Config chat | `pages/chat/chat-config/chat-config.component.ts` + `.html` | `services/chat.service.ts` (shared) |
| Demos | `pages/demo-management/demo-management.component.ts` + `.html` | `services/demos.service.ts` |

Interface files to copy:
- `interfaces/admin-panel.interface.ts`
- `interfaces/account.interface.ts`
- `interfaces/referral.interface.ts`
- `interfaces/notification.interface.ts`
- `common/interfaces/chat.interface.ts`
- Subscription + Plan interfaces are inline in `services/subscription.service.ts` — extract to a file

---

## Task 1: Create interfaces directory and copy interface files

**Files:**
- Create: `src/app/products/nexivo-gestion/interfaces/admin-panel.interface.ts`
- Create: `src/app/products/nexivo-gestion/interfaces/account.interface.ts`
- Create: `src/app/products/nexivo-gestion/interfaces/referral.interface.ts`
- Create: `src/app/products/nexivo-gestion/interfaces/notification.interface.ts`
- Create: `src/app/products/nexivo-gestion/interfaces/chat.interface.ts`
- Create: `src/app/products/nexivo-gestion/interfaces/subscription.interface.ts`

**Step 1: Copy interface files**

Copy each file verbatim from management-app, with no import changes needed (interfaces don't import from environment):

```bash
cp "c:/Users/maxi_/Documents/SIETEMA GESTION/management-app/src/app/interfaces/admin-panel.interface.ts" \
   "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/interfaces/admin-panel.interface.ts"

cp "c:/Users/maxi_/Documents/SIETEMA GESTION/management-app/src/app/interfaces/account.interface.ts" \
   "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/interfaces/account.interface.ts"

cp "c:/Users/maxi_/Documents/SIETEMA GESTION/management-app/src/app/interfaces/referral.interface.ts" \
   "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/interfaces/referral.interface.ts"

cp "c:/Users/maxi_/Documents/SIETEMA GESTION/management-app/src/app/interfaces/notification.interface.ts" \
   "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/interfaces/notification.interface.ts"
```

For chat interface, source is at `common/interfaces/chat.interface.ts`:
```bash
cp "c:/Users/maxi_/Documents/SIETEMA GESTION/management-app/src/app/common/interfaces/chat.interface.ts" \
   "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/interfaces/chat.interface.ts"
```

**Step 2: Create subscription.interface.ts**

Read `management-app/src/app/services/subscription.service.ts` and extract all exported interfaces (`Plan`, `Subscription`, `DashboardStats`, etc.) into the new file:

```typescript
// src/app/products/nexivo-gestion/interfaces/subscription.interface.ts
export interface Plan { /* copy from subscription.service.ts */ }
export interface Subscription { /* copy */ }
export interface DashboardStats { /* copy */ }
// ... all other exported interfaces from subscription.service.ts
```

**Step 3: Verify**

```bash
ls "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/interfaces/"
```
Expected: 6 files.

**Step 4: Commit**

```bash
cd "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app"
git add src/app/products/nexivo-gestion/interfaces/
git commit -m "feat: add interfaces for management page migration"
```

---

## Task 2: Copy and adapt services (all except chat)

**Files:**
- Create: `src/app/products/nexivo-gestion/services/admin-panel.service.ts`
- Create: `src/app/products/nexivo-gestion/services/accounts.service.ts`
- Create: `src/app/products/nexivo-gestion/services/management-subscription.service.ts`
- Create: `src/app/products/nexivo-gestion/services/integration-api-key.service.ts`
- Create: `src/app/products/nexivo-gestion/services/referral.service.ts`
- Create: `src/app/products/nexivo-gestion/services/demos.service.ts`

**Step 1: Copy each service from management-app**

Copy each service file verbatim, then apply two substitutions:
1. `environment.apiUrl` → `environment.managementApiUrl`
2. Update interface import paths: `'../interfaces/...'` → `'../interfaces/...'` (same depth, already correct if placed in `services/`)
3. Update the environment import: `'src/environments/environment'` → `'../../../../environments/environment'`

Repeat for each service:
```
admin-panel.service.ts   → services/admin-panel.service.ts
accounts.service.ts      → services/accounts.service.ts
subscription.service.ts  → services/management-subscription.service.ts  (rename to avoid conflict with existing gestion service)
integration-api-key.service.ts → services/integration-api-key.service.ts
referral.service.ts      → services/referral.service.ts
demos.service.ts         → services/demos.service.ts
```

**Step 2: In management-subscription.service.ts — fix class name**

The original is `SubscriptionService`. Rename class to `ManagementSubscriptionService` to avoid collision:

```typescript
@Injectable({ providedIn: 'root' })
export class ManagementSubscriptionService {
  // ...same body
}
```

Also update Plan/Subscription imports to point to the local interfaces file:
```typescript
import { Plan, Subscription, DashboardStats } from '../interfaces/subscription.interface';
```
Remove the inline interface declarations (they are now in the interfaces file).

**Step 3: In accounts.service.ts — fix Account import**

Update import:
```typescript
import { Account } from '../interfaces/account.interface';
```

**Step 4: In admin-panel.service.ts — fix interface imports**

```typescript
import {
  AdminDashboardStats, AccountSummary, AccountDetail,
  ActivityLogResponse, AccountNote, StoreOverview,
} from '../interfaces/admin-panel.interface';
```

**Step 5: In referral.service.ts — fix interface imports**

```typescript
import { Referrer, ReferralCommission, ReferralDashboardStats, ReferralCodeValidation } from '../interfaces/referral.interface';
```

**Step 6: Build check**

```bash
cd "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app"
npx ng build --configuration=development 2>&1 | grep -E "ERROR|error TS" | head -30
```
Expected: no errors in the services. (Components not yet imported so no build errors expected here.)

**Step 7: Commit**

```bash
git add src/app/products/nexivo-gestion/services/
git commit -m "feat: copy and adapt management-api services"
```

---

## Task 3: Copy and adapt ChatService

**Files:**
- Create: `src/app/products/nexivo-gestion/services/chat.service.ts`

The management-app ChatService depends on `ContextService` (account switching) and `SoundService` (notification sounds). Neither exists in nexivo-admin-app. The superadmin in nexivo-admin-app always sees all conversations without account context.

**Step 1: Copy chat.service.ts from management-app**

```bash
cp "c:/Users/maxi_/Documents/SIETEMA GESTION/management-app/src/app/services/chat.service.ts" \
   "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/services/chat.service.ts"
```

**Step 2: Read the full file, then apply these adaptations**

Open `src/app/products/nexivo-gestion/services/chat.service.ts` and make these changes:

a) **Remove ContextService and SoundService imports** — delete their import lines.

b) **Remove ContextService and SoundService from constructor** — constructor becomes just `HttpClient` and `AuthService`.

c) **Remove `contextSub`** — delete the `private contextSub: Subscription` property and any `this.contextSub = ...` assignment in the constructor.

d) **In `ngOnDestroy`** — remove `this.contextSub?.unsubscribe()`.

e) **Remove any sound calls** — `this.soundService.play*(...)` calls become no-ops (just delete them).

f) **Socket connection** — The connect method takes `accountId`. For superadmin, keep as-is; the chat dashboard can pass `null` to see all conversations (the management-api superadmin socket endpoint should support this). If there's a guard: `if (!accountId) return;` — remove that guard.

g) **Fix environment and interface imports:**
```typescript
import { environment } from '../../../../environments/environment';
import { Conversation, ChatMessage, ChatMessagePayload, SupportAgent, Ticket, ChatConfig, ChatFaqEntry, ChatStats } from '../interfaces/chat.interface';
```

h) **Fix AuthService import:**
```typescript
import { AuthService } from '../../../core/services/auth.service';
```

**Step 3: Add `wsUrl` to environment**

Read `src/environments/environment.ts`, add `wsUrl` pointing to management-api base (without `/api`):

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  managementApiUrl: 'http://localhost:3000/api',
  turnosApiUrl: 'http://localhost:3001/api',
  ssoUrl: 'http://localhost:4200',
  wsUrl: 'http://localhost:3000',   // <-- add this
  localLogin: true,
};
```

Do the same for `environment.prod.ts` with the production WebSocket URL (use same as managementApiUrl base, e.g. `https://api.nexivo.app`).

**Step 4: In chat.service.ts — update socket URL**

Replace any `io(environment.apiUrl.replace('/api', ''), ...)` or `io(environment.apiUrl, ...)` with:
```typescript
this.socket = io(environment.wsUrl, { ... });
```

**Step 5: Build check**

```bash
cd "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app"
npx ng build --configuration=development 2>&1 | grep -E "ERROR|error TS" | head -30
```

**Step 6: Commit**

```bash
git add src/app/products/nexivo-gestion/services/chat.service.ts src/environments/
git commit -m "feat: adapt chat service for nexivo-admin-app"
```

---

## Task 4: Update ProductConfig + menu for expanded Nexivo Gestión sidebar

**Files:**
- Modify: `src/app/core/services/product-registry.ts`
- Modify: `src/app/layout/app.menu.component.ts`

**Step 1: Read product-registry.ts**

Current `ProductConfig` interface has: `key`, `label`, `icon`, `apiUrl`, `routePath`.

**Step 2: Add optional menuItems to ProductConfig**

```typescript
export interface ProductConfig {
  key: string;
  label: string;
  icon: string;
  apiUrl: string;
  routePath: string;
  menuItems?: { label: string; icon: string; routeSuffix: string }[];
}
```

**Step 3: Add menuItems to nexivo-gestion product definition**

```typescript
{
  key: 'nexivo-gestion',
  label: 'Nexivo Gestión',
  icon: 'pi pi-building',
  apiUrl: environment.managementApiUrl,
  routePath: '/products/nexivo-gestion',
  menuItems: [
    { label: 'Suscripciones',      icon: 'pi pi-list',          routeSuffix: 'subscriptions' },
    { label: 'Planes',             icon: 'pi pi-tag',           routeSuffix: 'plans' },
    { label: 'Panel Admin',        icon: 'pi pi-home',          routeSuffix: 'panel-admin' },
    { label: 'Cuentas',            icon: 'pi pi-briefcase',     routeSuffix: 'accounts' },
    { label: 'Gestión Suscrip.',   icon: 'pi pi-credit-card',   routeSuffix: 'subscription-management' },
    { label: 'API Keys',           icon: 'pi pi-key',           routeSuffix: 'api-keys' },
    { label: 'Referidos',          icon: 'pi pi-share-alt',     routeSuffix: 'referrals' },
    { label: 'Notificaciones',     icon: 'pi pi-bell',          routeSuffix: 'notifications' },
    { label: 'Chat soporte',       icon: 'pi pi-comments',      routeSuffix: 'chat' },
    { label: 'Config chat',        icon: 'pi pi-cog',           routeSuffix: 'chat-config' },
    { label: 'Demos',              icon: 'pi pi-desktop',       routeSuffix: 'demos' },
  ],
},
```

**Step 4: Update app.menu.component.ts to use custom menuItems**

```typescript
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
        items: p.menuItems
          ? p.menuItems.map(item => ({
              label: item.label,
              icon: item.icon,
              routerLink: [`${p.routePath}/${item.routeSuffix}`],
            }))
          : [
              { label: 'Suscripciones', icon: 'pi pi-list', routerLink: [`${p.routePath}/subscriptions`] },
              { label: 'Planes',        icon: 'pi pi-tag',  routerLink: [`${p.routePath}/plans`] },
            ],
      })),
    },
  ];
}
```

**Step 5: Build check**

```bash
cd "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app"
npx ng build --configuration=development 2>&1 | grep -E "ERROR|error TS" | head -30
```
Expected: no errors.

**Step 6: Commit**

```bash
git add src/app/core/services/product-registry.ts src/app/layout/app.menu.component.ts
git commit -m "feat: extend ProductConfig with custom menuItems, update Nexivo Gestión sidebar"
```

---

## Task 5: Admin Panel component

**Files:**
- Create: `src/app/products/nexivo-gestion/panel-admin/panel-admin.component.ts`
- Create: `src/app/products/nexivo-gestion/panel-admin/panel-admin.component.html`
- Modify: `src/app/products/nexivo-gestion/nexivo-gestion.module.ts`

**Step 1: Copy component from management-app**

```bash
mkdir -p "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/panel-admin"
cp "c:/Users/maxi_/Documents/SIETEMA GESTION/management-app/src/app/pages/admin-panel/admin-panel.component.ts" \
   "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/panel-admin/panel-admin.component.ts"
cp "c:/Users/maxi_/Documents/SIETEMA GESTION/management-app/src/app/pages/admin-panel/admin-panel.component.html" \
   "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/panel-admin/panel-admin.component.html"
```

**Step 2: Adapt panel-admin.component.ts**

Read the file, then apply these changes:

a) **Change selector and templateUrl:**
```typescript
@Component({
  selector: 'app-panel-admin',
  templateUrl: './panel-admin.component.html',
  // ...
})
export class PanelAdminComponent { ... }
```

b) **Fix service imports:**
```typescript
import { AdminPanelService } from '../services/admin-panel.service';
import { ManagementSubscriptionService } from '../services/management-subscription.service';
import { DemosService } from '../services/demos.service';
```

c) **Fix interface imports:**
```typescript
import { AdminDashboardStats, AccountSummary, AccountDetail, ActivityLogEntry, AccountNote, StoreOverview } from '../interfaces/admin-panel.interface';
```

d) **Remove any imports that don't exist in nexivo-admin-app** (e.g., PermissionsService, MenuFavoritesService, TourService — if present, delete the injection and any calls to those services).

e) **Constructor** — inject only: `AdminPanelService`, `ManagementSubscriptionService`, `DemosService`, `MessageService`, `ConfirmationService`.

**Step 3: Add route to nexivo-gestion.module.ts**

```typescript
{
  path: 'panel-admin',
  loadComponent: () => import('./panel-admin/panel-admin.component').then(m => m.PanelAdminComponent),
},
```

**Step 4: Build check**

```bash
cd "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app"
npx ng build --configuration=development 2>&1 | grep -E "ERROR|error TS" | head -40
```
Fix any TypeScript errors before proceeding.

**Step 5: Commit**

```bash
git add src/app/products/nexivo-gestion/panel-admin/ src/app/products/nexivo-gestion/nexivo-gestion.module.ts
git commit -m "feat: add Panel Admin page to nexivo-admin-app"
```

---

## Task 6: Accounts component

**Files:**
- Create: `src/app/products/nexivo-gestion/accounts/accounts.component.ts`
- Create: `src/app/products/nexivo-gestion/accounts/accounts.component.html`
- Modify: `src/app/products/nexivo-gestion/nexivo-gestion.module.ts`

**Step 1: Copy component**

```bash
mkdir -p "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/accounts"
cp "c:/Users/maxi_/Documents/SIETEMA GESTION/management-app/src/app/pages/accounts/accounts.component.ts" \
   "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/accounts/accounts.component.ts"
cp "c:/Users/maxi_/Documents/SIETEMA GESTION/management-app/src/app/pages/accounts/accounts.component.html" \
   "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/accounts/accounts.component.html"
```

**Step 2: Adapt accounts.component.ts**

a) If the component is NOT standalone (no `standalone: true` in decorator), add it:
```typescript
@Component({
  standalone: true,
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    TableModule, ButtonModule, DialogModule, InputTextModule,
    DropdownModule, TagModule, ToastModule, ConfirmDialogModule,
    // ...whatever PrimeNG modules are used in the template
  ],
  providers: [MessageService, ConfirmationService],
})
```

b) **Fix imports:**
```typescript
import { AccountsService } from '../services/accounts.service';
import { ManagementSubscriptionService } from '../services/management-subscription.service';
import { Account } from '../interfaces/account.interface';
```

c) **Inject correct services** — `AccountsService`, `ManagementSubscriptionService` (for `getActivePlans()`), `MessageService`.

**Step 3: Add route**

```typescript
{
  path: 'accounts',
  loadComponent: () => import('./accounts/accounts.component').then(m => m.AccountsComponent),
},
```

**Step 4: Build check**

```bash
npx ng build --configuration=development 2>&1 | grep -E "ERROR|error TS" | head -40
```

**Step 5: Commit**

```bash
git add src/app/products/nexivo-gestion/accounts/ src/app/products/nexivo-gestion/nexivo-gestion.module.ts
git commit -m "feat: add Accounts page to nexivo-admin-app"
```

---

## Task 7: Subscription Management component

**Files:**
- Create: `src/app/products/nexivo-gestion/subscription-management/subscription-management.component.ts`
- Create: `src/app/products/nexivo-gestion/subscription-management/subscription-management.component.html`
- Modify: `src/app/products/nexivo-gestion/nexivo-gestion.module.ts`

**Step 1: Copy component**

```bash
mkdir -p "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/subscription-management"
cp "c:/Users/maxi_/Documents/SIETEMA GESTION/management-app/src/app/pages/subscription-management/subscription-management.component.ts" \
   "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/subscription-management/subscription-management.component.ts"
cp "c:/Users/maxi_/Documents/SIETEMA GESTION/management-app/src/app/pages/subscription-management/subscription-management.component.html" \
   "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/subscription-management/subscription-management.component.html"
```

**Step 2: Adapt**

a) Ensure `standalone: true` in decorator.

b) Add `DragDropModule` from `@angular/cdk/drag-drop` to imports array (check `package.json` — if `@angular/cdk` is missing, run `npm install @angular/cdk`).

c) Fix service import:
```typescript
import { ManagementSubscriptionService } from '../services/management-subscription.service';
```

d) Replace all `subscriptionService` injections + calls: search for `SubscriptionService` in the file and replace with `ManagementSubscriptionService`.

e) Fix interface imports:
```typescript
import { Plan, Subscription, DashboardStats } from '../interfaces/subscription.interface';
```

**Step 3: Check @angular/cdk is installed**

```bash
cd "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app"
cat package.json | grep "@angular/cdk"
```
If missing: `npm install @angular/cdk@17`

**Step 4: Add route**

```typescript
{
  path: 'subscription-management',
  loadComponent: () => import('./subscription-management/subscription-management.component').then(m => m.SubscriptionManagementComponent),
},
```

**Step 5: Build check**

```bash
npx ng build --configuration=development 2>&1 | grep -E "ERROR|error TS" | head -40
```

**Step 6: Commit**

```bash
git add src/app/products/nexivo-gestion/subscription-management/ src/app/products/nexivo-gestion/nexivo-gestion.module.ts
git commit -m "feat: add Subscription Management page to nexivo-admin-app"
```

---

## Task 8: Integration API Keys component

**Files:**
- Create: `src/app/products/nexivo-gestion/api-keys/api-keys.component.ts`
- Create: `src/app/products/nexivo-gestion/api-keys/api-keys.component.html`
- Modify: `src/app/products/nexivo-gestion/nexivo-gestion.module.ts`

**Step 1: Copy component**

```bash
mkdir -p "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/api-keys"
cp "c:/Users/maxi_/Documents/SIETEMA GESTION/management-app/src/app/pages/integration-api-keys/integration-api-keys.component.ts" \
   "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/api-keys/api-keys.component.ts"
cp "c:/Users/maxi_/Documents/SIETEMA GESTION/management-app/src/app/pages/integration-api-keys/integration-api-keys.component.html" \
   "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/api-keys/api-keys.component.html"
```

**Step 2: Adapt**

a) Rename class to `ApiKeysComponent`, update selector to `app-api-keys`, templateUrl to `./api-keys.component.html`.

b) Ensure `standalone: true`.

c) Fix imports:
```typescript
import { AccountsService } from '../services/accounts.service';
import { IntegrationApiKeyService } from '../services/integration-api-key.service';
```

d) This component uses `HttpClient` directly for `/sale-point/{accountId}` and `/user/account/{accountId}`. Inject `HttpClient` from `@angular/common/http` and use `environment.managementApiUrl` as base:
```typescript
import { environment } from '../../../../environments/environment';
// ...
this.http.get(`${environment.managementApiUrl}/sale-point/${accountId}`, { withCredentials: true })
this.http.get(`${environment.managementApiUrl}/user/account/${accountId}`, { withCredentials: true })
```

**Step 3: Add route**

```typescript
{
  path: 'api-keys',
  loadComponent: () => import('./api-keys/api-keys.component').then(m => m.ApiKeysComponent),
},
```

**Step 4: Build check + commit**

```bash
npx ng build --configuration=development 2>&1 | grep -E "ERROR|error TS" | head -40
git add src/app/products/nexivo-gestion/api-keys/ src/app/products/nexivo-gestion/nexivo-gestion.module.ts
git commit -m "feat: add API Keys page to nexivo-admin-app"
```

---

## Task 9: Referrals component

**Files:**
- Create: `src/app/products/nexivo-gestion/referrals/referrals.component.ts`
- Create: `src/app/products/nexivo-gestion/referrals/referrals.component.html`
- Modify: `src/app/products/nexivo-gestion/nexivo-gestion.module.ts`

**Step 1: Copy component**

```bash
mkdir -p "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/referrals"
cp "c:/Users/maxi_/Documents/SIETEMA GESTION/management-app/src/app/pages/referral-management/referral-management.component.ts" \
   "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/referrals/referrals.component.ts"
cp "c:/Users/maxi_/Documents/SIETEMA GESTION/management-app/src/app/pages/referral-management/referral-management.component.html" \
   "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/referrals/referrals.component.html"
```

**Step 2: Adapt**

a) Rename class to `ReferralsComponent`, selector to `app-referrals`, standalone.

b) Fix imports:
```typescript
import { ReferralService } from '../services/referral.service';
import { Referrer, ReferralCommission, ReferralDashboardStats, CommissionType } from '../interfaces/referral.interface';
```

**Step 3: Add route + build check + commit**

Route: `{ path: 'referrals', loadComponent: () => import('./referrals/referrals.component').then(m => m.ReferralsComponent) }`

```bash
npx ng build --configuration=development 2>&1 | grep -E "ERROR|error TS" | head -40
git add src/app/products/nexivo-gestion/referrals/ src/app/products/nexivo-gestion/nexivo-gestion.module.ts
git commit -m "feat: add Referrals page to nexivo-admin-app"
```

---

## Task 10: Notifications component

**Files:**
- Create: `src/app/products/nexivo-gestion/notifications/notifications.component.ts`
- Create: `src/app/products/nexivo-gestion/notifications/notifications.component.html`
- Modify: `src/app/products/nexivo-gestion/nexivo-gestion.module.ts`

**Step 1: Copy component**

```bash
mkdir -p "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/notifications"
cp "c:/Users/maxi_/Documents/SIETEMA GESTION/management-app/src/app/pages/send-notifications/send-notifications.component.ts" \
   "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/notifications/notifications.component.ts"
cp "c:/Users/maxi_/Documents/SIETEMA GESTION/management-app/src/app/pages/send-notifications/send-notifications.component.html" \
   "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/notifications/notifications.component.html"
```

**Step 2: Adapt**

a) Rename to `NotificationsComponent`, standalone.

b) Fix imports:
```typescript
import { AccountsService } from '../services/accounts.service';
```

c) This component uses `HttpClient` directly. Apply same pattern as API Keys — use `environment.managementApiUrl` base.

d) Fix roles endpoint: `GET /roles` requires `X-Account-Id` header (the component already does this via HttpClient). Verify the header name matches management-api expectations.

**Step 3: Add route + build check + commit**

Route: `{ path: 'notifications', loadComponent: () => import('./notifications/notifications.component').then(m => m.NotificationsComponent) }`

```bash
npx ng build --configuration=development 2>&1 | grep -E "ERROR|error TS" | head -40
git add src/app/products/nexivo-gestion/notifications/ src/app/products/nexivo-gestion/nexivo-gestion.module.ts
git commit -m "feat: add Notifications page to nexivo-admin-app"
```

---

## Task 11: Chat Dashboard component

**Files:**
- Create: `src/app/products/nexivo-gestion/chat-dashboard/chat-dashboard.component.ts`
- Create: `src/app/products/nexivo-gestion/chat-dashboard/chat-dashboard.component.html`
- Modify: `src/app/products/nexivo-gestion/nexivo-gestion.module.ts`

**Step 1: Install socket.io-client if missing**

```bash
cd "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app"
cat package.json | grep socket.io-client
```
If missing: `npm install socket.io-client`

**Step 2: Copy component**

```bash
mkdir -p "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/chat-dashboard"
cp "c:/Users/maxi_/Documents/SIETEMA GESTION/management-app/src/app/pages/chat/chat-dashboard/chat-dashboard.component.ts" \
   "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/chat-dashboard/chat-dashboard.component.ts"
cp "c:/Users/maxi_/Documents/SIETEMA GESTION/management-app/src/app/pages/chat/chat-dashboard/chat-dashboard.component.html" \
   "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/chat-dashboard/chat-dashboard.component.html"
```

**Step 3: Adapt chat-dashboard.component.ts**

a) Rename to `ChatDashboardComponent`, standalone.

b) Fix imports:
```typescript
import { ChatService } from '../services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { Conversation, ChatMessage, SupportAgent, Ticket, ChatStats } from '../interfaces/chat.interface';
```

c) Remove any import of `ContextService` — replace `contextService.currentAccountId$` with `null` or a local BehaviorSubject that just provides `null`.

d) In `ngOnInit`, the superadmin path should call `chatService.connectSuperAdmin()` or just `chatService.connect(null)` — check what management-app does for `isSuperAdmin === true` and preserve that path.

**Step 4: Add route + build check + commit**

Route: `{ path: 'chat', loadComponent: () => import('./chat-dashboard/chat-dashboard.component').then(m => m.ChatDashboardComponent) }`

```bash
npx ng build --configuration=development 2>&1 | grep -E "ERROR|error TS" | head -40
git add src/app/products/nexivo-gestion/chat-dashboard/ src/app/products/nexivo-gestion/nexivo-gestion.module.ts
git commit -m "feat: add Chat Dashboard page to nexivo-admin-app"
```

---

## Task 12: Chat Config component

**Files:**
- Create: `src/app/products/nexivo-gestion/chat-config/chat-config.component.ts`
- Create: `src/app/products/nexivo-gestion/chat-config/chat-config.component.html`
- Modify: `src/app/products/nexivo-gestion/nexivo-gestion.module.ts`

**Step 1: Copy component**

```bash
mkdir -p "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/chat-config"
cp "c:/Users/maxi_/Documents/SIETEMA GESTION/management-app/src/app/pages/chat/chat-config/chat-config.component.ts" \
   "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/chat-config/chat-config.component.ts"
cp "c:/Users/maxi_/Documents/SIETEMA GESTION/management-app/src/app/pages/chat/chat-config/chat-config.component.html" \
   "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/chat-config/chat-config.component.html"
```

**Step 2: Adapt**

a) Rename to `ChatConfigComponent`, standalone.

b) Fix imports — same as chat-dashboard (ChatService, interfaces).

c) No socket dependency here (HTTP-only).

**Step 3: Add route + build check + commit**

Route: `{ path: 'chat-config', loadComponent: () => import('./chat-config/chat-config.component').then(m => m.ChatConfigComponent) }`

```bash
npx ng build --configuration=development 2>&1 | grep -E "ERROR|error TS" | head -40
git add src/app/products/nexivo-gestion/chat-config/ src/app/products/nexivo-gestion/nexivo-gestion.module.ts
git commit -m "feat: add Chat Config page to nexivo-admin-app"
```

---

## Task 13: Demo Management component

**Files:**
- Create: `src/app/products/nexivo-gestion/demos/demos.component.ts`
- Create: `src/app/products/nexivo-gestion/demos/demos.component.html`
- Modify: `src/app/products/nexivo-gestion/nexivo-gestion.module.ts`

**Step 1: Copy component**

```bash
mkdir -p "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/demos"
cp "c:/Users/maxi_/Documents/SIETEMA GESTION/management-app/src/app/pages/demo-management/demo-management.component.ts" \
   "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/demos/demos.component.ts"
cp "c:/Users/maxi_/Documents/SIETEMA GESTION/management-app/src/app/pages/demo-management/demo-management.component.html" \
   "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app/src/app/products/nexivo-gestion/demos/demos.component.html"
```

**Step 2: Adapt**

a) Rename to `DemosComponent`, standalone.

b) Fix imports:
```typescript
import { DemosService } from '../services/demos.service';
```

**Step 3: Add route + build check + commit**

Route: `{ path: 'demos', loadComponent: () => import('./demos/demos.component').then(m => m.DemosComponent) }`

```bash
npx ng build --configuration=development 2>&1 | grep -E "ERROR|error TS" | head -40
git add src/app/products/nexivo-gestion/demos/ src/app/products/nexivo-gestion/nexivo-gestion.module.ts
git commit -m "feat: add Demo Management page to nexivo-admin-app"
```

---

## Task 14: Final build verification + angular.json budget

**Step 1: Full production build**

```bash
cd "c:/Users/maxi_/Documents/SIETEMA GESTION/nexivo-admin-app"
npx ng build 2>&1 | tail -20
```

If you get "budget exceeded" errors, increase the budget in `angular.json`:

```json
"budgets": [
  { "type": "initial", "maximumWarning": "2mb", "maximumError": "4mb" },
  { "type": "anyComponentStyle", "maximumWarning": "4kb", "maximumError": "8kb" }
]
```

**Step 2: Verify app loads in browser**

```bash
npx ng serve --port 4202
```
Navigate to `http://localhost:4202`. Log in, then check each new sidebar item navigates without errors.

**Step 3: Verify management-app still works**

Navigate to `http://localhost:4200`. Confirm all original admin pages are still accessible (no changes were made there).

**Step 4: Commit final state**

```bash
git add angular.json
git commit -m "build: increase bundle budgets for admin page migration"
```

---

## Summary of new file structure

```
src/app/products/nexivo-gestion/
├── interfaces/
│   ├── admin-panel.interface.ts
│   ├── account.interface.ts
│   ├── referral.interface.ts
│   ├── notification.interface.ts
│   ├── chat.interface.ts
│   └── subscription.interface.ts
├── services/
│   ├── nexivo-gestion-admin.service.ts  (existing)
│   ├── admin-panel.service.ts           (new)
│   ├── accounts.service.ts              (new)
│   ├── management-subscription.service.ts  (new)
│   ├── integration-api-key.service.ts   (new)
│   ├── referral.service.ts              (new)
│   ├── demos.service.ts                 (new)
│   └── chat.service.ts                  (new)
├── panel-admin/
├── accounts/
├── subscription-management/
├── api-keys/
├── referrals/
├── notifications/
├── chat-dashboard/
├── chat-config/
├── demos/
├── subscriptions/    (existing)
├── plans/            (existing)
└── nexivo-gestion.module.ts  (updated with 9 new routes)
```

## Key adaptation rules (apply to every component)

1. `environment.apiUrl` → `environment.managementApiUrl`
2. `'src/environments/environment'` → `'../../../../environments/environment'`
3. All service imports → `'../services/<service-name>.service'`
4. All interface imports → `'../interfaces/<name>.interface'`
5. Remove any import of services that don't exist in nexivo-admin-app: `PermissionsService`, `ContextService`, `SoundService`, `TourService`, `MenuFavoritesService`, `PlanLimitService`, `AccountModulesService` — delete the injection and any calls to those services in `ngOnInit`/methods.
6. Ensure `standalone: true` on every component.
7. If a component uses `SubscriptionService`, replace with `ManagementSubscriptionService`.
