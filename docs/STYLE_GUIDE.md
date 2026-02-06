# Sígale Design System Implementation Guide

A modern, iOS/Material Design inspired system for consistent styling across the project. Optimized for high density and maximum readability.

---

## 🎨 Color Palette

### Primary Colors
| Name | Hex | Usage |
|------|-----|-------|
| **Primary** | `#758BFD` | Buttons, accents, links |
| **Secondary** | `#BEADFF` | Text secondary, icons |
| **Text Primary** | `#E2D1B9` | Headings, titles (Darkened for readability) |

### Status Colors
| Name | Hex | Usage |
|------|-----|-------|
| **Success** | `#4ade80` | Confirmations, positive |
| **Warning** | `#FF8C00` | Alerts, attention |
| **Info** | `#60a5fa` | Information, neutral |
| **Error** | `#ef4444` | Errors, destructive |

---

## 📏 Aggressive Spacing Guidelines

To maintain a "Cutting Edge" compact look, follow these strict spacing rules:

- **Global Density**: All card paddings and margins between major sections should be **6px**.
- **Text Margins**: All typography elements (`<h1>`, `<p>`, `<span>`) must have `margin: 0` unless specifically needed for 4px-8px separation.
- **Line Height**: Use `line-height: 1.1` for ALL text elements to eliminate vertical "air".
- **Internal Row Padding**: List items or ticket rows should use `padding: 4px 6px` for maximum density.

---

## 📝 Typography (Increased Scale)

| Class | Size | Weight | Line-Height | Usage |
|-------|------|--------|-------------|-------|
| `.text-display` | 56px | 700 | 1.1 | Hero titles |
| `.text-title` | 38px | 700 | 1.1 | Page titles |
| `.text-heading` | 28px | 600 | 1.1 | Section headers |
| `.text-body` | 18px | 400 | 1.1 | Body content |
| `.text-caption` | 16px | 400 | 1.1 | Secondary info |
| `.text-label` | 14px | 600 | 1.1 | Labels, uppercase |

---

## ✨ Glass & Shadows

```css
/* Cards & Containers */
.glass-elevated {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.shadow-floating {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0, 0, 0, 0.10);
}
```

---

## 📦 High-Performance Component Patterns

### 1. Event Hero Card (with Quick Stats)
This pattern combines high-level event info with a dynamic statistics overlay.

```jsx
<div className="glass-elevated shadow-floating" style={{ borderRadius: '24px', padding: '6px', marginBottom: '6px' }}>
  <h1 className="text-title" style={{ margin: '8px', fontSize: '36px' }}>Event Name</h1>
  
  {/* Info Grid */}
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
    <div>
      <p className="text-label" style={{ margin: '8px', fontSize: '14px' }}>Ubicación</p>
      {/* Location Details... */}
    </div>
    <div>
      <p className="text-label" style={{ margin: '8px', fontSize: '14px' }}>Fecha y Hora</p>
      {/* Date Details... */}
    </div>
  </div>

  {/* Quick Stats Overlay */}
  <div className="glass-clean" style={{ borderRadius: '20px', padding: '8px 12px', background: 'rgba(117, 139, 253, 0.08)' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', textAlign: 'center' }}>
      <div>
        <p className="text-label" style={{ margin: '8px' }}>Total Vendidos</p>
        <p className="text-title color-primary" style={{ margin: '8px', fontSize: '24px' }}>120</p>
      </div>
      <div>
        <p className="text-label" style={{ margin: '8px' }}>Ingresos</p>
        <p className="text-title color-primary" style={{ margin: '8px', fontSize: '24px' }}>$2,400</p>
      </div>
    </div>
  </div>
</div>
```

### 2. Compact Ticket Types Section
Optimized for mobile lists with minimal vertical gaps.

```jsx
<div className="glass-elevated" style={{ borderRadius: '20px', padding: '6px' }}>
  {/* Header with minimized 32px icon */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '...' }}>
      <FontAwesomeIcon icon={faTicket} size="sm" />
    </div>
    <h2 className="text-heading" style={{ fontSize: '24px', margin: 0 }}>Tipos de Boletas</h2>
  </div>

  {/* Compact Rows */}
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <div className="glass-clean" style={{ padding: '4px 6px', borderRadius: '14px' }}>
      <p className="text-label" style={{ margin: 0 }}>GENERAL</p>
      <p className="text-heading" style={{ fontSize: '18px', margin: 0 }}>$20.000</p>
      {/* 32x24px badge counter */}
    </div>
  </div>
</div>
```

---

## 📋 Implementation Checklist

- [ ] Margin Reset: Does the element have `margin: 0`?
- [ ] Density Check: Is the padding/gap set to **6px**?
- [ ] Reading Ease: Is the primary text using `#E2D1B9` (not pure white)?
- [ ] Vertical Air: Is the `line-height` set to **1.1**?
- [ ] Hover State: Does it use `hover-lift` or `hover-scale`?
- [ ] Corner Radius: 20px (Stats/Section) or 24px (Hero Cards)?
