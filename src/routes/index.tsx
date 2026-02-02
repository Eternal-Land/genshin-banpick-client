import PlayerSideBackground from "@/components/player-side/background";
import PlayerSideButton from "@/components/player-side/button";
import { useAppSelector } from "@/hooks/use-app-selector";
import { selectAuthProfile } from "@/lib/redux/auth.slice";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();
  const profile = useAppSelector(selectAuthProfile);

  const handleStart = () => {
    if (profile) {
      navigate({ to: "/user/match" });
      return;
    }

    navigate({ to: "/auth/login" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <PlayerSideBackground />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="fade-in flex w-full max-w-xl flex-col items-center gap-6 text-center">
          <h1 className="text-balance text-4xl font-semibold text-white drop-shadow md:text-5xl">
            Welcome to Genshin Banpick
          </h1>
          <p className="text-pretty text-sm text-white/80 md:text-base">
            Build your team, ban strategically, and dominate the matchup.
          </p>
          <PlayerSideButton className="px-10" onClick={handleStart}>
            Start
          </PlayerSideButton>
        </div>
      </div>
    </div>
  );
}
