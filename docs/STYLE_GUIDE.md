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

---

## 🎯 Component-Specific Guidelines

### Form Elements

#### Input Fields
```jsx
<input
  type="text"
  className="w-full px-3 py-2.5 rounded-lg text-base"
  style={{
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(117,139,253,0.15)',
    color: '#E2D1B9'
  }}
/>
```

#### Labels with Icons
- **Icon + Label spacing**: Use `gap-2` (8px) between icon and label
- **Label left margin**: Add `marginLeft: '2px'` to labels for visual balance
- **Label bottom margin**: Use `marginBottom: '12px'` (4px more than default) for better separation from inputs
- **Icon color**: Use `color: '#758BFD'` with `opacity: 0.8`

```jsx
<div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
  <FontAwesomeIcon icon={faUser} className="label-icon" />
  <label className="text-label" style={{ fontSize: '12px', marginLeft: '2px' }}>
    {t("buyerName")}
  </label>
</div>
```

#### Select/Dropdown Focus
```css
input:focus, select:focus {
  border-color: rgba(117,139,253,0.5) !important;
  outline: none !important;
}
```

#### Phone Number Field
- Default value: `"000"`
- Auto-select on focus: `onFocus={(e) => e.target.select()}`
- Hide display when value is `"000"`

---

### Button Styles

#### Primary Gradient Button
Use for main CTAs (Create, Submit, Confirm):

```jsx
<button
  style={{
    padding: '16px 24px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #758BFD, #BEADFF)',
    border: 'none',
    color: 'rgba(0, 0, 0, 0.75)', // Darker text for better readability
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(117, 139, 253, 0.3)',
    transition: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
  }}
  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
>
  Button Text
</button>
```

**Key Points:**
- Text color: `rgba(0, 0, 0, 0.75)` NOT white - for better contrast
- Border radius: `16px` for large buttons
- Hover: `scale(1.02)` with smooth cubic-bezier transition
- Shadow: `0 4px 12px rgba(117, 139, 253, 0.3)`

#### Small Action Buttons (30x30px Grid)
Use for compact action grids (Edit, Delete, Copy, Share):

```jsx
<button
  style={{
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #758BFD, #BEADFF)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(117, 139, 253, 0.3)',
    transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'scale(1.05)';
    e.currentTarget.style.boxShadow = '0 4px 12px rgba(117, 139, 253, 0.4)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.boxShadow = '0 2px 8px rgba(117, 139, 253, 0.3)';
  }}
>
  <FontAwesomeIcon
    icon={faIcon}
    style={{ fontSize: '13px', width: '13px', height: '13px', display: 'block' }}
  />
</button>
```

**Key Points:**
- Exact size: 30x30px
- Border radius: `8px` for small buttons
- Icon sizing: `fontSize: '13px'` (no need for explicit width/height with flexbox approach)
- Hover: `scale(1.05)` + enhanced shadow
- Grid gap: `4px` between buttons

#### Fixed-Size Button Layout (2x2 Grid)

**Problem:** CSS Grid and flex containers can stretch buttons vertically when sibling content is taller, causing buttons to appear rectangular instead of square.

**Solution:** Use nested flexbox with explicit size constraints on all dimensions:

```jsx
{/* Outer container - column direction */}
<div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  flexShrink: 0,        // Prevent compression
  alignSelf: 'center'   // Prevent vertical stretching in parent flex
}}>
  {/* Row 1 */}
  <div style={{ display: 'flex', gap: '4px' }}>
    <button style={{
      width: '30px',
      height: '30px',
      minWidth: '30px',
      minHeight: '30px',
      maxWidth: '30px',
      maxHeight: '30px',
      padding: 0,
      boxSizing: 'border-box',
      // ... other styles
    }}>
      <FontAwesomeIcon icon={faIcon} style={{ fontSize: '13px' }} />
    </button>
    {/* Second button... */}
  </div>
  {/* Row 2 */}
  <div style={{ display: 'flex', gap: '4px' }}>
    {/* Third and fourth buttons... */}
  </div>
</div>
```

**Critical Properties for Square Buttons:**
| Property | Value | Purpose |
|----------|-------|---------|
| `width` | `30px` | Base width |
| `height` | `30px` | Base height |
| `minWidth` | `30px` | Prevent shrinking |
| `minHeight` | `30px` | Prevent shrinking |
| `maxWidth` | `30px` | Prevent stretching |
| `maxHeight` | `30px` | Prevent stretching |
| `padding` | `0` | Remove default padding |
| `boxSizing` | `border-box` | Include border in dimensions |
| `flexShrink` | `0` (on container) | Prevent flex compression |
| `alignSelf` | `center` (on container) | Prevent vertical stretch |

**Why NOT CSS Grid for fixed-size buttons:**
- `gridTemplateColumns/Rows` can be overridden by parent flex
- Grid items can stretch to fill cells even with explicit sizes
- Nested flexbox with explicit constraints is more predictable

#### Secondary/Outline Buttons
```jsx
<button
  style={{
    padding: '16px 24px',
    borderRadius: '16px',
    background: 'rgba(117, 139, 253, 0.1)',
    border: '1px solid rgba(117, 139, 253, 0.3)',
    color: '#758BFD',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = 'rgba(117, 139, 253, 0.2)';
    e.currentTarget.style.transform = 'scale(1.02)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = 'rgba(117, 139, 253, 0.1)';
    e.currentTarget.style.transform = 'scale(1)';
  }}
/>
```

#### Full-Width CTA Button (with Icon)
Use for major page actions like "Create Ticket", "Reset All Check-Ins":

```jsx
<button
  className="w-full flex items-center justify-center gap-2"
  style={{
    padding: '16px 24px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #758BFD, #BEADFF)',
    border: 'none',
    color: 'rgba(0, 0, 0, 0.75)',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(117, 139, 253, 0.3)',
    transition: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }}
  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
>
  <FontAwesomeIcon icon={faPlusCircle} />
  <span>Button Text</span>
</button>
```

**Key Points:**
- Use `display: 'flex'` with `alignItems: 'center'` and `gap: '8px'` for icon + text
- Icon goes BEFORE text
- Text color MUST be `rgba(0, 0, 0, 0.75)` for readability on gradient

#### Success/Confirm Button (Green Gradient)
Use for confirmations and positive actions:

```jsx
<button
  style={{
    padding: '16px 24px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #4ade80, #22c55e)',
    border: 'none',
    color: 'rgba(0, 0, 0, 0.75)',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(74, 222, 128, 0.3)',
    transition: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
  }}
  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
>
  <FontAwesomeIcon icon={faCircleCheck} style={{ marginRight: '8px' }} />
  Confirmar
</button>
```

#### Danger/Destructive Button
Use for delete, remove, or destructive actions:

```jsx
<button
  style={{
    padding: '16px 24px',
    borderRadius: '16px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
    e.currentTarget.style.transform = 'scale(1.02)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
    e.currentTarget.style.transform = 'scale(1)';
  }}
>
  Eliminar
</button>
```

#### Button Text Color Rules

| Button Type | Background | Text Color | Why |
|-------------|------------|------------|-----|
| Primary Gradient | `linear-gradient(#758BFD, #BEADFF)` | `rgba(0, 0, 0, 0.75)` | Dark text contrasts with light gradient |
| Success Gradient | `linear-gradient(#4ade80, #22c55e)` | `rgba(0, 0, 0, 0.75)` | Dark text contrasts with light green |
| Small Icon Buttons (30x30) | `linear-gradient(#758BFD, #BEADFF)` | `white` | Icon-only, white provides visibility |
| Secondary/Outline | Transparent/10% opacity | `#758BFD` | Brand color on subtle background |
| Danger/Outline | Transparent/10% opacity | `#ef4444` | Red text signals danger |

**IMPORTANT:** Large buttons with gradient backgrounds MUST use `rgba(0, 0, 0, 0.75)` text, NOT white. This is critical for accessibility and readability.

#### Button Sizing Reference

| Button Type | Padding | Border Radius | Font Size | Use Case |
|-------------|---------|---------------|-----------|----------|
| Large CTA | `16px 24px` | `16px` | `16px` | Primary actions, form submits |
| Medium | `12px 24px` | `16px` | `16px` | Secondary actions |
| Small Inline | `8px 16px` | `12px` | `14px` | Inline actions |
| Icon Only (30x30) | `0` | `8px` | Icon `13px` | Compact action grids |
| Icon Only (40x40) | `0` | `12px` | Icon `16px` | Feature highlights |

---

### Hover & Animation Standards

#### Standard Hover Effects

**Large Buttons:**
```jsx
onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
```

**Small Buttons (30x30):**
```jsx
onMouseEnter={(e) => {
  e.currentTarget.style.transform = 'scale(1.05)';
  e.currentTarget.style.boxShadow = '0 4px 12px rgba(117, 139, 253, 0.4)';
}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = 'scale(1)';
  e.currentTarget.style.boxShadow = '0 2px 8px rgba(117, 139, 253, 0.3)';
}}
```

**Cards (Lift Effect):**
```css
.hover-lift {
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.12);
}
```

#### Transition Standards

| Element | Transition | Easing |
|---------|------------|--------|
| All interactive elements | `250ms` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Parallax/scroll effects | `0.1s` | `ease-out` |
| Color changes | `250ms` | `cubic-bezier(0.4, 0, 0.2, 1)` |

**Standard transition declaration:**
```jsx
transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)'
// OR for transform only:
transition: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)'
```

---

### Opacity & Background Standards

#### Background Opacity Levels

| Opacity | Use Case | Example |
|---------|----------|---------|
| `0.05` | Subtle backgrounds, glass-clean | `rgba(255, 255, 255, 0.05)` |
| `0.08` | Glass-elevated backgrounds | `rgba(255, 255, 255, 0.08)` |
| `0.1` | Button backgrounds (default) | `rgba(117, 139, 253, 0.1)` |
| `0.2` | Button backgrounds (hover) | `rgba(117, 139, 253, 0.2)` |
| `0.3` | Shadows, borders | `rgba(117, 139, 253, 0.3)` |
| `0.4` | Enhanced shadows (hover) | `rgba(117, 139, 253, 0.4)` |

#### Border Opacity Standards

| State | Opacity | Example |
|-------|---------|---------|
| Default | `0.1` - `0.15` | `border: 1px solid rgba(117, 139, 253, 0.15)` |
| Subtle | `0.1` | `border: 1px solid rgba(255, 255, 255, 0.1)` |
| Visible | `0.3` | `border: 1px solid rgba(117, 139, 253, 0.3)` |
| Focus | `0.5` | `border-color: rgba(117, 139, 253, 0.5)` |

---

### Ticket Card Component

#### Structure & Spacing
```jsx
<div
  ref={cardRef}
  style={{
    position: 'relative',
    marginLeft: '4px',
    marginRight: '4px',
    borderRadius: '20px',
    padding: '4px 6px',
    transform: parallaxTransform,
    transition: 'transform 0.1s ease-out'
  }}
>
  {/* Content */}
</div>
```

**Key Points:**
- Outer horizontal margin: `4px` left and right
- Border radius: `20px` for rounded appearance
- Inner padding: `4px 6px` for density
- Parallax animation enabled (see below)

#### Text Margins
All left-aligned text elements should have `marginLeft: '4px'` for visual balance:

```jsx
// Title
<h3 style={{ marginLeft: '4px' }}>{ticket.buyerName}</h3>

// Subtitles
<p style={{ marginLeft: '4px' }}>{ticket.ticketId}</p>
<p style={{ marginLeft: '4px' }}>{ticket.ticketType}</p>
<p style={{ marginLeft: '4px' }}>{ticket.buyerPhone}</p>
```

#### Parallax Scroll Effect
Add smooth scroll-based animation to cards:

```jsx
const [scrollY, setScrollY] = useState(0);
const cardRef = useRef(null);

useEffect(() => {
  const handleScroll = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const scrollProgress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      setScrollY(scrollProgress);
    }
  };

  window.addEventListener('scroll', handleScroll);
  handleScroll();
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

const parallaxTransform = `translateY(${(scrollY - 0.5) * 10}px)`;
```

Apply to card: `transform: parallaxTransform`

---

### Icon Guidelines

#### FontAwesome Icons
- **Prevent stretching**: Always set explicit width and height
- **Use display block**: Add `display: 'block'` to prevent inline distortion
- **Squared sizing**: Width should equal height (13x13, 14x14, 16x16)

```jsx
// CORRECT - Squared icon
<FontAwesomeIcon
  icon={faIcon}
  style={{ fontSize: '13px', width: '13px', height: '13px', display: 'block' }}
/>

// WRONG - May appear stretched
<FontAwesomeIcon icon={faIcon} style={{ fontSize: '13px' }} />
```

#### Icon Sizes by Context
- Small buttons (30x30): `13px × 13px`
- Medium icons: `14px × 14px`
- Large/header icons: `16px × 16px`
- Success/status icons: `16px × 16px`

---

### Price Display

Always show prices as dollar amounts, treating 0 and undefined as `$0`:

```jsx
// CORRECT
${(event.ticketTypes[ticket.ticketType] || 0).toLocaleString()}

// WRONG - Shows "Cortesía" or "undefined"
{event.ticketTypes[ticket.ticketType] === 0 ? 'Cortesía' : `$${price}`}
```

---

### Conditional Rendering

#### Hide Empty/Default Values
Example: Phone numbers with default "000" should not display:

```jsx
{ticket.buyerPhone !== "000" && (
  <div>
    <p>{ticket.buyerPhone}</p>
  </div>
)}
```

---

## 📋 Implementation Checklist

### General
- [ ] Margin Reset: Does the element have `margin: 0`?
- [ ] Density Check: Is the padding/gap set to **4-6px**?
- [ ] Reading Ease: Is the primary text using `#E2D1B9` (not pure white)?
- [ ] Vertical Air: Is the `line-height` set to **1.1**?
- [ ] Hover State: Does it use proper hover effects with scale/shadow?
- [ ] Corner Radius: 8px (small buttons), 16px (large buttons), 20px (cards)?
- [ ] Transition: Uses `250ms cubic-bezier(0.4, 0, 0.2, 1)`?

### Forms
- [ ] Labels have `marginLeft: '2px'` and `marginBottom: '12px'`
- [ ] Icons are properly sized and colored (`#758BFD` with opacity 0.8)
- [ ] Phone field defaults to "000" and auto-selects on focus
- [ ] All inputs have proper focus states with `border-color: rgba(117,139,253,0.5)`
- [ ] Input backgrounds use `rgba(255,255,255,0.05)`

### Buttons
- [ ] **CRITICAL**: Large gradient buttons use `rgba(0, 0, 0, 0.75)` text, NOT white
- [ ] Small icon buttons (30x30) can use `white` text
- [ ] Hover effects use `scale(1.02)` for large, `scale(1.05)` for small
- [ ] All buttons have `cursor: 'pointer'`
- [ ] Primary gradient: `linear-gradient(135deg, #758BFD, #BEADFF)`
- [ ] Success gradient: `linear-gradient(135deg, #4ade80, #22c55e)`
- [ ] Box shadow: `0 4px 12px rgba(117, 139, 253, 0.3)`
- [ ] Icon + text buttons use `display: 'flex'` with `gap: '8px'`

### Small Action Buttons (30x30 Grid)
- [ ] Uses nested flexbox, NOT CSS Grid
- [ ] Each button has ALL size constraints: `width`, `height`, `minWidth`, `minHeight`, `maxWidth`, `maxHeight`
- [ ] Container has `flexShrink: 0` and `alignSelf: 'center'`
- [ ] Buttons have `padding: 0` and `boxSizing: 'border-box'`
- [ ] Icon size is `fontSize: '13px'`

### Cards
- [ ] Border radius is `20px`
- [ ] Horizontal margins are `4px` left and right
- [ ] Text elements have `marginLeft: '4px'`
- [ ] Parallax effect is enabled for scroll animation
- [ ] Prices always show as `$X` format, never "undefined"
- [ ] Glass effect: `glass-clean` or `glass-elevated` class applied

### Colors & Opacity
- [ ] Background opacity: `0.05` (subtle), `0.08` (elevated), `0.1` (button default)
- [ ] Hover background: increases opacity by `0.1` (e.g., `0.1` → `0.2`)
- [ ] Border opacity: `0.1`-`0.15` (default), `0.3` (visible), `0.5` (focus)
- [ ] Shadow opacity: `0.3` (default), `0.4` (hover)

---

## 🚫 Common Mistakes to Avoid

### Button Text Color
```jsx
// ❌ WRONG - Hard to read on gradient
color: 'white'

// ✅ CORRECT - High contrast, readable
color: 'rgba(0, 0, 0, 0.75)'
```

### Fixed-Size Buttons in Flex Containers
```jsx
// ❌ WRONG - CSS Grid can stretch in flex parents
<div style={{ display: 'grid', gridTemplateColumns: '30px 30px' }}>

// ✅ CORRECT - Nested flexbox with explicit constraints
<div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0, alignSelf: 'center' }}>
  <div style={{ display: 'flex', gap: '4px' }}>
```

### Button Sizing
```jsx
// ❌ WRONG - Only width/height, can still stretch
style={{ width: '30px', height: '30px' }}

// ✅ CORRECT - All constraints prevent any stretching
style={{
  width: '30px', height: '30px',
  minWidth: '30px', minHeight: '30px',
  maxWidth: '30px', maxHeight: '30px',
  padding: 0, boxSizing: 'border-box'
}}
```

### Hover Effects
```jsx
// ❌ WRONG - No transition, jarring
onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}

// ✅ CORRECT - Smooth with transition in base style
style={{ transition: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)' }}
onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
```

### Tailwind CSS v4
```css
/* ❌ WRONG - @apply causes errors in Tailwind v4 */
body { @apply text-gray-900; }

/* ✅ CORRECT - Use plain CSS with hex colors */
body { color: #111827; }
```
