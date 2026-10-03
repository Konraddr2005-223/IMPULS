---
name: Urban Civic Pulse
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#4f4633'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#817660'
  outline-variant: '#d3c5ac'
  surface-tint: '#785a00'
  primary: '#785a00'
  on-primary: '#ffffff'
  primary-container: '#eab308'
  on-primary-container: '#604700'
  inverse-primary: '#f7be1d'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#006398'
  on-tertiary: '#ffffff'
  tertiary-container: '#78c2ff'
  on-tertiary-container: '#004f7a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdf9a'
  primary-fixed-dim: '#f7be1d'
  on-primary-fixed: '#251a00'
  on-primary-fixed-variant: '#5a4300'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#cce5ff'
  tertiary-fixed-dim: '#93ccff'
  on-tertiary-fixed: '#001d31'
  on-tertiary-fixed-variant: '#004b73'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Public Sans
    fontSize: 44px
    fontWeight: '800'
    lineHeight: 52px
    letterSpacing: -0.03em
  display-mobile:
    fontFamily: Public Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Public Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Public Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Public Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Public Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Public Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Public Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Public Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-code:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system expresses a high-visibility, civic-tech identity tailored for public utility, municipal transparency, and active citizen participation. The aesthetic balances authoritative institutional clarity with the urgent, vibrant energy of civic infrastructure and urban transit wayfinding.

The design movement fuses **High-Contrast Modernism** with **Civic Utility / Transit Signage**:
- High-contrast visual signaling inspired by municipal municipal wayfinding, street furniture, and public transit maps.
- Utilitarian precision balanced by warm, sunny yellow accents that communicate optimism, civic alertness, and community momentum without slipping into hazard or warning tropes.
- Structured, data-dense layouts with clean negative space, engineered to instill trust, administrative legibility, and public accountability across both desktop dashboards and responsive field tools.

## Colors

The palette transitions the core identity from amber-orange to an electric, sunny, municipal yellow (`#eab308` / `#facc15`). To guarantee AA and AAA contrast compliance across civic interfaces, yellow serves strictly as a luminous background or interactive surface paired with deep slate-navy ink (`#0f172a`).

- **Primary (`#eab308` / `#fde047`)**: The vibrant civic yellow used for high-impact interactions, interactive map pins, active badges, status alerts, and primary trigger buttons.
- **Secondary (`#0f172a`)**: Deep Midnight Slate. Serves as the primary contrast partner for yellow elements, delivering structural firmness, high-density readability, and institutional gravity.
- **Tertiary (`#0284c7`)**: Cobalt Blue, reserved for municipal infrastructure anchors, water/environmental telemetry, and external verification links.
- **Neutral (`#64748b` base / `#f8fafc` canvas / `#0f172a` text)**: Slate grayscale providing balanced background hierarchy and sharp typography.

### Contrast & Legibility Rules
- Never render text in `#eab308` or `#facc15` on white or light gray surfaces.
- All primary buttons, active chips, and map markers tinted with `#eab308` must use `#0f172a` for typography and iconography.
- Hover states for primary yellow interactive surfaces darken to deep honey `#ca8a04` to maintain solid visual feedback.

## Typography

Typography pairs **Public Sans** with **JetBrains Mono** to unite civic institutional clarity with telemetry-grade data precision.

- **Public Sans**: Selected for its ergonomic legibility, structural neutrality, and governmental transparency roots. Headings feature tight tracking and robust weights (`700` and `800`) to evoke civic architectural signage and municipal bulletins.
- **JetBrains Mono**: Deployed selectively across metadata, reference IDs, ticket numbers, geospatial coordinates, and timestamp chips to underscore systemic accuracy and auditability.

## Layout & Spacing

The layout is grounded in a 12-column responsive fluid grid designed to support dense public dashboards, real-time civic maps, and split-screen incident queues:

- **Desktop (1200px+)**: 12 columns with `2.5rem` outer margins and `1.5rem` gutters. Map and list layouts adopt side-by-side split viewports with persistent navigation.
- **Tablet (768px - 1199px)**: 8 columns with `1.5rem` margins and `1rem` gutters. Collapsible contextual utility drawers.
- **Mobile (under 768px)**: 4 columns with `1rem` margins and `1rem` gutters. Stacked viewports where interactive maps dock dynamically with swipeable bottom sheets.

Component internal padding obeys strict geometric increments: `space-xs` (4px), `space-sm` (8px), `space-md` (16px), `space-lg` (24px), and `space-xl` (40px).

## Elevation & Depth

Visual hierarchy emphasizes physical legibility and structural discipline over arbitrary floating layers:

- **Tonal Layering**: Base canvas utilizes `#f8fafc`. Surface cards sit on `#ffffff`, while modal overlays, floating inspect panels, and map overlays use `#ffffff` framed by subtle border tokens (`#e2e8f0`).
- **Low-Diffusion Ambient Shadows**: Modals and dropdown flyouts employ a warm-tinted shadow formula (`0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`).
- **Map Pin Projection**: Active yellow pins carry a distinct, high-clarity drop shadow (`0 4px 12px rgba(234, 179, 8, 0.45)`) that elevates the pin cleanly above complex geospatial tile layers without sacrificing icon sharpness.

## Shapes

The design system uses a balanced `roundedness: 2` geometry. UI elements strike an equilibrium between friendly civic accessibility and disciplined, structured utility.

- Standard cards, panels, and forms: `0.5rem` (8px).
- Map markers, floating actions, search bars, and dialogs: `1rem` (16px).
- Status tags, micro-badges, and filter chips: Full pill curvature (`9999px`) to maintain contrast with rectangular data tables.

## Components

### Buttons
- **Primary**: Background `#eab308`, text and icons `#0f172a` (600 weight). Hover state transitions to `#ca8a04` with a smooth 150ms ease. Focus ring is an explicit double ring: 2px `#ffffff` offset + 2px `#0f172a`.
- **Secondary**: Dark `#0f172a` background with `#ffffff` text; hover state reaches `#1e293b`.
- **Outline / Neutral**: Background transparent, border 1.5px `#e2e8f0`, text `#0f172a`; hover activates `#fef9c3` (soft warm yellow wash) with `#a16207` border.

### Interactive Map Pins & Waypoints
- **Default Pin**: Teardrop or circular marker with vibrant sunny yellow `#facc15` fill, framed by a 2px `#0f172a` stroke for high contrast over satellite and street map styles.
- **Active / Focused Pin**: Scales up by 15%, changes fill to solid `#eab308` with a pulsing outer ring of `rgba(234, 179, 8, 0.3)`. Icon/glyph inside is strictly `#0f172a`.
- **Clustered Nodes**: Pill-shaped badges filled with `#eab308`, displaying counter text in JetBrains Mono (`label-code`) in solid `#0f172a`.

### Chips & Badges
- **Status Alerts (Open / Active)**: Yellow badge with `#fef08a` background, `#713f12` text, and a `#ca8a04` 1px border.
- **Category Filter Chips**: Default state has white background with `#e2e8f0` border. Active filter state switches to `#fde047` background with `#0f172a` text and border.

### Lists & Data Grids
- Clean tabular rows divided by `#f1f5f9` rules.
- Hovering a record highlights the row with `#fefce8` (luminous yellow-100 tint) and paints a 3px vertical accent indicator along the left edge using `#eab308`.

### Checkboxes & Radio Buttons
- Default: 1.5px border `#94a3b8` on `#ffffff`.
- Checked: Fill `#eab308` with `#0f172a` checkmark or center pip. Focus states generate a 3px outer halo in `rgba(234, 179, 8, 0.25)`.

### Input Fields
- Structured `#ffffff` background with 1.5px `#cbd5e1` border.
- Focus state updates the border to `#ca8a04` and applies a 3px ring in `rgba(234, 179, 8, 0.2)`. Error states override directly to deep crimson `#dc2626`.

### Cards
- Elevation Tier 1: Crisp `#ffffff` surface, 1px border `#e2e8f0`, radius 8px.
- Highlighted / Urgent Cards: Contain a solid 4px top or left border of `#eab308` accompanied by `#fefce8` subtle background gradients to emphasize immediate civic notices.