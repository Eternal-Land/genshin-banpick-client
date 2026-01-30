# Genshin Ban-Pick Client - Copilot Instructions

## Project Overview

This is a React-based web application for a Genshin Impact ban-pick system. The client provides user authentication, admin management, and staff role management features.

## Tech Stack

### Core

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Routing**: TanStack Router with file-based routing
- **State Management**: Redux Toolkit + TanStack Query (React Query)
- **Styling**: Tailwind CSS v4 with shadcn/ui components

### Key Libraries

- **Form Handling**: React Hook Form + Zod validation + @hookform/resolvers
- **UI Components**: Radix UI primitives (shadcn/ui)
- **HTTP Client**: Axios
- **Utilities**:
  - `clsx` + `tailwind-merge` (via `cn()` utility)
  - `class-variance-authority` for component variants
  - `dayjs` for date/time
  - `lucide-react` for icons
  - `sonner` for toast notifications

## Project Structure

```
src/
├── apis/              # API client functions and types
│   └── {resource}/
│       ├── index.ts   # API functions
│       └── types.ts   # Schemas & types
├── components/
│   ├── providers.tsx  # Global providers
│   └── ui/           # shadcn/ui components
├── hooks/            # Custom React hooks
├── lib/
│   ├── http.ts       # Axios instance with interceptors
│   ├── utils.ts      # Utility functions (cn, etc.)
│   ├── constants/    # App constants
│   ├── redux/        # Redux store and slices
│   └── types/        # Shared TypeScript types
└── routes/           # TanStack Router file-based routes
```

## Code Conventions

### TypeScript

- Use TypeScript for all new files (`.ts`, `.tsx`)
- Define types explicitly; avoid `any` unless necessary
- Use `type` for object shapes, `interface` for extensible definitions
- Export types alongside their related functions

### Imports

- Use path alias `@/` for src imports (configured in tsconfig and vite.config)
- Import order: React → Third-party → Components → Hooks → Utils → Types

### Components

- Use functional components with TypeScript
- Name component files with PascalCase matching component name
- Use `PropsWithChildren` for components wrapping children
- Destructure props in function parameters
- **ALWAYS check `src/components/{feature}/` for existing reusable components before creating new ones in routes**
- Feature-specific components (forms, tables, dialogs) should be extracted to `src/components/{feature}/` folder
- Export components and their types via barrel file (`index.ts`) in each feature folder
- Example structure (see `src/components/staff-roles/`):
  ```
  src/components/{feature}/
  ├── index.ts                    # Barrel exports
  ├── {Feature}Form.tsx           # Reusable form component
  ├── {Feature}Table.tsx          # Table/list component
  └── {Feature}ToggleDialog.tsx   # Toggle/action dialogs
  ```
- Routes should import and compose these components rather than duplicating logic

### API Layer

#### Structure

```typescript
// src/apis/{resource}/types.ts
import { z } from 'zod';

export const {action}Schema = z.object({
  field: z.string().min(1, "Error message"),
});

export type {Action}Input = z.infer<typeof {action}Schema>;

export interface {Action}Response {
  field: string;
}

// src/apis/{resource}/index.ts
import { http } from "@/lib/http";
import type { BaseApiResponse } from "@/lib/types";
import type { {Action}Input, {Action}Response } from "./types";

async function {action}(input: {Action}Input) {
  const response = await http.post<BaseApiResponse<{Action}Response>>(
    "/api/{resource}/{action}",
    input
  );
  return response.data;
}

export const {resource}Api = {
  {action},
} as const;
```

#### Patterns

- All API calls go through `src/lib/http.ts` (Axios instance)
- Use TanStack Query (`useMutation`, `useQuery`) for data fetching
- Define Zod schemas for form validation
- API responses follow `BaseApiResponse<T>` structure
- Token stored in localStorage as `"token"`
- 401 responses auto-redirect to `/auth/login`
- File uploads use [src/apis/files/index.ts](src/apis/files/index.ts) to request an upload signature and post to Cloudinary. Use the `onUploadProgress` callback for progress and set the form field to the returned `secure_url`.

### Forms

- Use React Hook Form with Zod resolver
- When defining Zod validation messages, always use `LocaleKeys` (not raw strings) so errors are translated by `FieldError`.
- Use `Controller` for custom components
- When a schema field uses `z.url()`, implement file upload via `filesApi.uploadFile` and set the field value to the uploaded URL. Follow the flow in [src/routes/auth/register.tsx](src/routes/auth/register.tsx), including progress tracking with `AxiosProgressEvent` and `Progress`.
- Use shadcn/ui Field components for layout:
  ```tsx
  <Controller
    name="fieldName"
    control={form.control}
    render={({ field, fieldState }) => (
      <Field data-invalid={fieldState.invalid}>
        <FieldLabel htmlFor={field.name}>Label</FieldLabel>
        <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
        <FieldError>{fieldState.error?.message}</FieldError>
      </Field>
    )}
  />
  ```

### Routing (TanStack Router)

#### File-Based Routes

- Routes in `src/routes/` map to URL paths
- `__root.tsx` is the root layout
- `index.tsx` is the default route
- `$param.tsx` for dynamic params
- Nested folders create nested routes

#### Route Guards

```typescript
export const Route = createFileRoute("/admin")({
  component: RouteComponent,
  beforeLoad: async () => {
    const { profile } = store.getState().auth;
    if (!profile) {
      throw redirect({ to: "/auth/login" });
    }
    if (profile.role === AccountRole.USER) {
      throw redirect({ to: "/user" });
    }
  },
});
```

#### Navigation

- Use `<Link to="/path" />` for navigation
- Use `useNavigate()` hook for programmatic navigation
- Use `useRouterState()` to access current route state

### State Management

#### Redux (Global State)

- Store in `src/lib/redux/index.ts`
- Slices in `src/lib/redux/{feature}.slice.ts`
- Use `useAppSelector` and `useAppDispatch` hooks (typed)
- Current slices:
  - `auth` - User profile and authentication state

#### TanStack Query (Server State)

- For all API data fetching
- Use `useMutation` for mutations (POST, PUT, DELETE)
- Use `useQuery` for queries (GET)
- Configure in `Providers` component

### Styling

#### Tailwind CSS

- Use Tailwind v4 classes
- Use `cn()` utility to merge classes: `cn("base-classes", conditionalClass && "conditional", className)`
- shadcn/ui components use CSS variables for theming

#### Component Variants

- Use `class-variance-authority` (cva) for component variants
- Example pattern:
  ```typescript
  const variants = cva("base-classes", {
    variants: {
      variant: {
        default: "variant-classes",
        destructive: "destructive-classes",
      },
      size: {
        default: "size-classes",
        sm: "small-classes",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  });
  ```

### Internationalization (i18n)

- Setup is in [src/i18n/index.ts](src/i18n/index.ts) and initialized by importing it in [src/main.tsx](src/main.tsx).
- Libraries: `i18next`, `react-i18next`, `i18next-browser-languagedetector`.
- Supported languages: `en`, `vi` with `common` namespace. Resource files live in:
  - [src/i18n/locales/en/common.ts](src/i18n/locales/en/common.ts)
  - [src/i18n/locales/vi/common.ts](src/i18n/locales/vi/common.ts)
- Language detection order: `localStorage` then `navigator`; cached in localStorage by the detector (key: `i18nextLng`).
- Use `useTranslation()` and `t(LocaleKeys.some_key)` for strings. Change language via `i18n.changeLanguage("vi")`.
- `LocaleKeys` lives in [src/lib/constants/locale-keys.ts](src/lib/constants/locale-keys.ts) and is the single source of truth for all translation keys.
- `LocaleObject` typing is defined in [src/i18n/types.ts](src/i18n/types.ts) and is enforced by `common.ts` locale files.
- ALWAYS update the `common.ts` locale files in both languages when creating, editing, or deleting user-facing features/pages.

### Authentication Flow

1. User logs in via `/auth/login`
2. Token stored in localStorage
3. Token attached to all requests via http interceptor
4. Profile fetched in `__root.tsx` beforeLoad
5. Profile stored in Redux auth slice
6. Routes check profile/role in beforeLoad guards
7. 401 responses clear token and redirect to login

### Constants

- Define in `src/lib/constants/`
- Export as `const` objects with `as const` assertion
- Example: `AccountRole`, `ErrorCode`, `LocaleKeys`

## Best Practices

### Error Handling

- Use TanStack Query error handling in mutations
- Display errors via `toast.error()` from sonner
- Show inline errors in forms via Field components
- AxiosError provides typed error responses

### Performance

- Use TanStack Router's automatic code splitting
- Lazy load heavy components when appropriate
- Memoize expensive computations
- Use proper React keys in lists

### Accessibility

- Use semantic HTML elements
- Include proper ARIA attributes (`aria-invalid`, `aria-label`, etc.)
- Ensure form fields have associated labels
- Use shadcn/ui components (built with accessibility in mind)

### Testing

- (No test setup currently - add as needed)

## Commands

```bash
# Development
npm run dev          # Start dev server (host: 0.0.0.0)

# Build
npm run build        # TypeScript check + production build
npm run preview      # Preview production build

# Linting
npm run lint         # Run ESLint
```

## Environment Variables

- `VITE_API_BASE_URL` - Backend API base URL (default: http://localhost:8080)

## Code Generation Patterns

### New API Resource

1. Create `src/apis/{resource}/types.ts` with Zod schemas and interfaces
2. Create `src/apis/{resource}/index.ts` with API functions
3. Export as `{resource}Api` const object

### New Route

1. Create file in `src/routes/` following naming convention
2. Export `Route` using `createFileRoute()`
3. Add authentication/authorization in `beforeLoad` if needed
4. Create component function

### New Redux Slice

1. Create `src/lib/redux/{feature}.slice.ts`
2. Define state interface
3. Create slice with `createSlice()`
4. Export actions and selectors
5. Add reducer to store in `src/lib/redux/index.ts`

### New shadcn/ui Component

```bash
npx shadcn@latest add <component-name>
```

## Notes

- Auto-generated files (like `routeTree.gen.ts`) should not be edited manually
- The project uses shadcn/ui "new-york" style
- Token-based authentication with Bearer tokens
- Role-based access: USER (0), STAFF (1), ADMIN (2)
- API base URL can be overridden via environment variable
