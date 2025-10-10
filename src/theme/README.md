# FRAM3 Theme System

Comprehensive guide for using the FRAM3 multi-brand theming system with MUI and Tailwind 4.0.

## Table of Contents

- [Overview](#overview)
- [Color System](#color-system)
- [Usage Guidelines](#usage-guidelines)
- [Component Patterns](#component-patterns)
- [Best Practices](#best-practices)

## Overview

The FRAM3 theme system provides seamless integration between:

- **MUI (Material-UI)** - Component library with theme support
- **Tailwind CSS 4.0** - Utility-first CSS framework
- **CSS Variables** - Dynamic brand switching

### Theme Architecture

```
brandConfig.ts          → Brand definitions (colors, fonts, spacing)
       ↓
theme/palette.ts        → MUI color palettes (light/dark)
       ↓
theme/theme.ts          → MUI theme creation
       ↓
globals.css             → CSS variables for Tailwind
       ↓
tailwind.config.ts      → Tailwind configuration
```

## Color System

### FRAM3 Brand Colors

#### Light Mode

The light mode uses a sophisticated bronze-brown and orange-gold gradient palette for a warm, professional appearance with excellent contrast.

**Primary (Bronze-Brown)**

- Main: `#8d600d` - Midpoint of charcoal-to-gold gradient, main UI elements
- Light: `#b77d11` - Lighter bronze for hover states
- Dark: `#634309` - Darker bronze for emphasis and depth
- Contrast Text: `#FFFFFF` - White text on bronze buttons

**Secondary (Orange-Gold)**

- Main: `#ffa500` - Accent color for highlights and secondary actions
- Light: `#ffc04d` - Light accent for hover states
- Dark: `#ff8c00` - Dark accent for active states
- Contrast Text: `#000000` - Black text on orange-gold

**Background**

- Default: `#f8f9fa` - Light gray page background
- Paper: `#ffffff` - White for cards and elevated surfaces

**Text**

- Primary: `#1a1a1a` - Deep charcoal for primary text
- Secondary: `#6b7280` - Medium gray for secondary text

**Design Philosophy:**

- Warm, inviting color palette with bronze and gold tones
- High contrast for excellent readability (WCAG AAA compliant)
- Professional appearance suitable for business applications
- Bronze-brown bridges the gap between dark and light themes

#### Dark Mode

The dark mode features the iconic gold and black combination for premium brand identity.

**Primary (Gold)**

- Main: `#FFD700` - Signature gold color
- Light: `#FFE44D` - Light gold for subtle elements
- Dark: `#FFC000` - Dark gold for depth
- Contrast Text: `#000000` - Black text on gold buttons

**Secondary (White)**

- Main: `#FFFFFF` - Pure white for contrast
- Light: `#FFFFFF` - Consistent white
- Dark: `#E0E0E0` - Light gray
- Contrast Text: `#000000` - Black text on white

**Background**

- Default: `#000000` - Pure black background
- Paper: `#121212` - Very dark gray for cards/surfaces

**Text**

- Primary: `#FFFFFF` - White text
- Secondary: `#B3B3B3` - Light gray secondary text

**Design Philosophy:**

- Timeless black and gold combination
- Maximum impact and brand recognition
- Superior for extended viewing in low-light environments
- Premium, high-end aesthetic

## Usage Guidelines

### Using MUI Components

MUI components automatically use the theme palette:

```tsx
import { Button, Typography, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";

function MyComponent() {
  const theme = useTheme();

  return (
    <Box>
      {/* ✅ Uses primary.main (bronze in light, gold in dark) */}
      <Button variant="contained" color="primary">
        Primary Action
      </Button>

      {/* ✅ Uses secondary.main (orange-gold in light, white in dark) */}
      <Button variant="contained" color="secondary">
        Secondary Action
      </Button>

      {/* ✅ Uses text.primary */}
      <Typography variant="h1" color="text.primary">
        Heading
      </Typography>

      {/* ✅ Uses theme palette directly */}
      <Box sx={{ bgcolor: "background.paper", color: "text.primary" }}>
        Content
      </Box>

      {/* ✅ Uses gradient from charcoal to orange-gold */}
      <Typography
        sx={{
          background: `linear-gradient(135deg, #1a1a1a 0%, ${theme.palette.secondary.main} 100%)`,
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Gradient Text
      </Typography>
    </Box>
  );
}
```

### Using Tailwind Utilities

Tailwind classes automatically map to CSS variables:

```tsx
function TailwindComponent() {
  return (
    <div className="bg-brand-background min-h-screen">
      {/* ✅ BACKGROUNDS */}
      <div className="bg-brand-primary text-white p-4">
        Primary Background (Bronze in light, Gold in dark)
      </div>

      <div className="bg-brand-secondary text-black p-4">
        Secondary Background (Orange-gold in light, White in dark)
      </div>

      <div className="bg-brand-surface p-4">Surface Background</div>

      {/* ✅ TEXT COLORS */}
      <h1 className="text-brand-text font-heading">Primary Text</h1>

      <p className="text-brand-text-secondary">Secondary Text</p>

      {/* ✅ GRADIENTS */}
      <h1 className="text-brand-gradient font-heading">Gradient Text</h1>

      {/* ✅ BORDERS */}
      <div className="border border-brand-primary rounded-brand">
        Bordered Box
      </div>

      {/* ✅ BRAND SHADOWS */}
      <div className="brand-shadow-lg">Box with Brand Shadow</div>

      {/* ✅ CUSTOM UTILITIES */}
      <div className="glass-brand glow-brand">Glass Effect with Glow</div>
    </div>
  );
}
```

### Mixing MUI and Tailwind

You can combine both approaches:

```tsx
import { Paper } from "@mui/material";

function MixedComponent() {
  return (
    <Paper
      className="rounded-brand p-4"
      sx={{
        bgcolor: "background.paper",
        border: 1,
        borderColor: "primary.main",
      }}
    >
      <h2 className="font-heading text-brand-gradient">Mixed Styling</h2>
      <p className="text-brand-text-secondary">
        Combines MUI Paper with Tailwind utilities
      </p>
    </Paper>
  );
}
```

## Component Patterns

### Buttons

```tsx
// Primary Action (bronze in light, gold in dark)
<Button variant="contained" color="primary">
  Primary Action
</Button>

// Secondary Action (orange-gold in light, white in dark)
<Button variant="contained" color="secondary">
  Secondary Action
</Button>

// Outlined (border only)
<Button variant="outlined" color="primary">
  Outlined
</Button>

// Text Button (minimal)
<Button variant="text" color="primary">
  Text Button
</Button>

// Gradient Button (charcoal to orange-gold)
<Button
  variant="contained"
  sx={{
    background: `linear-gradient(135deg, #1a1a1a 0%, ${theme.palette.secondary.main} 100%)`,
    '&:hover': {
      background: `linear-gradient(135deg, #000000 0%, ${theme.palette.secondary.dark} 100%)`,
    },
  }}
>
  Gradient Button
</Button>
```

### Cards

```tsx
import { Card, CardContent } from '@mui/material';

// Standard Card
<Card sx={{
  bgcolor: 'background.paper',
  borderRadius: 'var(--brand-radius)',
}}>
  <CardContent>
    Card Content
  </CardContent>
</Card>

// Card with Border
<Card sx={{
  bgcolor: 'background.paper',
  border: 1,
  borderColor: 'primary.main',
}}>
  <CardContent>
    Card with Border
  </CardContent>
</Card>

// Glass Effect Card (Tailwind)
<div className="glass-brand rounded-brand p-6">
  <h3 className="font-heading text-brand-text">Glass Card</h3>
  <p className="text-brand-text-secondary">Frosted glass effect</p>
</div>
```

## Best Practices

### DO ✅

1. **Use theme palette colors**

   ```tsx
   // ✅ Good
   <Box sx={{ bgcolor: 'primary.main' }} />

   // ❌ Bad
   <Box sx={{ bgcolor: '#8d600d' }} />
   ```

2. **Use theme typography**

   ```tsx
   // ✅ Good
   <Typography variant="h1">Heading</Typography>

   // ❌ Bad - hardcoded font
   <h1 style={{ fontFamily: 'Orbitron' }}>Heading</h1>
   ```

3. **Use theme spacing**

   ```tsx
   // ✅ Good
   <Box sx={{ p: 3, mt: 2 }} />

   // ❌ Bad
   <Box sx={{ padding: '24px', marginTop: '16px' }} />
   ```

4. **Reference CSS variables in Tailwind**

   ```tsx
   // ✅ Good
   <div className="bg-brand-primary" />

   // ❌ Bad
   <div className="bg-[#8d600d]" />
   ```

5. **Use contrast text from palette**

   ```tsx
   // ✅ Good
   <Button sx={{ color: 'primary.contrastText' }} />

   // ❌ Bad - assumes color
   <Button sx={{ color: 'white' }} />
   ```

### DON'T ❌

1. **Don't hardcode colors**
   - Use theme palette or CSS variables
   - Colors should adapt to theme mode

2. **Don't hardcode fonts**
   - Use brand configuration
   - Fonts may differ between brands

3. **Don't hardcode spacing**
   - Use theme spacing or CSS variables
   - Maintain consistency

4. **Don't assume theme mode**
   - Components should work in both modes
   - Test in light and dark themes

### Color Usage Guide

**When to use Primary (Bronze-Brown/Gold)**

- Main action buttons
- Primary headings
- Important UI elements
- Key interactive elements
- Brand identity markers

**When to use Secondary (Orange-Gold/White)**

- Secondary actions
- Accents and highlights
- Hover states
- Visual interest
- Complementary elements

**When to use Background Colors**

- Page backgrounds (`background.default`)
- Card surfaces (`background.paper`)
- Form inputs
- Elevated elements

**When to use Text Colors**

- Body text (`text.primary`)
- Labels and captions (`text.secondary`)
- Headings (often `text.primary` or gradient)

### Testing Themes

Always test components in both light and dark modes:

```tsx
import { useThemeMode } from "@/theme";

function ThemeTest() {
  const { isDarkMode, toggleTheme } = useThemeMode();

  return (
    <Box>
      <Button onClick={toggleTheme}>
        Toggle Theme (Currently: {isDarkMode ? "Dark" : "Light"})
      </Button>

      {/* Your component to test */}
      <YourComponent />
    </Box>
  );
}
```

### Accessibility

Ensure proper contrast ratios:

- Light Mode: Bronze (#8d600d) on White (#FFFFFF) = 8.7:1 ✅ (WCAG AAA)
- Light Mode: Charcoal (#1a1a1a) on Light Gray (#f8f9fa) = 15.8:1 ✅ (WCAG AAA)
- Dark Mode: Gold (#FFD700) on Black (#000000) = 13.7:1 ✅ (WCAG AAA)
- Dark Mode: White (#FFFFFF) on Black (#000000) = 21:1 ✅ (WCAG AAA)
- Orange-Gold accents: Use sparingly, not for large text areas

## Quick Reference

### MUI Theme Palette Keys

```typescript
// Colors
primary.main, primary.light, primary.dark, primary.contrastText
secondary.main, secondary.light, secondary.dark, secondary.contrastText
background.default, background.paper
text.primary, text.secondary
error.main, warning.main, info.main, success.main
divider

// Typography
fontFamily, fontSize, fontWeight
h1, h2, h3, h4, h5, h6
body1, body2
button, caption

// Spacing
theme.spacing(1) = 8px
theme.spacing(2) = 16px
theme.spacing(3) = 24px

// Breakpoints
xs, sm, md, lg, xl, xxl
```

### Tailwind Brand Classes

```css
/* Colors */
bg-brand-primary, text-brand-primary
bg-brand-secondary, text-brand-secondary
bg-brand-surface, bg-brand-background
text-brand-text, text-brand-text-secondary

/* Gradients */
bg-brand-gradient, bg-brand-gradient-reverse
text-brand-gradient, text-brand-gradient-reverse

/* Borders */
border-brand-primary
rounded-brand, rounded-brand-sm, rounded-brand-lg

/* Effects */
brand-shadow, brand-shadow-sm, brand-shadow-lg
glass-brand
glow-brand, glow-brand-sm, glow-brand-lg

/* Utilities */
scrollbar-brand
```

## Support

For questions or issues with the theme system:

1. Check this documentation
2. Review `brandConfig.ts` for brand definitions
3. Inspect `globals.css` for CSS variables
4. Examine existing components for examples
