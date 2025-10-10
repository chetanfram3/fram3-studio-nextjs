# React TypeScript to Next.js 15 Porting Guide

**Version:** 1.0  
**Last Updated:** October 2025  
**Status:** Active Standard

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Porting Checklist](#pre-porting-checklist)
3. [File Organization](#file-organization)
4. [Component Migration Steps](#component-migration-steps)
5. [Type Safety Requirements](#type-safety-requirements)
6. [Lint Error Resolution](#lint-error-resolution)
7. [State Management Migration](#state-management-migration)
8. [Data Fetching Migration](#data-fetching-migration)
9. [SSR Optimization](#ssr-optimization)
10. [MUI 7 Grid Migration](#mui-7-grid-migration)
11. [Theme & Branding Integration](#theme--branding-integration)
12. [useEffect Best Practices](#useeffect-best-practices)
13. [Testing & Validation](#testing--validation)
14. [Common Pitfalls](#common-pitfalls)

---

## Overview

This guide provides a systematic approach to porting React TypeScript components to this Next.js 15 project while maintaining consistency, type safety, and following best practices.

### Core Technologies

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **UI Libraries:** Material-UI 7 + Tailwind CSS 4.0
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **Authentication:** Firebase Auth
- **Styling:** Emotion (MUI) + Tailwind utilities

---

## Pre-Porting Checklist

Before starting the migration, verify the following:

- [ ] Review existing project structure in `src/`
- [ ] Read `src/theme/README.md` for branding guidelines
- [ ] Review `component_guidelines.txt` for styling standards
- [ ] Read `auth_hooks_guide.md` if component uses authentication
- [ ] Understand `Instructions_MUI7_GRID.txt` for Grid usage
- [ ] Identify component dependencies (props, context, state)
- [ ] Determine if component needs SSR or can be client-only
- [ ] Check for external API calls or data fetching logic

---

## File Organization

### Directory Structure

Follow this structure for consistency:

```
src/
├── app/                          # Next.js App Router (pages & layouts)
│   ├── (auth)/                   # Auth route group
│   ├── dashboard/                # Dashboard routes
│   └── page.tsx                  # Root page
├── components/                   # React Components
│   ├── common/                   # Shared components (buttons, cards, etc.)
│   ├── layout/                   # Layout components (header, footer, sidebar)
│   ├── auth/                     # Authentication components
│   ├── branding/                 # Brand-specific components
│   ├── profile/                  # Profile-related components
│   └── [feature]/                # Feature-specific components
├── hooks/                        # Custom React hooks
│   ├── auth/                     # Authentication hooks
│   └── [feature]/                # Feature-specific hooks
├── store/                        # Zustand stores
│   ├── authStore.ts
│   ├── notificationStore.ts
│   └── [feature]Store.ts
├── services/                     # API service functions
│   ├── authService.ts
│   ├── profileService.ts
│   └── [feature]Service.ts
├── types/                        # TypeScript type definitions
│   ├── auth.ts
│   ├── profile.ts
│   └── [feature].ts
├── utils/                        # Utility functions
│   ├── logger.ts
│   └── helpers.ts
├── config/                       # Configuration files
│   ├── brandConfig.ts
│   └── constants.ts
├── lib/                          # Third-party library configurations
│   ├── firebase.ts
│   └── EmotionRegistry.tsx
├── providers/                    # React context providers
│   └── QueryProvider.tsx
└── theme/                        # Theme configuration
    ├── theme.ts
    ├── palette.ts
    ├── typography.ts
    └── README.md
```

### Naming Conventions

**Components:**
- Use PascalCase: `UserProfile.tsx`, `LoginForm.tsx`
- Default export for page components
- Named exports for utility components

**Hooks:**
- Prefix with `use`: `useAuth.ts`, `useProfileQuery.ts`
- Named exports only

**Stores:**
- Suffix with `Store`: `authStore.ts`, `userStore.ts`
- Named export for store hook

**Services:**
- Suffix with `Service`: `authService.ts`, `apiService.ts`
- Named exports for functions

**Types:**
- Use descriptive names: `UserProfile`, `LoginCredentials`
- Export interfaces and types from dedicated type files

---

## Component Migration Steps

### Step 1: Analyze the Legacy Component

Before porting, identify:

1. **Component Type:**
   - Is it a page component or reusable component?
   - Does it need client-side interactivity?
   - Can it be a Server Component?

2. **Dependencies:**
   - What props does it receive?
   - What state does it manage?
   - What external data does it fetch?
   - Does it use context or global state?

3. **Side Effects:**
   - What useEffect hooks are present?
   - What API calls are made?
   - What subscriptions or listeners exist?

### Step 2: Create the Component File

**For reusable components:**
```typescript
// src/components/[category]/ComponentName.tsx
```

**For page components:**
```typescript
// src/app/[route]/page.tsx
```

### Step 3: Add Client/Server Directive

**Client Components** (use when component needs):
- `useState`, `useEffect`, `useContext`
- Event handlers (`onClick`, `onChange`, etc.)
- Browser APIs (`window`, `localStorage`, etc.)
- React Query hooks
- Zustand stores

```typescript
'use client';

import { useState } from 'react';
// ... rest of imports
```

**Server Components** (default, no directive needed):
- Static content
- Data fetching at build time
- No client-side interactivity

```typescript
// No 'use client' directive
import { Metadata } from 'next';
// ... rest of imports
```

### Step 4: Set Up Imports

**Required imports for most components:**

```typescript
'use client'; // if needed

import { Box, Typography, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getCurrentBrand } from '@/config/brandConfig';
import { useThemeMode } from '@/theme';
import type { ComponentProps } from '@/types/[feature]';
```

**For components with auth:**
```typescript
import { useAuth } from '@/hooks/auth/useAuth';
import { useSubscription } from '@/hooks/auth/useSubscription';
```

**For components with data fetching:**
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
```

**For components with state:**
```typescript
import { useAuthStore } from '@/store/authStore';
```

### Step 5: Port Component Logic

1. **Convert class components to functional components**
2. **Replace lifecycle methods with hooks**
3. **Update state management** (see State Management Migration)
4. **Update data fetching** (see Data Fetching Migration)
5. **Apply theme and branding** (see Theme Integration)

### Step 6: Add TypeScript Types

Ensure 100% type safety:

```typescript
// Define props interface
interface UserCardProps {
  userId: string;
  name: string;
  email: string;
  onEdit?: (userId: string) => void;
  className?: string;
}

// Use props interface
export default function UserCard({
  userId,
  name,
  email,
  onEdit,
  className
}: UserCardProps) {
  // Component implementation
}
```

---

## Type Safety Requirements

### 100% Type Safety Mandate

**NEVER use `any` type**. Instead:

```typescript
// ❌ BAD - Using any
const handleData = (data: any) => {
  console.log(data.name);
};

// ✅ GOOD - Proper typing
interface UserData {
  name: string;
  email: string;
  age?: number;
}

const handleData = (data: UserData) => {
  console.log(data.name);
};

// ✅ GOOD - Using unknown for truly unknown data
const handleData = (data: unknown) => {
  if (isUserData(data)) {
    console.log(data.name);
  }
};

// Type guard
function isUserData(data: unknown): data is UserData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'name' in data &&
    typeof data.name === 'string'
  );
}
```

### Common Type Patterns

**Props with children:**
```typescript
interface CardProps {
  title: string;
  children: React.ReactNode;
}
```

**Event handlers:**
```typescript
interface FormProps {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}
```

**Refs:**
```typescript
import { useRef } from 'react';

const inputRef = useRef<HTMLInputElement>(null);
```

**Generic components:**
```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <>{items.map(renderItem)}</>;
}
```

---

## Lint Error Resolution

### ESLint Rules to Follow

This project enforces strict ESLint rules. Common issues:

#### 1. `no-explicit-any`

**Problem:**
```typescript
// ❌ ESLint Error
function processData(data: any) {
  return data.value;
}
```

**Solutions:**
```typescript
// ✅ Option 1: Define proper type
interface DataType {
  value: string;
}

function processData(data: DataType) {
  return data.value;
}

// ✅ Option 2: Use unknown with type guard
function processData(data: unknown) {
  if (isValidData(data)) {
    return data.value;
  }
  throw new Error('Invalid data');
}

// ✅ Option 3: Use generic
function processData<T extends { value: string }>(data: T) {
  return data.value;
}
```

#### 2. `no-unescaped-entities`

**Problem:**
```typescript
// ❌ ESLint Error - Unescaped quotes and apostrophes
<Typography>
  Don't use unescaped apostrophes or "quotes" in JSX
</Typography>
```

**Solutions:**
```typescript
// ✅ Option 1: Use HTML entities
<Typography>
  Don&apos;t use unescaped apostrophes or &quot;quotes&quot; in JSX
</Typography>

// ✅ Option 2: Use template literals
<Typography>
  {`Don't use unescaped apostrophes or "quotes" in JSX`}
</Typography>

// ✅ Option 3: Use single vs double quotes strategically
<Typography>
  {"Don't use unescaped apostrophes"}
</Typography>

// ✅ Option 4: For longer text, extract to variable
const message = "Don't use unescaped apostrophes or \"quotes\" in JSX";
<Typography>{message}</Typography>
```

#### 3. Other Common Lint Issues

**Unused variables:**
```typescript
// ❌ Bad
const [value, setValue] = useState(0);
// setValue never used

// ✅ Good - prefix with underscore if intentionally unused
const [value, _setValue] = useState(0);
// Or just don't destructure it
const [value] = useState(0);
```

**Missing dependencies in useEffect:**
```typescript
// ❌ Bad
useEffect(() => {
  fetchData(userId);
}, []); // Missing userId dependency

// ✅ Good
useEffect(() => {
  fetchData(userId);
}, [userId]);

// ✅ Good - if you truly want to run once, use a ref
const hasFetched = useRef(false);
useEffect(() => {
  if (!hasFetched.current) {
    fetchData(userId);
    hasFetched.current = true;
  }
}, [userId]);
```

---

## State Management Migration

### When to Use Zustand vs React State

**Use React State (`useState`) when:**
- State is local to component
- State doesn't need to be shared
- Simple form inputs
- UI toggle states

**Use Zustand when:**
- State needs to be shared across components
- State persists across page navigation
- Complex state logic
- Global application state (auth, notifications, etc.)

### Creating a Zustand Store

**1. Define the store interface:**
```typescript
// src/store/featureStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FeatureState {
  // State
  items: Item[];
  selectedId: string | null;
  loading: boolean;
  
  // Actions
  setItems: (items: Item[]) => void;
  selectItem: (id: string) => void;
  clearSelection: () => void;
  reset: () => void;
}
```

**2. Create the store:**
```typescript
export const useFeatureStore = create<FeatureState>()(
  persist(
    (set) => ({
      // Initial state
      items: [],
      selectedId: null,
      loading: false,
      
      // Actions
      setItems: (items) => set({ items }),
      selectItem: (id) => set({ selectedId: id }),
      clearSelection: () => set({ selectedId: null }),
      reset: () => set({
        items: [],
        selectedId: null,
        loading: false
      }),
    }),
    {
      name: 'feature-storage', // localStorage key
      partialize: (state) => ({
        // Only persist items, not loading state
        items: state.items,
        selectedId: state.selectedId,
      }),
    }
  )
);
```

**3. Use the store in components:**
```typescript
'use client';

import { useFeatureStore } from '@/store/featureStore';

export default function FeatureComponent() {
  // Get only what you need to minimize re-renders
  const items = useFeatureStore((state) => state.items);
  const selectItem = useFeatureStore((state) => state.selectItem);
  
  // Or get multiple values
  const { selectedId, clearSelection } = useFeatureStore();
  
  return (
    <Box>
      {items.map((item) => (
        <Button key={item.id} onClick={() => selectItem(item.id)}>
          {item.name}
        </Button>
      ))}
    </Box>
  );
}
```

### Replacing Custom State Management

**Legacy pattern:**
```typescript
// ❌ OLD - Custom context/reducer pattern
const StateContext = createContext();
const DispatchContext = createContext();

function StateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}
```

**New pattern:**
```typescript
// ✅ NEW - Zustand store
import { create } from 'zustand';

export const useAppStore = create<AppState>((set) => ({
  // state
  count: 0,
  user: null,
  
  // actions
  increment: () => set((state) => ({ count: state.count + 1 })),
  setUser: (user) => set({ user }),
}));

// Usage - no provider needed!
function Component() {
  const { count, increment } = useAppStore();
  return <button onClick={increment}>{count}</button>;
}
```

---

## Data Fetching Migration

### React Query Setup

This project uses TanStack Query (React Query) v5 for all data fetching.

**Query Provider is already set up** in `src/providers/QueryProvider.tsx`.

### Creating Custom Hooks for Queries

**Pattern for GET requests:**

```typescript
// src/hooks/useFeatureQuery.ts
import { useQuery } from '@tanstack/react-query';
import { fetchFeatureData } from '@/services/featureService';

export const FEATURE_QUERY_KEY = ['feature', 'data'];

export function useFeatureQuery(id: string) {
  return useQuery({
    queryKey: [...FEATURE_QUERY_KEY, id],
    queryFn: () => fetchFeatureData(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    enabled: !!id, // Only fetch if id exists
    retry: 2,
  });
}
```

**Pattern for POST/PUT/DELETE requests:**

```typescript
// src/hooks/useFeatureMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateFeature } from '@/services/featureService';
import { FEATURE_QUERY_KEY } from './useFeatureQuery';

export function useUpdateFeatureMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateData) => updateFeature(data),
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: FEATURE_QUERY_KEY });

      // Snapshot previous value
      const previous = queryClient.getQueryData(FEATURE_QUERY_KEY);

      // Optimistically update
      queryClient.setQueryData(FEATURE_QUERY_KEY, (old: any) => ({
        ...old,
        ...newData,
      }));

      return { previous };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(FEATURE_QUERY_KEY, context.previous);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: FEATURE_QUERY_KEY });
    },
  });
}
```

### Using Queries in Components

```typescript
'use client';

import { useFeatureQuery } from '@/hooks/useFeatureQuery';
import { useUpdateFeatureMutation } from '@/hooks/useFeatureMutation';

export default function FeatureComponent({ id }: { id: string }) {
  // Fetch data
  const { data, isLoading, error } = useFeatureQuery(id);
  
  // Mutation
  const updateMutation = useUpdateFeatureMutation();

  const handleUpdate = async () => {
    try {
      await updateMutation.mutateAsync({ id, name: 'New Name' });
      // Success!
    } catch (error) {
      // Handle error
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return null;

  return (
    <Box>
      <Typography>{data.name}</Typography>
      <Button 
        onClick={handleUpdate} 
        disabled={updateMutation.isPending}
      >
        Update
      </Button>
    </Box>
  );
}
```

### Replacing Legacy Data Fetching

**OLD - Manual fetch with useState:**
```typescript
// ❌ Don't do this anymore
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true);
  fetch('/api/data')
    .then(res => res.json())
    .then(data => {
      setData(data);
      setLoading(false);
    })
    .catch(err => {
      setError(err);
      setLoading(false);
    });
}, []);
```

**NEW - React Query:**
```typescript
// ✅ Do this instead
const { data, isLoading, error } = useQuery({
  queryKey: ['data'],
  queryFn: () => fetch('/api/data').then(res => res.json()),
});
```

---

## SSR Optimization

### When to Use SSR vs CSR

**Use Server Side Rendering (SSR) for:**
- Static content pages
- SEO-critical pages
- Content that doesn't change often
- Pages without user interaction

**Use Client Side Rendering (CSR) for:**
- Interactive components
- Components using browser APIs
- Real-time updates
- User-specific content

### Server Components (Default)

```typescript
// src/app/blog/page.tsx
// No 'use client' directive - this is a Server Component

import { Typography, Container } from '@mui/material';

export default async function BlogPage() {
  // Can fetch data directly in Server Component
  const posts = await fetchPosts();

  return (
    <Container>
      <Typography variant="h1">Blog Posts</Typography>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </Container>
  );
}
```

### Client Components

```typescript
// src/components/InteractiveWidget.tsx
'use client'; // Required for interactivity

import { useState } from 'react';
import { Button, Box } from '@mui/material';

export default function InteractiveWidget() {
  const [count, setCount] = useState(0);

  return (
    <Box>
      <Button onClick={() => setCount(count + 1)}>
        Count: {count}
      </Button>
    </Box>
  );
}
```

### Hybrid Approach

```typescript
// src/app/dashboard/page.tsx
// Server Component

import { InteractiveWidget } from '@/components/InteractiveWidget';

export default async function DashboardPage() {
  // Server-side data fetching
  const initialData = await fetchDashboardData();

  return (
    <div>
      <h1>Dashboard</h1>
      {/* Static content rendered on server */}
      <section>
        <h2>Statistics</h2>
        <p>Total Users: {initialData.userCount}</p>
      </section>
      
      {/* Client component for interactivity */}
      <InteractiveWidget />
    </div>
  );
}
```

### Best Practices

1. **Keep Client Components Small**: Move 'use client' as deep as possible in the tree
2. **Pass Serializable Props**: Server → Client props must be JSON-serializable
3. **Use Server Actions**: For form submissions and mutations from Server Components
4. **Leverage Streaming**: Use `loading.tsx` and `<Suspense>` for better UX

---

## MUI 7 Grid Migration

### Important Changes in MUI 7

MUI v7 deprecated the old Grid component. You MUST use the new Grid API.

### OLD Grid API (Deprecated)

```typescript
// ❌ DEPRECATED - Will show warnings
import { Grid } from '@mui/material';

<Grid container spacing={2}>
  <Grid item xs={12} sm={6} md={4}>
    Content
  </Grid>
  <Grid item xs={12} sm={6} md={4}>
    Content
  </Grid>
</Grid>
```

### NEW Grid API (MUI 7)

```typescript
// ✅ CORRECT - Use this approach
import Grid from '@mui/material/Unstable_Grid2'; // Note: Grid2

<Grid container gap={2}> {/* gap instead of spacing */}
  <Grid size={{ xs: 12, sm: 6, md: 4 }}> {/* size instead of item props */}
    Content
  </Grid>
  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
    Content
  </Grid>
</Grid>
```

### Key Migration Points

1. **Import from Grid2:**
```typescript
import Grid from '@mui/material/Unstable_Grid2';
```

2. **Replace `spacing` with `gap`:**
```typescript
// OLD
<Grid container spacing={2}>

// NEW
<Grid container gap={2}>
```

3. **Replace breakpoint props with `size` object:**
```typescript
// OLD
<Grid item xs={12} sm={6} md={4} lg={3}>

// NEW
<Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
```

4. **Remove `item` prop:**
```typescript
// OLD
<Grid item xs={12}>

// NEW
<Grid size={12}> {/* or size={{ xs: 12 }} */}
```

### Complete Example

```typescript
'use client';

import Grid from '@mui/material/Unstable_Grid2';
import { Card, CardContent, Typography } from '@mui/material';

export default function ProductGrid() {
  const products = [/* ... */];

  return (
    <Grid container gap={3}>
      {products.map((product) => (
        <Grid 
          key={product.id} 
          size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
        >
          <Card>
            <CardContent>
              <Typography variant="h6">{product.name}</Typography>
              <Typography>{product.price}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
```

### Alternative: Use Box with CSS Grid

For simpler layouts, consider using `Box` with CSS Grid:

```typescript
import { Box } from '@mui/material';

<Box
  sx={{
    display: 'grid',
    gridTemplateColumns: {
      xs: '1fr',
      sm: 'repeat(2, 1fr)',
      md: 'repeat(3, 1fr)',
      lg: 'repeat(4, 1fr)',
    },
    gap: 3,
  }}
>
  {items.map((item) => (
    <Box key={item.id}>
      {/* Content */}
    </Box>
  ))}
</Box>
```

---

## Theme & Branding Integration

### Reading Theme Guidelines

**MUST READ:** `src/theme/README.md` before styling any component.

### Core Principles

1. **NEVER hardcode colors** - Always use theme or CSS variables
2. **NEVER hardcode fonts** - Always use theme typography or brand fonts
3. **NEVER hardcode border radius** - Always use theme shape or brand radius
4. **ALWAYS test in all brands** - FRAM3, ACME, TechCo
5. **ALWAYS test in both modes** - Light and Dark

### Required Imports for Themed Components

```typescript
'use client';

import { useTheme } from '@mui/material/styles';
import { getCurrentBrand } from '@/config/brandConfig';
import { useThemeMode } from '@/theme';
```

### Using Theme Colors

**MUI Components:**
```typescript
import { Box, Typography, Button } from '@mui/material';

<Box sx={{ bgcolor: 'background.default' }}>
  <Typography color="text.primary">Primary Text</Typography>
  <Typography color="text.secondary">Secondary Text</Typography>
  <Button color="primary">Primary Button</Button>
</Box>
```

**Accessing theme in JavaScript:**
```typescript
const theme = useTheme();
const primaryColor = theme.palette.primary.main;
const textColor = theme.palette.text.primary;
```

**Tailwind Classes:**
```typescript
<div className="bg-brand-primary text-brand-text">
  <h1 className="text-brand-gradient font-heading">Title</h1>
</div>
```

### Using Brand Configuration

```typescript
const brand = getCurrentBrand();

<Box
  sx={{
    borderRadius: `${brand.borderRadius}px`,
    fontFamily: brand.fonts.heading,
  }}
>
  <Typography sx={{ fontFamily: brand.fonts.body }}>
    Content
  </Typography>
</Box>
```

### Responsive Design

```typescript
<Box
  sx={{
    p: { xs: 2, sm: 3, md: 4 }, // Responsive padding
    fontSize: { xs: '0.875rem', md: '1rem' }, // Responsive font size
  }}
>
  Content
</Box>
```

### Gradient Usage

```typescript
const theme = useTheme();

<Box
  sx={{
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  }}
>
  Gradient Background
</Box>

// Or use Tailwind
<div className="bg-brand-gradient">Gradient Background</div>
```

### Dark/Light Mode

```typescript
const { isDarkMode, toggleTheme } = useThemeMode();

<Button onClick={toggleTheme}>
  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
</Button>

// Conditional styling
<Box
  sx={{
    bgcolor: isDarkMode ? 'grey.900' : 'grey.100',
  }}
>
  Content adapts to theme
</Box>
```

### Complete Themed Component Example

```typescript
'use client';

import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getCurrentBrand } from '@/config/brandConfig';
import { Sparkles as SparklesIcon } from '@mui/icons-material';

interface FeatureCardProps {
  title: string;
  description: string;
  onAction: () => void;
}

export default function FeatureCard({ 
  title, 
  description, 
  onAction 
}: FeatureCardProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRadius: `${brand.borderRadius * 1.5}px`,
        border: 1,
        borderColor: 'divider',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            mb: 2,
          }}
        >
          <SparklesIcon />
        </Box>

        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontFamily: brand.fonts.heading,
            fontWeight: 600,
            color: 'text.primary',
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            lineHeight: 1.6,
          }}
        >
          {description}
        </Typography>
      </CardContent>

      <Box sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={onAction}
          sx={{
            borderRadius: `${brand.borderRadius}px`,
          }}
        >
          Learn More
        </Button>
      </Box>
    </Card>
  );
}
```

---

## useEffect Best Practices

### When to Use useEffect

Use `useEffect` for:
- Fetching data (though prefer React Query)
- Setting up subscriptions
- Synchronizing with external systems
- Cleanup operations

### Common Patterns

**1. Fetch data on mount:**
```typescript
useEffect(() => {
  fetchData();
}, []); // Empty deps - runs once
```

**2. Respond to prop/state changes:**
```typescript
useEffect(() => {
  if (userId) {
    fetchUserData(userId);
  }
}, [userId]); // Runs when userId changes
```

**3. Cleanup subscriptions:**
```typescript
useEffect(() => {
  const subscription = subscribeToUpdates();
  
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

**4. Sync with external system:**
```typescript
useEffect(() => {
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

### Dynamic Data Updates

**Pattern for keeping data fresh:**
```typescript
const [data, setData] = useState(null);

useEffect(() => {
  const fetchAndUpdate = async () => {
    const newData = await fetchData();
    setData(newData);
  };

  fetchAndUpdate();

  // Poll every 30 seconds
  const interval = setInterval(fetchAndUpdate, 30000);

  return () => clearInterval(interval);
}, []);
```

**Better approach with React Query:**
```typescript
const { data } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  refetchInterval: 30000, // Auto-refetch every 30s
  refetchOnWindowFocus: true, // Refetch when tab regains focus
});
```

### Common Pitfalls

**❌ Missing dependencies:**
```typescript
// BAD - userId not in deps
useEffect(() => {
  fetchUser(userId);
}, []);
```

**✅ Include all dependencies:**
```typescript
// GOOD
useEffect(() => {
  fetchUser(userId);
}, [userId]);
```

**❌ Infinite loop:**
```typescript
// BAD - updates state that triggers effect
useEffect(() => {
  setData(someComputation(data));
}, [data]); // Infinite loop!
```

**✅ Use ref or conditional:**
```typescript
// GOOD - use ref
const hasRun = useRef(false);
useEffect(() => {
  if (!hasRun.current) {
    setData(someComputation(data));
    hasRun.current = true;
  }
}, [data]);
```

**❌ Async function directly in useEffect:**
```typescript
// BAD - useEffect callback can't be async
useEffect(async () => {
  const data = await fetchData();
}, []);
```

**✅ Define async function inside:**
```typescript
// GOOD
useEffect(() => {
  const loadData = async () => {
    const data = await fetchData();
    setData(data);
  };
  
  loadData();
}, []);
```

---

## Testing & Validation

### Component Testing Checklist

Before marking a component as complete, verify:

#### Functionality
- [ ] Component renders without errors
- [ ] All props work as expected
- [ ] Event handlers fire correctly
- [ ] Form validation works (if applicable)
- [ ] API calls succeed (if applicable)

#### Type Safety
- [ ] No TypeScript errors
- [ ] No `any` types used
- [ ] All props properly typed
- [ ] Event handlers properly typed

#### Linting
- [ ] No ESLint errors
- [ ] No ESLint warnings
- [ ] `no-explicit-any` violations fixed
- [ ] `no-unescaped-entities` violations fixed

#### Styling & Theming
- [ ] Works in FRAM3 brand (light + dark)
- [ ] Works in ACME brand (light + dark)
- [ ] Works in TechCo brand (light + dark)
- [ ] No hardcoded colors
- [ ] No hardcoded fonts
- [ ] No hardcoded spacing
- [ ] Responsive on mobile, tablet, desktop

#### Performance
- [ ] No unnecessary re-renders
- [ ] useEffect dependencies correct
- [ ] Zustand selectors optimized
- [ ] Images optimized (use Next.js Image)

#### Accessibility
- [ ] Proper semantic HTML
- [ ] ARIA labels where needed
- [ ] Keyboard navigation works
- [ ] Color contrast meets WCAG AA

#### Code Quality
- [ ] Code is readable and maintainable
- [ ] Comments explain complex logic
- [ ] No console.logs left in (use logger)
- [ ] No commented-out code
- [ ] Follows project naming conventions

---

## Common Pitfalls

### 1. Forgetting 'use client'

**Problem:**
```typescript
// Component uses hooks but no 'use client'
import { useState } from 'react';

export default function MyComponent() {
  const [count, setCount] = useState(0); // ERROR!
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Solution:**
```typescript
'use client'; // Add this!

import { useState } from 'react';

export default function MyComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### 2. Using Old Grid API

**Problem:**
```typescript
import { Grid } from '@mui/material';

<Grid container spacing={2}>
  <Grid item xs={12} sm={6}> // Deprecated!
```

**Solution:**
```typescript
import Grid from '@mui/material/Unstable_Grid2';

<Grid container gap={2}>
  <Grid size={{ xs: 12, sm: 6 }}> // Correct!
```

### 3. Hardcoding Theme Values

**Problem:**
```typescript
<Box sx={{ 
  bgcolor: '#1a1a1a', // Hardcoded!
  color: '#ffffff',
  borderRadius: '12px'
}}>
```

**Solution:**
```typescript
const brand = getCurrentBrand();

<Box sx={{ 
  bgcolor: 'background.paper', // Theme-aware
  color: 'text.primary',
  borderRadius: `${brand.borderRadius}px`
}}>
```

### 4. Not Using React Query

**Problem:**
```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/data')
    .then(res => res.json())
    .then(setData)
    .finally(() => setLoading(false));
}, []);
```

**Solution:**
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['data'],
  queryFn: () => fetch('/api/data').then(res => res.json()),
});
```

### 5. Using `any` Type

**Problem:**
```typescript
function handleData(data: any) { // ESLint error!
  return data.value;
}
```

**Solution:**
```typescript
interface Data {
  value: string;
}

function handleData(data: Data) {
  return data.value;
}
```

### 6. Missing useEffect Dependencies

**Problem:**
```typescript
useEffect(() => {
  fetchUser(userId); // userId not in deps!
}, []);
```

**Solution:**
```typescript
useEffect(() => {
  fetchUser(userId);
}, [userId]); // Include userId
```

### 7. Not Handling Loading States

**Problem:**
```typescript
const { data } = useQuery({ /* ... */ });

return <div>{data.name}</div>; // Crashes if data is undefined!
```

**Solution:**
```typescript
const { data, isLoading, error } = useQuery({ /* ... */ });

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return null;

return <div>{data.name}</div>;
```

### 8. Incorrect File Placement

**Problem:**
```
src/
  components/
    UserProfile.tsx // Wrong location!
```

**Solution:**
```
src/
  components/
    profile/ // Organized by feature
      UserProfile.tsx
      ProfileSettings.tsx
      ProfileAvatar.tsx
```

### 9. Not Using Logger

**Problem:**
```typescript
console.log('Fetching data'); // Don't use console.log!
console.error('Error:', error);
```

**Solution:**
```typescript
import logger from '@/utils/logger';

logger.debug('Fetching data');
logger.error('Error:', error);
```

### 10. Mixing Client and Server Code

**Problem:**
```typescript
'use client';

export default async function Page() { // Can't use async with 'use client'!
  const data = await fetchData();
  return <div>{data}</div>;
}
```

**Solution:**
```typescript
// Option 1: Make it a Server Component (remove 'use client')
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// Option 2: Use React Query in Client Component
'use client';

export default function Page() {
  const { data } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
  });
  return <div>{data}</div>;
}
```

---

## Quick Reference

### Essential Commands

```bash
# Development
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build
npm run build
```

### Import Shortcuts

```typescript
// Components
import { Box, Typography, Button } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';

// Theme & Branding
import { useTheme } from '@mui/material/styles';
import { getCurrentBrand } from '@/config/brandConfig';
import { useThemeMode } from '@/theme';

// Auth
import { useAuth } from '@/hooks/auth/useAuth';
import { useSubscription } from '@/hooks/auth/useSubscription';

// State
import { useAuthStore } from '@/store/authStore';

// Data Fetching
import { useQuery, useMutation } from '@tanstack/react-query';

// Utils
import logger from '@/utils/logger';
```

### Color Quick Reference

```typescript
// MUI Theme Colors
bgcolor: 'background.default'
bgcolor: 'background.paper'
color: 'primary.main'
color: 'secondary.main'
color: 'text.primary'
color: 'text.secondary'
borderColor: 'divider'

// Tailwind Classes
className="bg-brand-primary"
className="text-brand-text"
className="bg-brand-gradient"
className="rounded-brand"
```

---

## Summary

### Port Checklist

When porting a React TS component, follow these steps:

1. [ ] Analyze legacy component dependencies
2. [ ] Create file in correct location
3. [ ] Add 'use client' if needed
4. [ ] Set up imports
5. [ ] Port component logic
6. [ ] Add TypeScript types (100% type safe)
7. [ ] Fix ESLint errors (no-explicit-any, no-unescaped-entities)
8. [ ] Migrate to Zustand (if global state needed)
9. [ ] Migrate to React Query (if data fetching)
10. [ ] Update MUI Grid to v7 API
11. [ ] Integrate theme & branding
12. [ ] Optimize useEffect usage
13. [ ] Test in all 6 theme/brand combinations
14. [ ] Verify responsive design
15. [ ] Check accessibility
16. [ ] Run type-check and lint
17. [ ] Test functionality

### Remember

- **Type Safety:** No `any` types, ever
- **Linting:** Fix all ESLint errors
- **State:** Use Zustand for global state
- **Data:** Use React Query for fetching
- **SSR:** Use Server Components when possible
- **Grid:** Use MUI v7 Grid API only
- **Theme:** Follow `src/theme/README.md`
- **Effects:** Use useEffect properly with correct deps
- **Files:** Organize by feature

---

**Last Updated:** October 2025  
**Maintained by:** Development Team  
**Questions?** Review project knowledge documents first.