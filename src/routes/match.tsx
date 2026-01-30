import PlayerSideBackground from "@/components/player-side/background";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/match")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <PlayerSideBackground />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="fade-in text-center text-white">
          <h1 className="text-3xl font-semibold">Match Lobby</h1>
          <p className="mt-2 text-sm text-white/75">
            Match setup is coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
