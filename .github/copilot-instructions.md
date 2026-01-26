# Genshin Banpick Client Copilot Instructions

You are working in a Vite + React + TypeScript client app for “genshin-banpick-client”. Follow these project rules:

## Project stack

- Vite + React 19 + TypeScript.
- Data fetching uses TanStack Query via src/components/providers.tsx and axios via src/lib/http.ts.
- Routing uses TanStack Router with file-based routes under src/routes.
- State management uses Redux Toolkit (see src/lib/redux).
- Styling uses Tailwind CSS v4 (see src/index.css) and tw-animate-css.
- UI utilities use src/lib/utils.ts with `cn()` for class merging.
- Shadcn UI config is in components.json (aliases: @/components, @/lib, @/hooks).

## Routing conventions

- Add new pages as files in src/routes. Use createFileRoute in each route file.
- Root layout is src/routes/\_\_root.tsx with an <Outlet />.
- Do not edit src/routeTree.gen.ts manually; it is generated.

## Imports and paths

- Use the @ alias for src (configured in tsconfig + Vite).
- Prefer named exports for components and utilities.
- Use typed Redux hooks from src/hooks/use-app-selector.ts and src/hooks/use-app-dispatch.ts instead of raw react-redux hooks.

## Styling

- Use Tailwind classes; rely on CSS variables defined in src/index.css for theme tokens.
- Use `cn()` from src/lib/utils.ts when composing className strings.

## Forms

- Use React Hook Form for form state and validation.
- Prefer `Controller` with `Field`, `FieldLabel`, `FieldDescription`, and `FieldError` from src/components/ui/field.tsx for consistent form UI.
- Use Zod schemas in src/apis/\*\*/types.ts with `zodResolver` for validation.
- For layouts, you can assign an id to a form (e.g., `register-form`) and place the submit button outside the form using `form="register-form"`.
- Use TanStack Query `useMutation` for form submit handlers that call APIs.
- For mutation errors, read `AxiosError<BaseApiResponse>` and surface `error.response?.data.message` in the UI (e.g., in a CardDescription with `text-destructive`).

## Project hygiene

- Keep changes minimal and consistent with existing style (quotes, semicolons).
- Avoid adding new dependencies unless required.
- Prefer React function components and hooks.

## If you add new files

- Place reusable UI in src/components.
- Place hooks in src/hooks.
- Keep route components inside src/routes.

## Data fetching

- App-level providers are configured in src/components/providers.tsx (TanStack Query).
- Use the axios instance from src/lib/http.ts for API calls.
- Prefer TanStack Query hooks for server state and use the shared axios client for requests.
- API responses are wrapped in the `BaseApiResponse<T>` type from src/lib/types/base-api-response.ts.

## API and auth conventions

- API base URL is read from VITE_API_BASE_URL with a fallback to http://localhost:8080.
- The shared axios client in src/lib/http.ts already attaches the token from localStorage key "token" and redirects to /auth/login on 401.
- Do not reimplement auth interceptors; use the shared client.
