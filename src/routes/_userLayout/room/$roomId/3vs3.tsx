import { userCharactersApi } from "@/apis/user-characters";
import type { UserCharacterResponse } from "@/apis/user-characters/types";
import type { MatchResponse } from "@/apis/match/types";
import BanPickElementFilter, {
  ELEMENT_FILTER_ALL,
} from "@/components/match/ban-pick-element-filter";
import BanPickRarityFilter, {
  RARITY_FILTER_ALL,
} from "@/components/match/ban-pick-rarity-filter";
import type { BanPickCharacter } from "@/components/match/ban-pick.types";
import CharacterContainer from "@/components/player-side/character-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/hooks/use-app-selector";
import { useBanPickFilters } from "@/hooks/use-ban-pick-filters";
import { MatchStatus, type CharacterElementEnum } from "@/lib/constants";
import { CharacterElementDetail } from "@/lib/constants";
import { selectAuthProfile } from "@/lib/redux/auth.slice";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useLoaderData, useRouter } from "@tanstack/react-router";
import { GripVertical } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/_userLayout/room/$roomId/3vs3")({
  component: RouteComponent,
});

type DraftSide = "blue" | "red";

interface PendingPickState {
  side: DraftSide;
  character: BanPickCharacter;
}

interface DraggingState {
  side: DraftSide;
  index: number;
}

const PICKS_PER_SIDE = 24;
const TEAM_PLAYER_COUNT = 3;
const PICKS_PER_PLAYER = PICKS_PER_SIDE / TEAM_PLAYER_COUNT;
const TOTAL_PICKS = PICKS_PER_SIDE * 2;

const PICK_SEQUENCE: DraftSide[] = Array.from({ length: TOTAL_PICKS }, (_, index) =>
  index % 2 === 0 ? "blue" : "red",
);

const createEmptyAssignmentSlots = () =>
  Array.from({ length: PICKS_PER_SIDE }, () => null as BanPickCharacter | null);

const mapCharacterToBanPickCharacter = (
  character: UserCharacterResponse,
): BanPickCharacter => ({
  id: String(character.id),
  name: character.name,
  imageUrl: character.iconUrl,
  rarity: character.rarity === 5 ? 5 : 4,
  level: 90,
  constellation: 0,
  cost: 0,
  element: character.element,
  weaponType: character.weaponType,
});

const toFixedPickSlots = (picks: BanPickCharacter[]) =>
  Array.from({ length: PICKS_PER_SIDE }).map((_, index) => picks[index] ?? null);

const getElementKey = (element: CharacterElementEnum) =>
  CharacterElementDetail[element]?.key;

const filterCharactersForDraft = (
  characters: BanPickCharacter[],
  search: string,
  elementFilter: string,
  rarityFilter: string,
) => {
  const normalizedSearch = search.trim().toLowerCase();

  return characters.filter((character) => {
    if (
      normalizedSearch &&
      !character.name.toLowerCase().includes(normalizedSearch)
    ) {
      return false;
    }

    if (
      elementFilter !== ELEMENT_FILTER_ALL &&
      getElementKey(character.element) !== elementFilter
    ) {
      return false;
    }

    if (rarityFilter !== RARITY_FILTER_ALL) {
      return String(character.rarity) === rarityFilter;
    }

    return true;
  });
};

interface SideHeaderProps {
  side: DraftSide;
  player?: MatchResponse["bluePlayer"];
  picksCount: number;
}

function SideHeader({ side, player, picksCount }: SideHeaderProps) {
  const isBlue = side === "blue";

  return (
    <div className="rounded-xl border border-white/20 bg-white/5 p-4">
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
          <span className={cn("text-lg font-semibold", isBlue ? "text-sky-400" : "text-red-500")}>
            {player?.displayName ?? "-"}
          </span>
          <span className="text-xs text-white/70">UID: {player?.ingameUuid ?? "-"}</span>
        </div>
      </div>
      <div className="mt-3 rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white/80">
        Picked: {picksCount}/{PICKS_PER_SIDE}
      </div>
    </div>
  );
}

interface PickSlotsProps {
  side: DraftSide;
  picks: BanPickCharacter[];
  currentPickSide?: DraftSide;
  pendingPick: PendingPickState | null;
  isDraftCompleted: boolean;
}

function PickSlots({
  side,
  picks,
  currentPickSide,
  pendingPick,
  isDraftCompleted,
}: PickSlotsProps) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/5 p-4">
      <div className="mb-2 text-xs uppercase tracking-wider text-white/70">
        Team Pool
      </div>
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: PICKS_PER_SIDE }).map((_, index) => {
          const committed = picks[index];
          const preview =
            !isDraftCompleted &&
            !committed &&
            pendingPick?.side === side &&
            currentPickSide === side &&
            index === picks.length
              ? pendingPick.character
              : null;

          const character = committed ?? preview;
          const isActiveSlot =
            !isDraftCompleted &&
            currentPickSide === side &&
            index === picks.length;

          return (
            <div
              key={`${side}-pick-slot-${index}`}
              className={cn(
                "relative h-16 overflow-hidden rounded-md border",
                side === "blue"
                  ? "border-sky-400/40 bg-sky-500/10"
                  : "border-red-500/40 bg-red-500/10",
                isActiveSlot && "animate-pulse border-yellow-400",
              )}
            >
              {character ? (
                <img
                  src={character.imageUrl}
                  alt={character.name}
                  className={cn(
                    "h-full w-full object-cover",
                    preview && "opacity-70",
                  )}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface CharacterSelectorProps {
  side: DraftSide;
  characters: BanPickCharacter[];
  search: string;
  onSearchChange: (value: string) => void;
  selectedElement: string;
  onSelectElement: (value: string) => void;
  selectedRarity: string;
  onSelectRarity: (value: string) => void;
  selectedCharacterIds: Set<string>;
  pendingPick: PendingPickState | null;
  canInteract: boolean;
  onSelectCharacter: (side: DraftSide, character: BanPickCharacter) => void;
}

function CharacterSelector({
  side,
  characters,
  search,
  onSearchChange,
  selectedElement,
  onSelectElement,
  selectedRarity,
  onSelectRarity,
  selectedCharacterIds,
  pendingPick,
  canInteract,
  onSelectCharacter,
}: CharacterSelectorProps) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-xl border border-white/20 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search character"
          className="w-1/3"
        />
        <BanPickElementFilter
          selectedElement={selectedElement}
          onSelect={onSelectElement}
        />
        <BanPickRarityFilter
          selectedRarity={selectedRarity}
          onSelect={onSelectRarity}
        />
      </div>
      <div className="grid grid-cols-7 auto-rows-min gap-3 overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {characters.map((character) => {
          const isSelected = selectedCharacterIds.has(character.id);
          const isPending =
            pendingPick?.side === side && pendingPick.character.id === character.id;
          const isDisabled = isSelected || !canInteract;

          return (
            <button
              key={`${side}-${character.id}`}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectCharacter(side, character)}
              className={cn(
                "text-left",
                isDisabled
                  ? "cursor-not-allowed opacity-50 grayscale"
                  : "cursor-pointer",
                isPending &&
                  (side === "blue"
                    ? "rounded-sm ring-2 ring-sky-400"
                    : "rounded-sm ring-2 ring-red-500"),
              )}
            >
              <CharacterContainer
                constellation={character.constellation}
                element={character.element}
                imageUrl={character.imageUrl}
                level={character.level}
                name={character.name}
                rarity={character.rarity}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface SideAssignmentBoardProps {
  side: DraftSide;
  slots: Array<BanPickCharacter | null>;
  canReorder: boolean;
  onDragStart: (side: DraftSide, index: number) => void;
  onDrop: (side: DraftSide, index: number) => void;
  onDragEnd: () => void;
}

function SideAssignmentBoard({
  side,
  slots,
  canReorder,
  onDragStart,
  onDrop,
  onDragEnd,
}: SideAssignmentBoardProps) {
  const isBlue = side === "blue";

  return (
    <div className="rounded-xl border border-white/20 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className={cn("text-sm font-semibold uppercase tracking-wider", isBlue ? "text-sky-400" : "text-red-500")}>
          Leader Assignment
        </h3>
        <span className="text-xs text-white/60">3 players x 8 characters</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: TEAM_PLAYER_COUNT }).map((_, playerIndex) => {
          const start = playerIndex * PICKS_PER_PLAYER;
          const end = start + PICKS_PER_PLAYER;
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

function RouteComponent() {
  const { roomId } = Route.useParams();
  const router = useRouter();
  const profile = useAppSelector(selectAuthProfile);
  const { match } = useLoaderData({
    from: "/_userLayout/room/$roomId",
  });

  const {
    leftSearch,
    setLeftSearch,
    rightSearch,
    setRightSearch,
    leftElementFilter,
    setLeftElementFilter,
    leftRarityFilter,
    setLeftRarityFilter,
    rightElementFilter,
    setRightElementFilter,
    rightRarityFilter,
    setRightRarityFilter,
  } = useBanPickFilters();

  const [bluePicks, setBluePicks] = useState<BanPickCharacter[]>([]);
  const [redPicks, setRedPicks] = useState<BanPickCharacter[]>([]);
  const [pendingPick, setPendingPick] = useState<PendingPickState | null>(null);
  const [blueAssignments, setBlueAssignments] = useState<
    Array<BanPickCharacter | null>
  >(createEmptyAssignmentSlots);
  const [redAssignments, setRedAssignments] = useState<
    Array<BanPickCharacter | null>
  >(createEmptyAssignmentSlots);
  const [dragging, setDragging] = useState<DraggingState | null>(null);

  const blueAssignmentInitializedRef = useRef(false);
  const redAssignmentInitializedRef = useRef(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["user", "characters", "3vs3"],
    queryFn: userCharactersApi.listCharacters,
  });

  const allCharacters = useMemo(
    () => (data?.data ?? []).map(mapCharacterToBanPickCharacter),
    [data?.data],
  );

  const selectedCharacterIds = useMemo(() => {
    const selected = new Set<string>();
    [...bluePicks, ...redPicks].forEach((character) => {
      selected.add(character.id);
    });
    return selected;
  }, [bluePicks, redPicks]);

  const draftStep = bluePicks.length + redPicks.length;
  const isDraftCompleted =
    bluePicks.length >= PICKS_PER_SIDE && redPicks.length >= PICKS_PER_SIDE;
  const currentPickSide = !isDraftCompleted ? PICK_SEQUENCE[draftStep] : undefined;

  const blueFilteredCharacters = useMemo(
    () =>
      filterCharactersForDraft(
        allCharacters,
        leftSearch,
        leftElementFilter,
        leftRarityFilter,
      ),
    [allCharacters, leftElementFilter, leftRarityFilter, leftSearch],
  );

  const redFilteredCharacters = useMemo(
    () =>
      filterCharactersForDraft(
        allCharacters,
        rightSearch,
        rightElementFilter,
        rightRarityFilter,
      ),
    [allCharacters, rightElementFilter, rightRarityFilter, rightSearch],
  );

  const canBlueInteract =
    !isDraftCompleted && currentPickSide === "blue" && profile?.id === match?.bluePlayer?.id;
  const canRedInteract =
    !isDraftCompleted && currentPickSide === "red" && profile?.id === match?.redPlayer?.id;

  const canBlueReorderAssignments = profile?.id === match?.bluePlayer?.id;
  const canRedReorderAssignments = profile?.id === match?.redPlayer?.id;

  useEffect(() => {
    if (!match) {
      void router.navigate({
        to: "/match",
        search: {
          page: 1,
          take: 10,
          accountId: profile?.id,
        },
      });
      return;
    }

    switch (match.status) {
      case MatchStatus.LIVE:
        return;
      case MatchStatus.COMPLETED:
        void router.navigate({
          to: "/room/$roomId/result",
          params: { roomId },
        });
        return;
      case MatchStatus.WAITING:
        void router.navigate({
          to: "/room/$roomId/waiting",
          params: { roomId },
        });
        return;
      default:
        void router.navigate({
          to: "/match",
          search: {
            page: 1,
            take: 10,
            accountId: profile?.id,
          },
        });
    }
  }, [match, profile?.id, roomId, router]);

  useEffect(() => {
    if (!isDraftCompleted) {
      blueAssignmentInitializedRef.current = false;
      redAssignmentInitializedRef.current = false;
      setBlueAssignments(createEmptyAssignmentSlots());
      setRedAssignments(createEmptyAssignmentSlots());
      return;
    }

    if (!blueAssignmentInitializedRef.current) {
      blueAssignmentInitializedRef.current = true;
      setBlueAssignments(toFixedPickSlots(bluePicks));
    }

    if (!redAssignmentInitializedRef.current) {
      redAssignmentInitializedRef.current = true;
      setRedAssignments(toFixedPickSlots(redPicks));
    }
  }, [bluePicks, isDraftCompleted, redPicks]);

  const onSelectCharacter = (side: DraftSide, character: BanPickCharacter) => {
    if (isDraftCompleted || side !== currentPickSide) {
      return;
    }

    if (selectedCharacterIds.has(character.id)) {
      return;
    }

    if (side === "blue" && !canBlueInteract) {
      return;
    }

    if (side === "red" && !canRedInteract) {
      return;
    }

    setPendingPick({ side, character });
  };

  const onConfirmPick = () => {
    if (!pendingPick || isDraftCompleted || pendingPick.side !== currentPickSide) {
      return;
    }

    if (pendingPick.side === "blue") {
      if (bluePicks.length >= PICKS_PER_SIDE) {
        return;
      }
      setBluePicks((prev) => [...prev, pendingPick.character]);
    } else {
      if (redPicks.length >= PICKS_PER_SIDE) {
        return;
      }
      setRedPicks((prev) => [...prev, pendingPick.character]);
    }

    setPendingPick(null);
  };

  const onDropAssignment = (side: DraftSide, targetIndex: number) => {
    if (!dragging || dragging.side !== side || dragging.index === targetIndex) {
      setDragging(null);
      return;
    }

    const setSlots = side === "blue" ? setBlueAssignments : setRedAssignments;
    setSlots((prev) => {
      const next = [...prev];
      [next[targetIndex], next[dragging.index]] = [
        next[dragging.index],
        next[targetIndex],
      ];
      return next;
    });

    setDragging(null);
  };

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center text-white/70">
        Loading character pool...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-dvh items-center justify-center text-red-400">
        Failed to load characters.
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-screen overflow-hidden">
      <div className="grid h-dvh grid-cols-7 gap-4 p-4">
        <div className="pointer-events-none fixed inset-0 left-[-500px] z-[-2] aspect-square h-screen rounded-full bg-radial from-sky-400/50 from-0% to-white/0 to-70%" />
        <div className="pointer-events-none fixed inset-0 left-[1500px] top-0 z-[-2] aspect-square h-screen rounded-full bg-radial from-red-400/50 from-0% to-white/0 to-70%" />

        <div className="col-span-3 flex h-full flex-col gap-4 overflow-hidden">
          <SideHeader side="blue" player={match?.bluePlayer} picksCount={bluePicks.length} />
          <PickSlots
            side="blue"
            picks={bluePicks}
            currentPickSide={currentPickSide}
            pendingPick={pendingPick}
            isDraftCompleted={isDraftCompleted}
          />
          {isDraftCompleted ? (
            <SideAssignmentBoard
              side="blue"
              slots={blueAssignments}
              canReorder={canBlueReorderAssignments}
              onDragStart={(dragSide, index) =>
                setDragging({ side: dragSide, index })
              }
              onDrop={onDropAssignment}
              onDragEnd={() => setDragging(null)}
            />
          ) : (
            <CharacterSelector
              side="blue"
              characters={blueFilteredCharacters}
              search={leftSearch}
              onSearchChange={setLeftSearch}
              selectedElement={leftElementFilter}
              onSelectElement={setLeftElementFilter}
              selectedRarity={leftRarityFilter}
              onSelectRarity={setLeftRarityFilter}
              selectedCharacterIds={selectedCharacterIds}
              pendingPick={pendingPick}
              canInteract={canBlueInteract}
              onSelectCharacter={onSelectCharacter}
            />
          )}
        </div>

        <div className="col-span-1 flex flex-col items-center justify-between gap-4 py-4">
          <div className="w-full rounded-md border border-white/30 bg-white/5 p-3 text-center">
            <p className="text-sm text-white/80">
              {isDraftCompleted
                ? "Draft completed. Leaders can now split team members."
                : `Pick ${draftStep + 1}/${TOTAL_PICKS} - ${
                  currentPickSide === "blue" ? "Blue" : "Red"
                } side turn`}
            </p>
          </div>

          <div className="w-full rounded-md border border-white/15 bg-black/30 p-3 text-center text-xs text-white/70">
            No ban phase in 3vs3. Characters are shared globally and cannot be duplicated.
          </div>

          <Button
            disabled={isDraftCompleted || !pendingPick || pendingPick.side !== currentPickSide}
            onClick={onConfirmPick}
            className="w-full"
          >
            Confirm pick
          </Button>
        </div>

        <div className="col-span-3 flex h-full flex-col gap-4 overflow-hidden">
          <SideHeader side="red" player={match?.redPlayer} picksCount={redPicks.length} />
          <PickSlots
            side="red"
            picks={redPicks}
            currentPickSide={currentPickSide}
            pendingPick={pendingPick}
            isDraftCompleted={isDraftCompleted}
          />
          {isDraftCompleted ? (
            <SideAssignmentBoard
              side="red"
              slots={redAssignments}
              canReorder={canRedReorderAssignments}
              onDragStart={(dragSide, index) =>
                setDragging({ side: dragSide, index })
              }
              onDrop={onDropAssignment}
              onDragEnd={() => setDragging(null)}
            />
          ) : (
            <CharacterSelector
              side="red"
              characters={redFilteredCharacters}
              search={rightSearch}
              onSearchChange={setRightSearch}
              selectedElement={rightElementFilter}
              onSelectElement={setRightElementFilter}
              selectedRarity={rightRarityFilter}
              onSelectRarity={setRightRarityFilter}
              selectedCharacterIds={selectedCharacterIds}
              pendingPick={pendingPick}
              canInteract={canRedInteract}
              onSelectCharacter={onSelectCharacter}
            />
          )}
        </div>
      </div>
    </div>
  );
}
