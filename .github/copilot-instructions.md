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

#### Edit Forms with Async Data

When populating form fields (especially Select components) with data fetched via `useQuery`, track form initialization separately from query loading state. Radix UI Select components may not properly sync if rendered before `form.reset()` runs.

```tsx
const [isFormReady, setIsFormReady] = useState(false);

const { data, isLoading } = useQuery({ ... });

useEffect(() => {
  if (!data) return;
  form.reset({ ...data });
  setIsFormReady(true);
}, [form, data]);

// Use combined loading state for skeleton/disabled states
<FormComponent isLoading={isLoading || !isFormReady} />
<Button disabled={isPending || !isFormReady}>Submit</Button>
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

### Table Filtering

Use the `FilterTableHead` component from `@/components/filter-table-head` for filterable table columns. Follow a unified filter interface pattern for consistency.

#### Filter Interface Pattern

Define a filter interface in the table component with strongly-typed filter properties:

```tsx
// src/components/{resource}/{Resource}sTable.tsx
export interface {Resource}sTableFilter {
  search?: string;
  statuses?: boolean[];       // Use typed arrays for filter values
  categories?: CategoryEnum[];
  // ... other filter fields
}

export interface {Resource}sTableProps {
  isLoading?: boolean;
  {resource}s?: {Resource}Response[];
  filter?: {Resource}sTableFilter;
  onFilterChange?: (filter: {Resource}sTableFilter) => void;
  // ... other props
}
```

#### FilterTableHead Component

Use `FilterTableHead` in your table header, converting typed values to/from strings:

```tsx
<FilterTableHead
	label={t(LocaleKeys.table_status)}
	options={[
		{ label: t(LocaleKeys.status_active), value: "true" },
		{ label: t(LocaleKeys.status_inactive), value: "false" },
	]}
	multiSelect
	value={filter?.statuses?.map(String)} // Convert to string[]
	onValueChange={(value) =>
		onFilterChange?.({
			...filter,
			statuses: value.map((v) => v === "true"), // Convert back to boolean[]
		})
	}
/>
```

For enum-based filters:

```tsx
<FilterTableHead
	label={t(LocaleKeys.table_element)}
	options={elementOptions}
	multiSelect
	value={filter?.elements?.map(String)} // Convert enum to string
	onValueChange={(value) =>
		onFilterChange?.({
			...filter,
			elements: value.map(Number) as ElementEnum[], // Convert back to enum
		})
	}
/>
```

#### Props

| Prop            | Type                                 | Description                                                                     |
| --------------- | ------------------------------------ | ------------------------------------------------------------------------------- |
| `label`         | `string`                             | Column header text                                                              |
| `options`       | `{ label: string; value: string }[]` | Filter options to display                                                       |
| `multiSelect`   | `boolean`                            | `true` for checkboxes (multi-select), `false` for radio buttons (single-select) |
| `value`         | `string[]`                           | Currently selected filter values                                                |
| `onValueChange` | `(value: string[]) => void`          | Callback when filter selection changes                                          |

#### Route Implementation

Use TanStack Router's URL search params for filter state management. This provides shareable URLs, browser history support, and automatic validation via Zod.

**1. Define the Query Schema (in `src/apis/{resource}/types.ts`):**

```tsx
import { paginationQuerySchema } from "@/lib/types";
import z from "zod";

export const {resource}QuerySchema = z.object({
  ...paginationQuerySchema.shape,
  search: z.string().optional(),
  isActive: z.array(z.boolean()).optional(),
  // Add other filter fields as needed
});

export type {Resource}Query = z.infer<typeof {resource}QuerySchema>;
```

**2. Implement the Route (in `src/routes/admin/{resource}/index.tsx`):**

```tsx
import { zodValidator } from "@tanstack/zod-adapter";
import { {resource}QuerySchema, type {Resource}Query } from "@/apis/{resource}/types";
import { {Resource}sTable } from "@/components/{resource}s";
import { useDebounce } from "@/hooks/use-debounce";

export const Route = createFileRoute("/admin/{resource}/")({
  component: RouteComponent,
  validateSearch: zodValidator({resource}QuerySchema),
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  // Separate search state for debounce effect
  const [search, setSearch] = useState("");
  // Get validated filter from URL search params
  const filter = Route.useSearch();

  const { data, isLoading } = useQuery({
    queryKey: ["{resource}s", filter],
    queryFn: () => {resource}sApi.list(filter),
  });

  // Update URL search params (replaces current history entry)
  const handleFilterChange = (newFilter: {Resource}Query) => {
    navigate({
      replace: true,
      search: newFilter,
    });
  };

  // Debounce search input to avoid excessive API calls
  const triggerSearchDebounce = useDebounce((value: string) => {
    handleFilterChange({
      ...filter,
      search: value,
      page: 1, // Reset to page 1 on search
    });
  }, 500);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    triggerSearchDebounce(value);
  };

  const handlePageChange = (newPage: number) => {
    handleFilterChange({
      ...filter,
      page: newPage,
    });
  };

  return (
    <{Resource}sTable
      isLoading={isLoading}
      {resource}s={data?.data}
      filter={filter}
      onFilterChange={handleFilterChange}
    />
  );
}
```

**Key Points:**

- Use `validateSearch: zodValidator(schema)` in route definition for automatic URL param validation
- Use `Route.useSearch()` to get typed filter state from URL
- Use `navigate({ replace: true, search: newFilter })` to update filters without adding history entries
- Use `useDebounce` hook for search input to prevent excessive API calls
- Query key includes filter object for automatic refetch on filter changes

#### Client-Side Filtering

For client-side filtering (when API doesn't support filtering), apply filters using `useMemo`:

```tsx
const filteredData = useMemo(() => {
	if (!data) return [];
	return data.filter((item) => {
		if (filter.statuses?.length && !filter.statuses.includes(item.isActive)) {
			return false;
		}
		if (filter.elements?.length && !filter.elements.includes(item.element)) {
			return false;
		}
		// Add more filter conditions...
		return true;
	});
}, [data, filter]);
```

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

### New Admin CRUD Resource

When creating a new admin CRUD resource (e.g., weapons, characters), follow this exact pattern:

#### 1. Component Structure

Create reusable components in `src/components/{resource}/`:

```
src/components/{resource}/
├── index.ts                      # Barrel exports
├── {Resource}Form.tsx            # Form component (receives form prop)
├── {Resource}sTable.tsx          # Table listing items
└── {Resource}ToggleDialog.tsx    # Activate/deactivate confirmation dialog
```

#### 2. Form Component Pattern

Form components are **presentational only** - they receive form state from the route:

```tsx
// src/components/{resource}/{Resource}Form.tsx
import { Controller, type UseFormReturn } from "react-hook-form";

export interface {Resource}FormValues {
  // Define form field types
}

export interface {Resource}FormProps {
  formId: string;                               // Links form to external submit button
  form: UseFormReturn<{Resource}FormValues>;    // Form state from route
  isLoading?: boolean;                          // Show skeletons when loading
  onSubmit: (values: {Resource}FormValues) => void;
}

export default function {Resource}Form({
  formId,
  form,
  isLoading,
  onSubmit,
}: {Resource}FormProps) {
  // NO useForm here - form is passed as prop
  // NO submit buttons - route provides them via formId
  return (
    <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields with Controller */}
      {/* Use isLoading to show Skeleton components */}
    </form>
  );
}
```

#### 3. Table Component Pattern

```tsx
// src/components/{resource}/{Resource}sTable.tsx
export interface {Resource}sTableProps {
  isLoading?: boolean;
  {resource}s?: {Resource}Response[];
  onActivateDeactivate?: (item: {Resource}Response) => void;
}

export default function {Resource}sTable({
  isLoading,
  {resource}s,
  onActivateDeactivate,
}: {Resource}sTableProps) {
  // Show skeleton rows when isLoading
  // Map items to table rows with edit link and toggle button
}
```

#### 4. Toggle Dialog Component Pattern

```tsx
// src/components/{resource}/{Resource}ToggleDialog.tsx
export interface {Resource}ToggleDialogProps {
  {resource}: {Resource}Response | null;  // null = dialog closed
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
```

#### 5. Route Files

**List Route (`index.tsx`):**

```tsx
// src/routes/admin/{resource}/index.tsx
function RouteComponent() {
  const [confirmTarget, setConfirmTarget] = useState<{Resource}Response | null>(null);

  const { data, isLoading, refetch } = useQuery({...});
  const toggleMutation = useMutation({...});

  return (
    <>
      <{Resource}sTable
        isLoading={isLoading}
        {resource}s={data}
        onActivateDeactivate={setConfirmTarget}
      />
      <{Resource}ToggleDialog
        {resource}={confirmTarget}
        isPending={toggleMutation.isPending}
        onConfirm={() => toggleMutation.mutate(confirmTarget.id)}
        onCancel={() => setConfirmTarget(null)}
      />
    </>
  );
}
```

**Create Route (`create.tsx`):**

```tsx
// src/routes/admin/{resource}/create.tsx
function RouteComponent() {
  // Route OWNS the form state
  const form = useForm<FormInput>({
    resolver: zodResolver(createSchema),
    defaultValues: {...},
  });

  const createMutation = useMutation({...});

  const handleSubmit = (values: FormValues) => {
    createMutation.mutate({...values});
  };

  return (
    <Card>
      <CardContent>
        <{Resource}Form
          formId="{resource}-create-form"
          form={form}
          onSubmit={handleSubmit}
        />
      </CardContent>
      <CardFooter>
        <Button type="submit" form="{resource}-create-form">
          Submit
        </Button>
      </CardFooter>
    </Card>
  );
}
```

**Edit Route (`${resource}Id.tsx`):**

```tsx
// src/routes/admin/{resource}/${resource}Id.tsx
function RouteComponent() {
  const { {resource}Id } = Route.useParams();
  const [isFormReady, setIsFormReady] = useState(false);  // CRITICAL for Select fields

  // Route OWNS the form state
  const form = useForm<FormInput>({
    resolver: zodResolver(updateSchema),
    defaultValues: {...},
  });

  const { data, isLoading } = useQuery({...});

  // Reset form when data loads - set isFormReady AFTER reset
  useEffect(() => {
    if (!data) return;
    form.reset({...data});
    setIsFormReady(true);
  }, [form, data]);

  const updateMutation = useMutation({...});

  return (
    <Card>
      <CardContent>
        <{Resource}Form
          formId="{resource}-update-form"
          form={form}
          isLoading={isLoading || !isFormReady}  // Combined loading state
          onSubmit={handleSubmit}
        />
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          form="{resource}-update-form"
          disabled={isPending || !isFormReady}
        >
          Submit
        </Button>
      </CardFooter>
    </Card>
  );
}
```

#### 6. Key Principles

- **Routes own form state**: Use `useForm` in route, pass to component as prop
- **Form components are stateless**: Receive `form: UseFormReturn` prop, no internal `useForm`
- **Submit buttons in routes**: Use `formId` prop to link external button to form
- **`isFormReady` pattern**: Required for edit forms with Select fields (Radix UI sync issue)
- **Use `createSchema` type for form**: Even in edit routes, use the create schema for `UseFormReturn` type to avoid type incompatibility with optional fields
- **Barrel exports**: Export all components and types from `index.ts`
- **Locale keys**: All user-facing strings must use `LocaleKeys` constants

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
