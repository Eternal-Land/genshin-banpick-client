import type { BanPickCharacter } from "@/components/match/ban-pick.types";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";
import type { DraftSide } from "./types";

interface SideAssignmentBoardProps {
  side: DraftSide;
  slots: Array<BanPickCharacter | null>;
  teamPlayerCount: number;
  picksPerPlayer: number;
  canReorder: boolean;
  onDragStart: (side: DraftSide, index: number) => void;
  onDrop: (side: DraftSide, index: number) => void;
  onDragEnd: () => void;
}

export default function SideAssignmentBoard({
  side,
  slots,
  teamPlayerCount,
  picksPerPlayer,
  canReorder,
  onDragStart,
  onDrop,
  onDragEnd,
}: SideAssignmentBoardProps) {
  const isBlue = side === "blue";

  return (
    <div className="rounded-xl border border-white/20 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3
          className={cn(
            "text-sm font-semibold uppercase tracking-wider",
            isBlue ? "text-sky-400" : "text-red-500",
          )}
        >
          Leader Assignment
        </h3>
        <span className="text-xs text-white/60">3 players x 8 characters</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: teamPlayerCount }).map((_, playerIndex) => {
          const start = playerIndex * picksPerPlayer;
          const end = start + picksPerPlayer;
          const playerSlots = slots.slice(start, end);

          return (
            <div
              key={`${side}-player-${playerIndex}`}
              className="rounded-lg border border-white/15 bg-black/30 p-3"
            >
              <div className="mb-2 text-xs font-medium text-white/70">
                Player {playerIndex + 1}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {playerSlots.map((character, slotIndex) => {
                  const globalIndex = start + slotIndex;

                  return (
                    <div
                      key={`${side}-assignment-${globalIndex}`}
                      className={cn(
                        "group relative h-20 overflow-hidden rounded-md border border-white/20 bg-white/5",
                        character && canReorder && "cursor-move",
                      )}
                      draggable={Boolean(character) && canReorder}
                      onDragStart={() => {
                        if (!canReorder || !character) {
                          return;
                        }
                        onDragStart(side, globalIndex);
                      }}
                      onDragEnd={onDragEnd}
                      onDragOver={(event) => {
                        if (!canReorder) {
                          return;
                        }
                        event.preventDefault();
                      }}
                      onDrop={() => onDrop(side, globalIndex)}
                    >
                      {character ? (
                        <>
                          <img
                            src={character.imageUrl}
                            alt={character.name}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/70 px-1 py-0.5 text-[10px] text-white truncate">
                            {character.name}
                          </div>
                          <GripVertical className="absolute right-1 top-1 h-4 w-4 text-white/90 opacity-80" />
                        </>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
