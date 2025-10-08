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
The light mode uses a sophisticated charcoal and orange-gold palette for a professional, high-contrast appearance.

**Primary (Charcoal)**
- Main: `#1a1a1a` - Main UI elements, buttons, headings
- Light: `#424242` - Lighter variant for subtle elements
- Dark: `#000000` - Darkest variant for emphasis
- Contrast Text: `#FFFFFF` - White text on charcoal buttons

**Secondary (Orange-Gold)**
- Main: `#ffa500` - Accent color for highlights
- Light: `#ffc04d` - Light accent for hover states
- Dark: `#ff8c00` - Dark accent for active states
- Contrast Text: `#000000` - Black text on orange-gold

**Background**
- Default: `#FFFFFF` - Page background (pure white)
- Paper: `#f8f9fa` - Cards and elevated surfaces

**Text**
- Primary: `#1a1a1a` - Primary text (deep charcoal)
- Secondary: `#6b7280` - Secondary text (medium gray)

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

## Usage Guidelines

### Using MUI Components

MUI components automatically use the theme. Always reference theme colors through the palette:

```tsx
import { Button, Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

function MyComponent() {
  const theme = useTheme();

  return (
    <Box>
      {/* ✅ PRIMARY BUTTON - Dark charcoal (light) / Gold (dark) */}
      <Button
        variant="contained"
        color="primary"
      >
        Primary Action
      </Button>

      {/* ✅ SECONDARY BUTTON - Orange-gold (light) / White (dark) */}
      <Button
        variant="contained"
        color="secondary"
      >
        Secondary Action
      </Button>

      {/* ✅ OUTLINED BUTTON - Uses primary color for border */}
      <Button
        variant="outlined"
        color="primary"
      >
        Outlined
      </Button>

      {/* ✅ CUSTOM COLORS - Reference theme palette */}
      <Box sx={{
        bgcolor: 'background.default',
        color: 'text.primary',
        borderColor: 'divider',
      }}>
        Content
      </Box>

      {/* ✅ GRADIENT BACKGROUNDS */}
      <Box sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
      }}>
        Gradient Box
      </Box>
    </Box>
  );
}
```

### Using Tailwind Classes

Tailwind classes automatically sync with theme via CSS variables:

```tsx
function MyComponent() {
  return (
    <div>
      {/* ✅ BRAND COLORS */}
      <div className="bg-brand-primary text-brand-text">
        Primary Background
      </div>

      <div className="bg-brand-secondary text-black">
        Secondary Background
      </div>

      <div className="bg-brand-surface text-brand-text">
        Surface (Card) Background
      </div>

      {/* ✅ BRAND GRADIENTS */}
      <div className="bg-brand-gradient text-white">
        Gradient Background
      </div>

      <div className="bg-brand-gradient-reverse text-white">
        Reverse Gradient
      </div>

      {/* ✅ TEXT GRADIENTS */}
      <h1 className="text-brand-gradient font-heading">
        Gradient Text
      </h1>

      {/* ✅ BORDERS */}
      <div className="border border-brand-primary rounded-brand">
        Bordered Box
      </div>

      {/* ✅ BRAND SHADOWS */}
      <div className="brand-shadow-lg">
        Box with Brand Shadow
      </div>

      {/* ✅ CUSTOM UTILITIES */}
      <div className="glass-brand glow-brand">
        Glass Effect with Glow
      </div>
    </div>
  );
}
```

### Mixing MUI and Tailwind

You can combine both approaches:

```tsx
import { Paper } from '@mui/material';

function MixedComponent() {
  return (
    <Paper
      className="rounded-brand p-4"
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'primary.main',
      }}
    >
      <h2 className="font-heading text-brand-gradient">
        Mixed Styling
      </h2>
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
// Primary Action (main brand color)
<Button variant="contained" color="primary">
  Primary Action
</Button>

// Secondary Action (accent color)
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

// Gradient Button
<Button
  variant="contained"
  sx={{
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    '&:hover': {
      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
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
  borderRadius: `${brand.borderRadius}px`,
  border: 1,
  borderColor: 'divider',
}}>
  <CardContent>
    Card Content
  </CardContent>
</Card>

// Elevated Card with Hover
<Card sx={{
  bgcolor: 'background.paper',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 8px 24px ${theme.palette.primary.main}20`,
  },
}}>
  <CardContent>
    Hover Effect
  </CardContent>
</Card>
```

### Typography

```tsx
import { Typography } from '@mui/material';

// Headings (use brand heading font)
<Typography variant="h1" sx={{ fontFamily: brand.fonts.heading }}>
  Main Heading
</Typography>

// Body Text (use brand body font)
<Typography variant="body1" sx={{ color: 'text.primary' }}>
  Body text
</Typography>

// Secondary Text
<Typography variant="body2" sx={{ color: 'text.secondary' }}>
  Secondary text
</Typography>

// Gradient Text
<Typography
  variant="h2"
  sx={{
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  }}
>
  Gradient Text
</Typography>
```

### Forms

```tsx
import { TextField, FormControl, InputLabel } from '@mui/material';

// Text Input
<TextField
  fullWidth
  label="Name"
  variant="outlined"
  sx={{
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: 'primary.main',
      },
    },
  }}
/>

// Custom Styled Input
<TextField
  fullWidth
  label="Email"
  variant="outlined"
  sx={{
    bgcolor: 'background.paper',
    borderRadius: `${brand.borderRadius}px`,
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: 'divider',
      },
      '&:hover fieldset': {
        borderColor: 'primary.main',
      },
      '&.Mui-focused fieldset': {
        borderColor: 'primary.main',
        borderWidth: '2px',
      },
    },
  }}
/>
```

## Best Practices

### DO ✅

1. **Always use theme palette colors**
   ```tsx
   // ✅ Good
   <Box sx={{ bgcolor: 'primary.main' }} />

   // ❌ Bad
   <Box sx={{ bgcolor: '#1a1a1a' }} />
   ```

2. **Use brand fonts from config**
   ```tsx
   // ✅ Good
   <Typography sx={{ fontFamily: brand.fonts.heading }} />

   // ❌ Bad
   <Typography sx={{ fontFamily: 'Orbitron' }} />
   ```

3. **Use brand border radius**
   ```tsx
   // ✅ Good
   <Card sx={{ borderRadius: `${brand.borderRadius}px` }} />

   // ❌ Bad
   <Card sx={{ borderRadius: '8px' }} />
   ```

4. **Reference CSS variables in Tailwind**
   ```tsx
   // ✅ Good
   <div className="bg-brand-primary" />

   // ❌ Bad
   <div className="bg-[#1a1a1a]" />
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

**When to use Primary (Charcoal/Gold)**
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
import { useThemeMode } from '@/theme';

function ThemeTest() {
  const { isDarkMode, toggleTheme } = useThemeMode();

  return (
    <Box>
      <Button onClick={toggleTheme}>
        Toggle Theme (Currently: {isDarkMode ? 'Dark' : 'Light'})
      </Button>

      {/* Your component to test */}
      <YourComponent />
    </Box>
  );
}
```

### Accessibility

Ensure proper contrast ratios:

- Light Mode: Charcoal (#1a1a1a) on White (#FFFFFF) = 16.8:1 ✅ (WCAG AAA)
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
