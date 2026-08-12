import type { MatchResponse } from "@/apis/match/types";
import { cn } from "@/lib/utils";
import type { DraftSide } from "./types";

interface SideHeaderProps {
  side: DraftSide;
  player?: MatchResponse["bluePlayer"];
  picksCount: number;
  picksPerSide: number;
}

export default function SideHeader({
  side,
  player,
  picksCount,
  picksPerSide,
}: SideHeaderProps) {
  const isBlue = side === "blue";

  return (
    <div className={cn("flex justify-between rounded-xl border border-white/20 bg-white/5 p-4", isBlue ? "flex-row" : "flex-row-reverse")}>
      <div
        className={cn(
          "flex items-center gap-3",
          !isBlue && "flex-row-reverse text-right",
        )}
      >
        <img
          src={player?.avatar}
          alt={player?.displayName ?? "Player"}
          className="h-12 w-12 rounded-full border border-white/30 object-cover"
        />
        <div className={cn("flex flex-col", !isBlue && "items-end")}>
          <span
            className={cn(
              "text-lg font-semibold",
              isBlue ? "text-sky-400" : "text-red-500",
            )}
          >
            {player?.displayName ?? "-"}
          </span>
          <span className="text-xs text-white/70">
            UID: {player?.ingameUuid ?? "-"}
          </span>
        </div>
      </div>
      <div className="mt-3 rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white/80">
        Picked: {picksCount}/{picksPerSide}
      </div>
    </div>
  );
}
