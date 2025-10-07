# FRAM3 Studio - Next.js Application

Modern Next.js 15 application with full theming and branding support.

## Features

- ⚡ Next.js 15 with App Router
- 🎨 Tailwind CSS + Material-UI
- 🔥 Firebase Authentication
- 🎭 Multi-brand/Multi-tenant Support
- 📱 Fully Responsive
- 🌗 Light/Dark Mode
- 🔒 Type-safe with TypeScript
- 🎯 React Query for Data Fetching
- 🧩 Zustand for State Management

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                 # Next.js App Router
├── components/          # React Components
│   ├── common/         # Shared components
│   ├── layout/         # Layout components
│   └── branding/       # Brand-specific components
├── config/             # Configuration files
│   └── brandConfig.ts  # Brand configurations
├── lib/                # Library configurations
│   └── firebase.ts     # Firebase setup
├── hooks/              # Custom React hooks
├── store/              # Zustand stores
├── utils/              # Utility functions
├── types/              # TypeScript types
└── styles/             # Global styles
```

## Brand Configuration

Change the brand by setting the environment variable:

```bash
NEXT_PUBLIC_BRAND_KEY=fram3  # or acme, or any custom brand
```

See `src/config/brandConfig.ts` for brand definitions.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

## Environment Variables

See `.env.example` for all required environment variables.

## Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Material-UI](https://mui.com/)
- [Firebase](https://firebase.google.com/docs)

## License

ISC
