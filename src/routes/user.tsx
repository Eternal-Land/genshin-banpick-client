import { store } from "@/lib/redux";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/user")({
  component: RouteComponent,
  beforeLoad: async () => {
    const { profile } = store.getState().auth;
    console.log(profile);
    if (!profile) {
      throw redirect({
        to: "/auth/login",
      });
    }
  },
});

function RouteComponent() {
  return (
    <>
      <Outlet />
    </>
  );
}
