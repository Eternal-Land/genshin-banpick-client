import { userCharactersApi } from "@/apis/user-characters";
import type { MatchStateResponse } from "@/apis/match/types";
import type { UserCharacterResponse } from "@/apis/user-characters/types";
import CharacterSelector from "@/components/3vs3/character-selector";
import PickSlots from "@/components/3vs3/pick-slots";
import SideAssignmentBoard from "@/components/3vs3/side-assignment-board";
import SideHeader from "@/components/3vs3/side-header";
import type { DraftSide, PendingPickState } from "@/components/3vs3/types";
import { ELEMENT_FILTER_ALL } from "@/components/match/ban-pick-element-filter";
import { RARITY_FILTER_ALL } from "@/components/match/ban-pick-rarity-filter";
import type { BanPickCharacter } from "@/components/match/ban-pick.types";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/hooks/use-app-selector";
import { useBanPickFilters } from "@/hooks/use-ban-pick-filters";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { MatchStatus, type CharacterElementEnum } from "@/lib/constants";
import { CharacterElementDetail } from "@/lib/constants";
import { SocketEvent } from "@/lib/constants";
import { selectAuthProfile } from "@/lib/redux/auth.slice";
import { socket } from "@/lib/socket";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useLoaderData, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/_userLayout/room/$roomId/3vs3")({
  component: RouteComponent,
});

interface DraggingState {
  side: DraftSide;
  index: number;
}

interface ThreeVsThreePickSocketPayload {
  side?: DraftSide;
  character?: BanPickCharacter;
  updatedBy?: string;
}

const PICKS_PER_SIDE = 24;
const TEAM_PLAYER_COUNT = 3;
const PICKS_PER_PLAYER = PICKS_PER_SIDE / TEAM_PLAYER_COUNT;
const TOTAL_PICKS = PICKS_PER_SIDE * 2;

const createPickSequence = (picksPerSide: number): DraftSide[] => {
  const sequence: DraftSide[] = [];
  let blueRemaining = picksPerSide;
  let redRemaining = picksPerSide;

  if (blueRemaining > 0) {
    sequence.push("blue");
    blueRemaining -= 1;
  }

  // Reserve one red pick so the last slot is always red.
  if (redRemaining > 0) {
    redRemaining -= 1;
  }

  while (blueRemaining > 0 || redRemaining > 0) {
    const redBatch = Math.min(2, redRemaining);
    for (let index = 0; index < redBatch; index += 1) {
      sequence.push("red");
      redRemaining -= 1;
    }

    const blueBatch = Math.min(2, blueRemaining);
    for (let index = 0; index < blueBatch; index += 1) {
      sequence.push("blue");
      blueRemaining -= 1;
    }

    if (redBatch === 0 && blueBatch === 0) {
      break;
    }
  }

  sequence.push("red");

  return sequence;
};

const PICK_SEQUENCE: DraftSide[] = createPickSequence(PICKS_PER_SIDE);

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

const mapPickedCharactersFromState = (
  pickedCharacterIds: string[],
  charactersById: Map<string, BanPickCharacter>,
) =>
  pickedCharacterIds.flatMap((pickedCharacterId) => {
    const character = charactersById.get(String(pickedCharacterId));
    return character ? [character] : [];
  });

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

function RouteComponent() {
  const { roomId } = Route.useParams();
  const router = useRouter();
  const profile = useAppSelector(selectAuthProfile);
  const { match, matchState } = useLoaderData({
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
  const [pageMatchState, setPageMatchState] = useState<MatchStateResponse | undefined>(
    matchState,
  );
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

  const charactersById = useMemo(
    () =>
      new Map(
        allCharacters.map((character) => [String(character.id), character] as const),
      ),
    [allCharacters],
  );

  useEffect(() => {
    setPageMatchState(matchState);
  }, [matchState]);

  useSocketEvent(SocketEvent.UPDATE_MATCH_STATE, (data: MatchStateResponse) => {
    setPageMatchState(data);
  });

  useEffect(() => {
    if (!pageMatchState) {
      return;
    }

    setBluePicks(
      mapPickedCharactersFromState(pageMatchState.blueSelectedChars, charactersById),
    );
    setRedPicks(
      mapPickedCharactersFromState(pageMatchState.redSelectedChars, charactersById),
    );
    setPendingPick(null);
  }, [charactersById, pageMatchState]);

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

  const applyPickAction = (side: DraftSide, character: BanPickCharacter) => {
    if (isDraftCompleted || side !== currentPickSide) {
      return;
    }

    if (selectedCharacterIds.has(character.id)) {
      return;
    }

    if (side === "blue") {
      if (bluePicks.length >= PICKS_PER_SIDE) {
        return;
      }
      setBluePicks((prev) => [...prev, character]);
    } else {
      if (redPicks.length >= PICKS_PER_SIDE) {
        return;
      }
      setRedPicks((prev) => [...prev, character]);
    }

    setPendingPick(null);
  };

  useSocketEvent(
    SocketEvent.UPDATE_BAN_PICK_SLOT,
    (payload?: ThreeVsThreePickSocketPayload) => {
      if (!payload?.character || !payload?.side) {
        return;
      }

      if (payload.updatedBy && payload.updatedBy === profile?.id) {
        return;
      }

      applyPickAction(payload.side, payload.character);
    },
  );

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

    applyPickAction(pendingPick.side, pendingPick.character);

    if (!match?.id) {
      return;
    }

    socket.emit(SocketEvent.UPDATE_BAN_PICK_SLOT, {
      matchId: match.id,
      side: pendingPick.side,
      character: pendingPick.character,
      updatedBy: profile?.id,
    });
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
          <SideHeader
            side="blue"
            player={match?.bluePlayer}
            picksCount={bluePicks.length}
            picksPerSide={PICKS_PER_SIDE}
          />

          {isDraftCompleted ? (
            <SideAssignmentBoard
              side="blue"
              slots={blueAssignments}
              teamPlayerCount={TEAM_PLAYER_COUNT}
              picksPerPlayer={PICKS_PER_PLAYER}
              canReorder={canBlueReorderAssignments}
              onDragStart={(dragSide, index) =>
                setDragging({ side: dragSide, index })
              }
              onDrop={onDropAssignment}
              onDragEnd={() => setDragging(null)}
            />
          ) : (
            <>
              <PickSlots
                side="blue"
                picks={bluePicks}
                picksPerSide={PICKS_PER_SIDE}
                currentPickSide={currentPickSide}
                pendingPick={pendingPick}
                isDraftCompleted={isDraftCompleted}
              />

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
            </>
          )}
        </div>

        <div className="col-span-1 flex flex-col items-center justify-between gap-4 py-4">
          <div className="w-full rounded-md border border-white/30 bg-white/5 p-3 text-center">
            <p className="text-sm text-white/80">
              {isDraftCompleted
                ? "Draft completed. Leaders can now split team members."
                : `Pick ${draftStep + 1}/${TOTAL_PICKS} - ${currentPickSide === "blue" ? "Blue" : "Red"
                } side turn`}
            </p>
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
          <SideHeader
            side="red"
            player={match?.redPlayer}
            picksCount={redPicks.length}
            picksPerSide={PICKS_PER_SIDE}
          />

          {isDraftCompleted ? (
            <SideAssignmentBoard
              side="red"
              slots={redAssignments}
              teamPlayerCount={TEAM_PLAYER_COUNT}
              picksPerPlayer={PICKS_PER_PLAYER}
              canReorder={canRedReorderAssignments}
              onDragStart={(dragSide, index) =>
                setDragging({ side: dragSide, index })
              }
              onDrop={onDropAssignment}
              onDragEnd={() => setDragging(null)}
            />
          ) : (
            <>
              <PickSlots
                side="red"
                picks={redPicks}
                picksPerSide={PICKS_PER_SIDE}
                currentPickSide={currentPickSide}
                pendingPick={pendingPick}
                isDraftCompleted={isDraftCompleted}
              />
              
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
            </>

          )}
        </div>
      </div>
    </div>
  );
}
