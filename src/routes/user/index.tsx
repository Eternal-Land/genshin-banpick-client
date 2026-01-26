import { authApi } from "@/apis/auth";
import { Button } from "@/components/ui/button";
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
      <div>Hello {profile?.ingameUuid || "User"}!</div>
      <Button onClick={() => authApi.logout()}>Logout</Button>
    </>
  );
}
