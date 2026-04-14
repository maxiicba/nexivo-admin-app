# Refined SaaS — Design System Upgrade

**Fecha:** 2026-04-13  
**Enfoque:** Opción A — Refined SaaS Premium  
**Alcance:** Todo el sistema (tokens, layout, componentes, login)

---

## Objetivo

Elevar el sistema Nexivo Admin de un admin panel funcional a una interfaz premium B2B SaaS. Mantener la arquitectura de tokens SCSS existente, ampliarla con nuevas variables, y aplicar mejoras de tipografía, espaciado, sombras y micro-animaciones.

---

## 1. Tipografía

### Fuentes
- **Display:** `Instrument Serif` (Google Fonts) — títulos de página, métricas grandes, empty state titles
- **Cuerpo:** `DM Sans` (Google Fonts) — reemplaza `Inter` en todo el sistema

### Cambios en tokens
```scss
--nx-font: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
--nx-font-display: 'Instrument Serif', Georgia, serif;
```

### Jerarquía
| Elemento | Fuente | Tamaño | Peso |
|---|---|---|---|
| `h1`, `.nx-page-header__title` | Instrument Serif | `1.75rem` | 400 |
| `h2` | Instrument Serif | `1.35rem` | 400 |
| `h3` en adelante | DM Sans | existente | existente |
| `.nx-stat-card__value` | Instrument Serif | `1.5rem` | 400 |
| `.nx-empty-state h3` | Instrument Serif | `1.2rem` | 400 |
| Nav, labels, botones | DM Sans | existente | 500/600 |

---

## 2. Tokens — Cambios y Adiciones

### Modificados
| Token | Antes | Después |
|---|---|---|
| `--nx-shadow-card` | `0 1px 2px rgba(0,0,0,0.04)` | `0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)` |
| `--nx-shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1)...` | `0 4px 16px -2px rgba(99,102,241,0.08), 0 2px 6px -2px rgba(0,0,0,0.08)` |
| `--nx-radius-lg` | `12px` | `14px` |
| `--nx-radius-xl` | `16px` | `18px` |
| `--nx-card-padding` | `1.5rem` | `1.75rem` |
| `--nx-topbar-height` | `56px` | `60px` (también `$topbarHeight`) |

### Nuevos
```scss
--nx-font-display: 'Instrument Serif', Georgia, serif;
--nx-topbar-shadow: 0 1px 0 var(--nx-border), 0 4px 16px rgba(0,0,0,0.04);
--nx-sidebar-active-icon-bg: rgba(99,102,241,0.14);
--nx-card-shadow-colored-blue: 0 4px 16px -2px rgba(59,130,246,0.12);
--nx-card-shadow-colored-green: 0 4px 16px -2px rgba(16,185,129,0.12);
--nx-card-shadow-colored-orange: 0 4px 16px -2px rgba(245,158,11,0.12);
--nx-card-shadow-colored-purple: 0 4px 16px -2px rgba(139,92,246,0.12);
--nx-card-shadow-colored-red: 0 4px 16px -2px rgba(239,68,68,0.12);
--nx-card-shadow-colored-cyan: 0 4px 16px -2px rgba(6,182,212,0.12);
```

---

## 3. Sidebar

### Cambios
- `sidebar-header`: gradiente sutil de fondo `linear-gradient(135deg, rgba(99,102,241,0.06), transparent)`
- `.sidebar-logo`: `box-shadow: 0 4px 12px rgba(99,102,241,0.25)`
- Items activos: ícono con fondo circular `var(--nx-sidebar-active-icon-bg)` + pill más visible
- Section labels: `letter-spacing: 0.10em` (era 0.06em), opacidad ligeramente reducida
- Light mode `border-right`: `var(--nx-slate-300)` (era `var(--nx-slate-200)`)

---

## 4. Topbar

### Cambios
- Altura: `60px`
- Light mode: `background: rgba(255,255,255,0.85)` + `backdrop-filter: blur(12px)`
- `box-shadow: var(--nx-topbar-shadow)` reemplaza `border-bottom` solo
- `.topbar-user-btn`: `border: 1px solid var(--nx-border)` siempre visible
- `.topbar-sp-selector`: tinte indigo sutil en estado normal

---

## 5. Stat Cards

### Cambios
- Estado normal: colored shadow según variante del ícono
- Ícono container: `border: 1px solid` con color de variante al 20% + `border-radius: 12px`
- `__value`: `font-family: var(--nx-font-display)`
- Hover: `translateY(-3px)` + sombra con tinte de color
- `border-left: 3px solid` del color de acento en hover (transición suave)

---

## 6. Hero Section

### Cambios
- Gradiente `rgba(99,102,241,0.12)` (era 0.08)
- `.nx-page-header__title` en `--hero`: `font-family: var(--nx-font-display)`
- `.nx-page-kicker`: dot de color + `background: var(--nx-primary-soft)` + `border-radius: full`
- Botón primario: colored shadow permanente

---

## 7. Tablas

### Cambios
- Header: `linear-gradient(to bottom, var(--nx-slate-100), var(--nx-slate-50))` (light) / gradiente oscuro (dark)
- Row hover: `rgba(99,102,241,0.03)` tinte indigo sutil + transición `100ms`
- Primera celda de datos relevantes: `font-weight: 500`
- Bordes de columna: opacidad reducida

---

## 8. Login Page

### Rediseño completo del template
- Eliminar `p-card` genérico
- Layout: fondo con `radial-gradient` mesh animado (indigo + cyan, 60s loop)
- Card propio: `backdrop-filter: blur(16px)`, tokens Nexivo, `border-radius: var(--nx-radius-xl)`
- Branding: logo SVG + nombre en `Instrument Serif`
- Inputs: styled con tokens Nexivo
- Botón: igual a `nx-hero-action--modern`

---

## 9. Empty States

### Cambios
- Ícono container: gradiente interno suave + `border: 1px dashed` indigo al 30%
- Título `h3`: `font-family: var(--nx-font-display)`

---

## 10. Animaciones Globales

Definidas en `_main.scss`:

```scss
@keyframes nx-fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes nx-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes nx-slide-in-left { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
```

Clases utilitarias: `nx-animate-fade-up`, `nx-animate-fade-in`, `nx-animate-slide-left`  
Con variantes de delay: `nx-animate-delay-1` → `nx-animate-delay-5` (50ms increments)

Botones: `scale(0.97)` en `:active` — en `_main.scss` global.

---

## Archivos a modificar

| Archivo | Tipo de cambio |
|---|---|
| `_nexivo-tokens.scss` | Modificar tokens, agregar nuevos, import Google Fonts |
| `_variables.scss` | Actualizar `$topbarHeight` |
| `_typography.scss` | Aplicar `--nx-font-display` a h1, h2 |
| `_topbar.scss` | Altura, glass effect, user btn, sp selector |
| `_menu.scss` | Sidebar header, item activo, section labels |
| `_nx-pages.scss` | Stat cards, hero section, tablas, empty states, kicker |
| `_main.scss` | Animaciones globales, button active scale |
| `login.component.ts` | Rediseño completo del template |

---

## Principios de implementación

1. Todos los cambios respetan la arquitectura de tokens existente
2. No se rompen nombres de clases — los componentes Angular no necesitan cambios (salvo login)
3. Dark mode se actualiza junto con light mode en cada sección
4. Las fuentes se cargan desde Google Fonts via `@import` en los tokens
