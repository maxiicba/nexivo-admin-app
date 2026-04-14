# Refined SaaS Design Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Elevar el sistema Nexivo Admin a una interfaz premium B2B SaaS mediante mejoras de tipografía (Instrument Serif + DM Sans), tokens refinados, efectos glass en topbar, stat cards con colored shadows, hero sections más expresivas, animaciones globales, y un rediseño completo del login.

**Architecture:** Todos los cambios se aplican en la capa de estilos SCSS globales (`src/assets/layout/styles/layout/`) usando la arquitectura de tokens de 3 capas existente. El único componente Angular que requiere cambios de template es `login.component.ts`. No se rompen nombres de clases existentes.

**Tech Stack:** Angular 17+, SCSS, PrimeNG, PrimeFlex, Google Fonts (Instrument Serif + DM Sans)

---

### Task 1: Google Fonts + Token de tipografía display

**Files:**
- Modify: `src/assets/layout/styles/layout/_nexivo-tokens.scss`
- Modify: `src/index.html` (o `src/assets/layout/styles/layout/layout.scss` si no hay index)

**Step 1: Verificar dónde agregar el import de Google Fonts**

Abrir `src/index.html` y verificar si hay un `<link>` de Google Fonts. Si no existe, también revisar `src/assets/layout/styles/layout/layout.scss`.

**Step 2: Agregar import de Google Fonts en `_nexivo-tokens.scss`**

Al inicio del archivo, antes de `:root {`, agregar:

```scss
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Instrument+Serif:ital@0;1&display=swap');
```

**Step 3: Actualizar el token `--nx-font` y agregar `--nx-font-display`**

En el bloque `:root { ... }` (Layer 1), cambiar:

```scss
// Typography
--nx-font: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--nx-font-display: 'Instrument Serif', Georgia, 'Times New Roman', serif;
--nx-font-feature: 'cv02', 'cv03', 'cv04', 'cv11';
```

**Step 4: Verificar en el navegador que las fuentes cargan**

Levantar el servidor (`ng serve`) y confirmar en DevTools → Network que `fonts.googleapis.com` responde 200.

**Step 5: Commit**

```bash
git add src/assets/layout/styles/layout/_nexivo-tokens.scss
git commit -m "feat(design): add DM Sans + Instrument Serif fonts and display token"
```

---

### Task 2: Actualizar tokens de shadows, radius y spacing

**Files:**
- Modify: `src/assets/layout/styles/layout/_nexivo-tokens.scss`
- Modify: `src/assets/layout/styles/layout/_variables.scss`

**Step 1: Modificar tokens en `:root` (Layer 1) en `_nexivo-tokens.scss`**

Reemplazar los valores existentes de shadows y radius:

```scss
// Radius
--nx-radius-sm: 6px;
--nx-radius-md: 8px;
--nx-radius-lg: 14px;      // era 12px
--nx-radius-xl: 18px;      // era 16px
--nx-radius-full: 9999px;

// Shadows
--nx-shadow-card: 0 1px 3px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.03);
--nx-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--nx-shadow-md: 0 4px 16px -2px rgba(99, 102, 241, 0.08), 0 2px 6px -2px rgba(0, 0, 0, 0.08);
--nx-shadow-lg: 0 10px 24px -4px rgba(99, 102, 241, 0.12), 0 4px 8px -4px rgba(0, 0, 0, 0.1);
```

**Step 2: Actualizar `--nx-card-padding` en Layer 3 (Component Tokens)**

```scss
--nx-card-padding: 1.75rem;   // era 1.5rem
```

**Step 3: Agregar tokens nuevos en Layer 3**

Después de `--nx-card-shadow`:

```scss
// Colored shadows for stat cards
--nx-card-shadow-colored-blue: 0 4px 16px -2px rgba(59, 130, 246, 0.12);
--nx-card-shadow-colored-green: 0 4px 16px -2px rgba(16, 185, 129, 0.12);
--nx-card-shadow-colored-orange: 0 4px 16px -2px rgba(245, 158, 11, 0.12);
--nx-card-shadow-colored-purple: 0 4px 16px -2px rgba(139, 92, 246, 0.12);
--nx-card-shadow-colored-red: 0 4px 16px -2px rgba(239, 68, 68, 0.12);
--nx-card-shadow-colored-cyan: 0 4px 16px -2px rgba(6, 182, 212, 0.12);
--nx-card-shadow-colored-pink: 0 4px 16px -2px rgba(236, 72, 153, 0.12);

// Topbar
--nx-topbar-shadow: 0 1px 0 var(--nx-border), 0 4px 16px rgba(0, 0, 0, 0.04);
--nx-topbar-height: 60px;      // era 56px (también actualizar Layer 3)

// Sidebar active icon background
--nx-sidebar-active-icon-bg: rgba(99, 102, 241, 0.14);
```

**Step 4: Actualizar `$topbarHeight` en `_variables.scss`**

```scss
$topbarHeight: 60px;  // era 56px
```

**Step 5: Commit**

```bash
git add src/assets/layout/styles/layout/_nexivo-tokens.scss src/assets/layout/styles/layout/_variables.scss
git commit -m "feat(design): update radius, shadows, spacing tokens and topbar height"
```

---

### Task 3: Tipografía — aplicar fuentes a h1, h2 y elementos display

**Files:**
- Modify: `src/assets/layout/styles/layout/_typography.scss`

**Step 1: Aplicar `--nx-font-display` a h1 y h2**

```scss
h1, h2 {
    font-family: var(--nx-font-display);
    font-weight: 400;  // Instrument Serif se ve mejor en 400
}

h1 {
    font-size: 1.75rem;   // era 1.5rem
    letter-spacing: -0.01em;
}

h2 {
    font-size: 1.35rem;   // era 1.25rem
}
```

Los demás headings (h3–h6) mantienen `font-family: inherit` (DM Sans).

**Step 2: Asegurarse que el `body` usa el nuevo token**

Verificar en `_main.scss` que el `body` tiene `font-family: var(--nx-font)`. Si no, agregar o actualizar.

**Step 3: Commit**

```bash
git add src/assets/layout/styles/layout/_typography.scss
git commit -m "feat(design): apply Instrument Serif to h1/h2, update heading sizes"
```

---

### Task 4: Topbar — glass effect + altura + refinamiento

**Files:**
- Modify: `src/assets/layout/styles/layout/_topbar.scss`

**Step 1: Actualizar `.layout-topbar` base**

```scss
.layout-topbar {
    position: fixed;
    height: $topbarHeight;   // ahora 60px
    z-index: 990;
    left: $sidebarWidth;
    top: 0;
    right: 0;
    padding: 0 1.5rem;
    background-color: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    transition: left $transitionDuration;
    display: flex;
    align-items: center;
    border-bottom: none;
    box-shadow: var(--nx-topbar-shadow);
    // ... resto igual
```

**Step 2: Actualizar `.topbar-user-btn`**

Cambiar el borde para que sea siempre visible (no solo en hover):

```scss
.topbar-user-btn {
    // ...estilos existentes...
    border: 1px solid var(--nx-border);   // era transparent

    &:hover {
        background: var(--nx-hover);
        border-color: var(--nx-primary);   // cambia a primary en hover
    }
}
```

**Step 3: Actualizar `.topbar-sp-selector` en light mode**

```scss
.topbar-sp-selector {
    // ...estilos existentes...
    background: linear-gradient(180deg, rgba(238, 242, 255, 0.6), rgba(224, 231, 255, 0.4));
    border-color: rgba(99, 102, 241, 0.18);

    .pi-map-marker {
        color: var(--nx-primary);
    }
```

**Step 4: Agregar dark mode override para glass topbar**

Al final del bloque `.layout-theme-dark`:

```scss
.layout-theme-dark {
    .layout-topbar {
        background-color: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        box-shadow: 0 1px 0 var(--nx-border), 0 4px 16px rgba(0, 0, 0, 0.2);
    }
}
```

**Step 5: Commit**

```bash
git add src/assets/layout/styles/layout/_topbar.scss
git commit -m "feat(design): topbar glass effect, always-visible user border, sp selector tint"
```

---

### Task 5: Sidebar — refinamiento visual

**Files:**
- Modify: `src/assets/layout/styles/layout/_menu.scss`

**Step 1: Actualizar `.sidebar-header`**

```scss
.sidebar-header {
    // ...estilos existentes...
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.06), transparent 60%);

    .sidebar-logo {
        // ...estilos existentes...
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
    }
}
```

**Step 2: Actualizar section labels — más letter-spacing**

```scss
.layout-root-menuitem > .layout-menuitem-root-text {
    // ...estilos existentes...
    letter-spacing: 0.10em;   // era 0.06em
    opacity: 0.7;              // ligeramente menos presente
```

**Step 3: Actualizar íconos de items activos**

En el selector `a.active-route`:

```scss
&.active-route {
    font-weight: 500;
    color: var(--nx-sidebar-item-active-text);
    background: var(--nx-sidebar-item-active-bg);
    box-shadow: var(--nx-sidebar-item-active-shadow);

    .layout-menuitem-icon {
        color: var(--nx-sidebar-item-active-icon);
        background: var(--nx-sidebar-active-icon-bg);
        border-radius: 8px;
        width: 1.6rem;
        height: 1.6rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }
}
```

**Step 4: Actualizar `border-right` en light mode**

```scss
.layout-theme-light & {
    border-right: 1px solid var(--nx-slate-300);   // era slate-200
    box-shadow: 1px 0 6px rgba(0, 0, 0, 0.06);     // era 0.04
}
```

**Step 5: Commit**

```bash
git add src/assets/layout/styles/layout/_menu.scss
git commit -m "feat(design): sidebar header gradient, active icon bg, refined section labels"
```

---

### Task 6: Stat Cards — colored shadows + font display + border accent

**Files:**
- Modify: `src/assets/layout/styles/layout/_nx-pages.scss`

**Step 1: Actualizar `.nx-stat-card` base**

```scss
.nx-stat-card {
    // ...estilos existentes...
    padding: 1.35rem;   // ligeramente más que antes

    &:hover {
        transform: translateY(-3px);   // era -2px
        box-shadow: var(--nx-shadow-md);
    }
```

**Step 2: Actualizar `__value` para usar fuente display**

```scss
&__value {
    font-size: 1.35rem;
    font-weight: 400;
    font-family: var(--nx-font-display);
    color: var(--nx-text-primary);
    // ...resto igual...
}
```

**Step 3: Actualizar variantes de ícono — border y colored shadow**

```scss
&__icon {
    // ...estilos existentes...
    border-radius: 12px;   // unificar

    &--blue {
        background: var(--nx-accent-blue-soft);
        color: var(--nx-accent-blue);
        border: 1px solid rgba(59, 130, 246, 0.2);
    }
    &--green {
        background: var(--nx-accent-green-soft);
        color: var(--nx-accent-green);
        border: 1px solid rgba(16, 185, 129, 0.2);
    }
    &--orange {
        background: var(--nx-accent-orange-soft);
        color: var(--nx-accent-orange);
        border: 1px solid rgba(245, 158, 11, 0.2);
    }
    &--red {
        background: var(--nx-accent-red-soft);
        color: var(--nx-accent-red);
        border: 1px solid rgba(239, 68, 68, 0.2);
    }
    &--purple {
        background: var(--nx-accent-purple-soft);
        color: var(--nx-accent-purple);
        border: 1px solid rgba(139, 92, 246, 0.2);
    }
    &--cyan {
        background: var(--nx-accent-cyan-soft);
        color: var(--nx-accent-cyan);
        border: 1px solid rgba(6, 182, 212, 0.2);
    }
    &--pink {
        background: var(--nx-accent-pink-soft);
        color: var(--nx-accent-pink);
        border: 1px solid rgba(236, 72, 153, 0.2);
    }
    &--primary {
        background: var(--nx-primary-soft);
        color: var(--nx-primary);
        border: 1px solid rgba(99, 102, 241, 0.2);
    }
}
```

**Step 4: Agregar colored shadow por variante usando data attribute o clases compuestas**

Agregar al final de la sección de `.nx-stat-card`:

```scss
.nx-stat-card--blue:hover   { box-shadow: var(--nx-card-shadow-colored-blue); }
.nx-stat-card--green:hover  { box-shadow: var(--nx-card-shadow-colored-green); }
.nx-stat-card--orange:hover { box-shadow: var(--nx-card-shadow-colored-orange); }
.nx-stat-card--purple:hover { box-shadow: var(--nx-card-shadow-colored-purple); }
.nx-stat-card--red:hover    { box-shadow: var(--nx-card-shadow-colored-red); }
.nx-stat-card--cyan:hover   { box-shadow: var(--nx-card-shadow-colored-cyan); }
.nx-stat-card--pink:hover   { box-shadow: var(--nx-card-shadow-colored-pink); }
```

**Step 5: Commit**

```bash
git add src/assets/layout/styles/layout/_nx-pages.scss
git commit -m "feat(design): stat cards colored shadows, display font for values, icon borders"
```

---

### Task 7: Hero Section + Page Kicker + Tablas

**Files:**
- Modify: `src/assets/layout/styles/layout/_nx-pages.scss`

**Step 1: Actualizar `.nx-hero-section` — gradiente más presente**

```scss
.nx-hero-section {
    // ...estilos existentes...
    background:
        radial-gradient(circle at top left, rgba(99, 102, 241, 0.12), transparent 22%),   // era 0.08
        radial-gradient(circle at top right, rgba(14, 165, 233, 0.07), transparent 18%),
        linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
```

**Step 2: Aplicar `Instrument Serif` al título hero**

```scss
.nx-page-header--hero {
    .nx-page-header__title {
        font-family: var(--nx-font-display);
        font-weight: 400;
        font-size: clamp(1.65rem, 1.8vw, 2.2rem);   // ligeramente mayor
        letter-spacing: -0.02em;
    }
}
```

**Step 3: Rediseñar `.nx-page-kicker`**

```scss
.nx-page-kicker {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.72rem;
    font-weight: 700;
    margin-bottom: 0.65rem;
    color: var(--nx-primary);
    background: var(--nx-primary-soft);
    padding: 0.25rem 0.65rem 0.25rem 0.5rem;
    border-radius: var(--nx-radius-full);

    &::before {
        content: '';
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--nx-primary);
        flex-shrink: 0;
    }
}
```

**Step 4: Actualizar tablas — header gradiente + row hover indigo**

```scss
.p-datatable {
    .p-datatable-thead > tr > th {
        background: linear-gradient(to bottom, var(--nx-slate-100), var(--nx-slate-50));
        // ...resto igual...
    }

    .p-datatable-tbody > tr {
        transition: background-color 100ms ease;   // era var(--nx-transition-fast) = 150ms

        &:hover {
            background-color: rgba(99, 102, 241, 0.03) !important;   // era slate-100
        }
    }
}
```

**Step 5: Actualizar dark mode de hero section**

En el bloque `.layout-theme-dark`:

```scss
.nx-hero-section {
    background:
        radial-gradient(circle at top left, rgba(99, 102, 241, 0.14), transparent 22%),   // era 0.12
        radial-gradient(circle at top right, rgba(14, 165, 233, 0.09), transparent 18%),
        linear-gradient(135deg, var(--nx-bg-card), var(--nx-bg-elevated));
}
```

**Step 6: Commit**

```bash
git add src/assets/layout/styles/layout/_nx-pages.scss
git commit -m "feat(design): hero gradient, display font for titles, pill kicker, table refinements"
```

---

### Task 8: Empty States — font display + ícono refinado

**Files:**
- Modify: `src/assets/layout/styles/layout/_nx-pages.scss`

**Step 1: Actualizar `.nx-empty-state`**

```scss
.nx-empty-state {
    // ...estilos existentes...

    &__icon {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--nx-primary-soft), rgba(99, 102, 241, 0.05));
        border: 1px dashed rgba(99, 102, 241, 0.3);   // NUEVO
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1rem;

        i {
            font-size: 2rem;
            color: var(--nx-primary);
        }
    }

    h3 {
        margin: 0 0 0.5rem;
        font-size: 1.2rem;
        font-weight: 400;
        font-family: var(--nx-font-display);   // NUEVO
        color: var(--nx-text-primary);
    }
}
```

**Step 2: Commit**

```bash
git add src/assets/layout/styles/layout/_nx-pages.scss
git commit -m "feat(design): empty state display font, dashed icon border"
```

---

### Task 9: Animaciones globales

**Files:**
- Modify: `src/assets/layout/styles/layout/_main.scss`

**Step 1: Leer `_main.scss` para ver el contenido actual**

Abrir el archivo antes de modificar.

**Step 2: Agregar keyframes y clases utilitarias al final del archivo**

```scss
// ============================================================================
// NEXIVO — Global Animations
// ============================================================================

@keyframes nx-fade-up {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
}

@keyframes nx-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
}

@keyframes nx-slide-in-left {
    from { opacity: 0; transform: translateX(-12px); }
    to   { opacity: 1; transform: translateX(0); }
}

// Animation utility classes
.nx-animate-fade-up    { animation: nx-fade-up 0.3s ease both; }
.nx-animate-fade-in    { animation: nx-fade-in 0.25s ease both; }
.nx-animate-slide-left { animation: nx-slide-in-left 0.25s ease both; }

// Stagger delays (50ms increments — use on repeated children)
.nx-animate-delay-1 { animation-delay: 50ms; }
.nx-animate-delay-2 { animation-delay: 100ms; }
.nx-animate-delay-3 { animation-delay: 150ms; }
.nx-animate-delay-4 { animation-delay: 200ms; }
.nx-animate-delay-5 { animation-delay: 250ms; }

// Button press feedback — global
button:not([disabled]):active,
.p-button:not([disabled]):active {
    transform: scale(0.97);
    transition: transform 80ms ease;
}
```

**Step 3: Commit**

```bash
git add src/assets/layout/styles/layout/_main.scss
git commit -m "feat(design): global animation keyframes, stagger utilities, button press feedback"
```

---

### Task 10: Rediseño del Login Component

**Files:**
- Modify: `src/app/pages/login/login.component.ts`

**Step 1: Leer el componente actual completo** (ya leído — ver design doc)

**Step 2: Reemplazar el template completo**

El nuevo template elimina `p-card` y usa HTML propio con tokens Nexivo:

```typescript
template: `
<div class="nx-login-bg">
  <!-- Animated background blobs -->
  <div class="nx-login-blob nx-login-blob--1"></div>
  <div class="nx-login-blob nx-login-blob--2"></div>
  <div class="nx-login-blob nx-login-blob--3"></div>

  <div class="nx-login-card nx-animate-fade-up">
    <!-- Branding -->
    <div class="nx-login-brand">
      <div class="nx-login-logo">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#6366f1"/>
          <path d="M8 10h16v3H8zM8 14.5h10v3H8zM8 19h16v3H8z" fill="white" opacity="0.9"/>
        </svg>
      </div>
      <div class="nx-login-brand-text">
        <span class="nx-login-brand-name">Nexivo Admin</span>
        <span class="nx-login-brand-subtitle">Panel de administración</span>
      </div>
    </div>

    <!-- Error message -->
    <div *ngIf="errorMsg" class="nx-login-error">
      <i class="pi pi-exclamation-circle"></i>
      {{ errorMsg }}
    </div>

    <!-- Form -->
    <form class="nx-login-form" (ngSubmit)="login()">
      <div class="nx-login-field">
        <label class="nx-login-label" for="email">Correo electrónico</label>
        <input
          class="nx-login-input"
          id="email"
          type="email"
          [(ngModel)]="email"
          name="email"
          placeholder="admin@nexivo.com.ar"
          autocomplete="email"
        />
      </div>

      <div class="nx-login-field">
        <label class="nx-login-label" for="password">Contraseña</label>
        <input
          class="nx-login-input"
          id="password"
          type="password"
          [(ngModel)]="password"
          name="password"
          placeholder="••••••••"
          autocomplete="current-password"
        />
      </div>

      <button
        type="submit"
        class="nx-login-btn"
        [class.nx-login-btn--loading]="loading"
        [disabled]="loading"
      >
        <span *ngIf="!loading">Iniciar sesión</span>
        <span *ngIf="loading" class="nx-login-spinner">
          <i class="pi pi-spin pi-spinner"></i> Ingresando...
        </span>
      </button>
    </form>

    <!-- Footer note -->
    <p class="nx-login-note">
      Requiere permisos de Super Administrador.<br>
      En producción el acceso es vía SSO.
    </p>
  </div>
</div>
`,
styles: [`
  .nx-login-bg {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--nx-bg-ground, #f8fafc);
    position: relative;
    overflow: hidden;
    padding: 1.5rem;
  }

  .nx-login-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
    animation: nx-blob-float 20s ease-in-out infinite;
  }

  .nx-login-blob--1 {
    width: 400px; height: 400px;
    top: -100px; left: -100px;
    background: rgba(99, 102, 241, 0.12);
    animation-duration: 25s;
  }

  .nx-login-blob--2 {
    width: 300px; height: 300px;
    bottom: -80px; right: -80px;
    background: rgba(6, 182, 212, 0.10);
    animation-duration: 20s;
    animation-delay: -8s;
  }

  .nx-login-blob--3 {
    width: 200px; height: 200px;
    top: 40%; left: 60%;
    background: rgba(139, 92, 246, 0.07);
    animation-duration: 30s;
    animation-delay: -15s;
  }

  @keyframes nx-blob-float {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(20px, -20px) scale(1.04); }
    66% { transform: translate(-15px, 15px) scale(0.97); }
  }

  .nx-login-card {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 400px;
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(226, 232, 240, 0.8);
    border-radius: 18px;
    padding: 2.5rem 2rem;
    box-shadow:
      0 4px 24px rgba(99, 102, 241, 0.08),
      0 1px 3px rgba(0, 0, 0, 0.06),
      0 0 0 1px rgba(0, 0, 0, 0.02);
  }

  .nx-login-brand {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    margin-bottom: 2rem;
  }

  .nx-login-logo {
    width: 42px; height: 42px;
    border-radius: 10px;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
    svg { width: 42px; height: 42px; display: block; }
  }

  .nx-login-brand-text {
    display: flex;
    flex-direction: column;
    line-height: 1.3;
  }

  .nx-login-brand-name {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 1.35rem;
    font-weight: 400;
    color: #0f172a;
    letter-spacing: -0.01em;
  }

  .nx-login-brand-subtitle {
    font-size: 0.78rem;
    color: #64748b;
    font-weight: 400;
  }

  .nx-login-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 10px;
    color: #dc2626;
    font-size: 0.875rem;
    margin-bottom: 1.25rem;
  }

  .nx-login-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .nx-login-field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .nx-login-label {
    font-size: 0.82rem;
    font-weight: 600;
    color: #334155;
    letter-spacing: 0.01em;
  }

  .nx-login-input {
    width: 100%;
    padding: 0.65rem 0.9rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.9);
    color: #0f172a;
    font-size: 0.9rem;
    font-family: 'DM Sans', sans-serif;
    transition: border-color 150ms ease, box-shadow 150ms ease;
    outline: none;
    box-sizing: border-box;

    &::placeholder { color: #94a3b8; }

    &:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
    }
  }

  .nx-login-btn {
    width: 100%;
    margin-top: 0.5rem;
    padding: 0.7rem 1.25rem;
    border: 1px solid rgba(99, 102, 241, 0.22);
    border-radius: 10px;
    background: linear-gradient(135deg, #6366f1, #5b5ff0 55%, #4f46e5);
    color: #fff;
    font-size: 0.92rem;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: transform 150ms ease, box-shadow 150ms ease;
    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.22), inset 0 1px 0 rgba(255,255,255,0.18);

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 12px 28px rgba(99, 102, 241, 0.28), inset 0 1px 0 rgba(255,255,255,0.22);
    }

    &:active:not(:disabled) { transform: scale(0.98); }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }

  .nx-login-note {
    margin-top: 1.5rem;
    font-size: 0.75rem;
    color: #94a3b8;
    text-align: center;
    line-height: 1.6;
  }

  /* Dark mode support */
  :host-context(.layout-theme-dark) .nx-login-card {
    background: rgba(15, 23, 42, 0.88);
    border-color: rgba(30, 41, 59, 0.8);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.04);
  }

  :host-context(.layout-theme-dark) .nx-login-brand-name { color: #f8fafc; }
  :host-context(.layout-theme-dark) .nx-login-label { color: #cbd5e1; }
  :host-context(.layout-theme-dark) .nx-login-input {
    background: rgba(30, 41, 59, 0.8);
    border-color: #334155;
    color: #f8fafc;
    &:focus { border-color: #818cf8; box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.15); }
  }
`],
```

**Step 3: Verificar que `FormsModule` está importado** (ya está — no cambiar imports)

**Step 4: Commit**

```bash
git add src/app/pages/login/login.component.ts
git commit -m "feat(design): redesign login page with glass card, animated blobs, display font"
```

---

### Task 11: Verificación visual final

**Step 1: Levantar el servidor de desarrollo**

```bash
ng serve
```

**Step 2: Verificar en navegador (http://localhost:4200)**

Checklist:
- [ ] Fuentes DM Sans y Instrument Serif cargan correctamente
- [ ] Topbar tiene efecto glass (blur) visible
- [ ] h1 y h2 usan Instrument Serif
- [ ] Stat cards muestran sombras de color en hover
- [ ] Page kicker tiene pill de fondo + dot
- [ ] Empty states usan Instrument Serif en h3
- [ ] Login page tiene fondo animado + card glass
- [ ] Dark mode funciona correctamente en todos los elementos
- [ ] No hay regresiones visuales en otros componentes

**Step 3: Verificar compilación sin errores**

```bash
ng build --configuration production
```

Expected: Compiled successfully.

**Step 4: Commit final**

```bash
git add .
git commit -m "chore: verify refined saas design system implementation complete"
```
