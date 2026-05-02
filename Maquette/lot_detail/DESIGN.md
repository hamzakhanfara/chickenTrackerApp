---
name: AgriPro Modern
colors:
  surface: '#f7fbf1'
  surface-dim: '#d8dbd2'
  surface-bright: '#f7fbf1'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f5ec'
  surface-container: '#ecefe6'
  surface-container-high: '#e6e9e0'
  surface-container-highest: '#e0e4db'
  on-surface: '#191d17'
  on-surface-variant: '#41493e'
  inverse-surface: '#2d322c'
  inverse-on-surface: '#eff2e9'
  outline: '#717a6d'
  outline-variant: '#c0c9bb'
  surface-tint: '#2a6b2c'
  primary: '#00450d'
  on-primary: '#ffffff'
  primary-container: '#1b5e20'
  on-primary-container: '#90d689'
  inverse-primary: '#91d78a'
  secondary: '#9e4200'
  on-secondary: '#ffffff'
  secondary-container: '#fb6d00'
  on-secondary-container: '#562100'
  tertiary: '#6b1d3d'
  on-tertiary: '#ffffff'
  tertiary-container: '#883454'
  on-tertiary-container: '#ffaec6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#acf4a4'
  primary-fixed-dim: '#91d78a'
  on-primary-fixed: '#002203'
  on-primary-fixed-variant: '#0c5216'
  secondary-fixed: '#ffdbcb'
  secondary-fixed-dim: '#ffb691'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#793100'
  tertiary-fixed: '#ffd9e2'
  tertiary-fixed-dim: '#ffb1c8'
  on-tertiary-fixed: '#3e001d'
  on-tertiary-fixed-variant: '#7a2949'
  background: '#f7fbf1'
  on-background: '#191d17'
  surface-variant: '#e0e4db'
typography:
  headline-lg:
    fontFamily: Work Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Work Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Work Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bilingual:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  caption:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  touch-target-min: 48px
---

## Brand & Style

The design system is built on a foundation of **Modern Corporate** aesthetics, optimized specifically for the agricultural sector. It balances the grounded reliability of traditional farming with the precision of modern data tracking. The visual narrative focuses on clarity, trust, and high legibility to accommodate non-tech-savvy users in outdoor or high-glare environments. 

The style utilizes a "functional card-based" architecture, prioritizing information density that remains scannable. By using a white background with deep green accents, the system evokes growth and professionalism, while the orange accents provide clear calls to action and critical alerts. The interface is intentionally "quiet" to ensure that data and status indicators are the primary focus.

## Colors

The palette is anchored by a deep forest green, representing stability and the agricultural nature of the product. This color is used for primary navigation, headers, and key branding elements. The accent orange is reserved for interactive elements that require high visibility, such as primary action buttons and "New Entry" triggers.

A semantic color system is employed for status badges: 
- **Active:** Deep Green (Success)
- **Alert:** Deep Orange (Warning)
- **Closed/Archive:** Medium Grey (Neutral)

Backgrounds are kept strictly white to maximize contrast and maintain a clean, professional appearance.

## Typography

This design system utilizes **Work Sans** for its exceptional legibility and professional, neutral tone. The font's large x-height makes it highly readable on mobile devices, even for users with limited technical experience.

**Bilingual Implementation:** 
All labels must support a stacked or side-by-side Arabic and French format. The Arabic typeface should be matched in visual weight to the Work Sans weight used for French. 
- Primary labels use `body-lg` or `body-md`.
- Secondary descriptive text uses `label-bilingual`.
- Numerical data in charts and tables should use a medium weight to ensure clarity.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a focus on vertical stacking. 
- **Margins:** 16px side margins on mobile devices to maximize screen real estate.
- **Gutters:** 12px between cards in a vertical stack.
- **Rhythm:** A strict 8px baseline grid ensures consistent vertical pacing.

The "Card-based" philosophy means every data group is encapsulated in a white container with a subtle border or shadow, separating the app's surface into manageable, touchable chunks of information.

## Elevation & Depth

This design system uses **Tonal Layers** combined with **Ambient Shadows** to define hierarchy. 
- **Surface Level 0:** The main white background.
- **Surface Level 1 (Cards):** Uses a very soft, diffused shadow (Blur: 8px, Y: 2px, Opacity: 6% Black) to lift the content from the background.
- **Floating Actions:** Primary buttons use a slightly more pronounced shadow to indicate interactivity.

Instead of heavy borders, the system uses 1px strokes in a light neutral grey (#E0E0E0) for card boundaries to maintain a clean, high-end feel without adding visual noise.

## Shapes

The shape language is **Rounded**, conveying a friendly and modern accessible feel. 
- **Standard Cards:** 0.5rem (8px) corner radius.
- **Large Buttons:** 0.5rem (8px) corner radius to maintain a sturdy, professional look.
- **Status Badges:** Fully rounded (Pill-shaped) to distinguish them from interactive buttons.
- **Input Fields:** 8px radius to match the overall container aesthetic.

## Components

### Buttons
- **Primary:** Deep Green (#1B5E20) background, white text. Height: 56px for maximum touch-friendliness.
- **Secondary/Action:** Orange (#FF6F00) background for critical "Add" or "Start" actions.
- **Labeling:** Must include both Arabic and French (e.g., "Confirm / تأكيد").

### Notification Cards (WhatsApp-style)
- **Structure:** Left-aligned icon or status indicator, followed by a bold title, a short descriptive snippet, and a timestamp in the top right.
- **Interaction:** The entire card is a touch target. Use a subtle grey hover/pressed state.

### Status Badges
- Small, pill-shaped indicators.
- **Active:** Light green background with Deep Green text.
- **Closed:** Light grey background with Dark Grey text.
- **Alert:** Light orange background with Deep Orange text.

### Simple Charts
- Use minimalist Bar and Line charts.
- **Colors:** Use Primary Green for historical data and Orange for targets or alerts.
- **Gridlines:** Light grey, horizontal only, to reduce clutter.

### Input Fields
- Minimum height of 48px. 
- Labels always visible above the field (not just as placeholders) to assist non-tech-savvy users in keeping track of their progress.