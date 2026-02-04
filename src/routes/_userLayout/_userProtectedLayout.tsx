import HeaderNavigation from "@/components/header-navigation";
import { useAppSelector } from "@/hooks/use-app-selector";
import { store } from "@/lib/redux";
import { selectAuthProfile } from "@/lib/redux/auth.slice";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_userLayout/_userProtectedLayout")({
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
  const profile = useAppSelector(selectAuthProfile);

  return (
    <>
      <HeaderNavigation profile={profile!} />
      <Outlet />
    </>
  );
}
