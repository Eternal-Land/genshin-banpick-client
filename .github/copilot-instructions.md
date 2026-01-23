You are working in a Vite + React + TypeScript client app for “genshin-banpick-client”. Follow these project rules:

Project stack

- Vite + React 19 + TypeScript.
- Routing uses TanStack Router with file-based routes under src/routes.
- Styling uses Tailwind CSS v4 (see src/index.css) and tw-animate-css.
- UI utilities use src/lib/utils.ts with `cn()` for class merging.
- Shadcn UI config is in components.json (aliases: @/components, @/lib, @/hooks).

Routing conventions

- Add new pages as files in src/routes. Use createFileRoute in each route file.
- Root layout is src/routes/\_\_root.tsx with an <Outlet />.
- Do not edit src/routeTree.gen.ts manually; it is generated.

Imports and paths

- Use the @ alias for src (configured in tsconfig + Vite).
- Prefer named exports for components and utilities.

Styling

- Use Tailwind classes; rely on CSS variables defined in src/index.css for theme tokens.
- Use `cn()` from src/lib/utils.ts when composing className strings.

Project hygiene

- Keep changes minimal and consistent with existing style (quotes, semicolons).
- Avoid adding new dependencies unless required.
- Prefer React function components and hooks.

If you add new files

- Place reusable UI in src/components.
- Place hooks in src/hooks.
- Keep route components inside src/routes.
