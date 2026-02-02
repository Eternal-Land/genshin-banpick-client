import HeaderNavigation from "@/components/header-navigation";
import { useAppSelector } from "@/hooks/use-app-selector";
import { selectAuthProfile } from "@/lib/redux/auth.slice";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/user/")({
  component: RouteComponent,
});

function RouteComponent() {
  const profile = useAppSelector(selectAuthProfile);

  return (
    <>
      <HeaderNavigation profile={profile!} />
    </>
  );
}
