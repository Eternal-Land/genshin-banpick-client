import { userCharactersApi } from "@/apis/user-characters";
import { sessionStateApi } from "@/apis/session-state";
import { matchApi } from "@/apis/match";
import type { MatchStateResponse } from "@/apis/match/types";
import { sessionCostApi } from "@/apis/session-cost";
import type { UserCharacterResponse } from "@/apis/user-characters/types";
import CharacterSelector from "@/components/3vs3/character-selector";
import PickSlots from "@/components/3vs3/pick-slots";
import SideAssignmentBoard from "@/components/3vs3/side-assignment-board";
import SideHeader from "@/components/3vs3/side-header";
import type { DraftSide, PendingPickState } from "@/components/3vs3/types";
import { ELEMENT_FILTER_ALL } from "@/components/match/ban-pick-element-filter";
import { RARITY_FILTER_ALL } from "@/components/match/ban-pick-rarity-filter";
import type { BanPickCharacter } from "@/components/match/ban-pick.types";
import { THREE_VS_THREE_DRAFT_SEQUENCE } from "@/components/match/ban-pick.utils";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/hooks/use-app-selector";
import { useBanPickFilters } from "@/hooks/use-ban-pick-filters";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { MatchStatus, type CharacterElementEnum } from "@/lib/constants";
import { CharacterElementDetail } from "@/lib/constants";
import { SocketEvent } from "@/lib/constants";
import { selectAuthProfile } from "@/lib/redux/auth.slice";
import { socket } from "@/lib/socket";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	useLoaderData,
	useRouter,
} from "@tanstack/react-router";
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
	type?: "ban" | "pick";
	character?: BanPickCharacter;
	updatedBy?: string;
}

interface SwapBanPickSlotPositionSocketPayload {
	side?: DraftSide;
	sourceTeamOrder?: number;
	targetTeamOrder?: number;
	updatedBy?: string;
}

interface PlayerOption {
	value: string;
	label: string;
}

const BANS_PER_SIDE = 1;
const PICKS_PER_SIDE = 24;
const TEAM_PLAYER_COUNT = 3;
const PICKS_PER_PLAYER = PICKS_PER_SIDE / TEAM_PLAYER_COUNT;
const TOTAL_BANS = BANS_PER_SIDE * 2;
const TOTAL_PICKS = PICKS_PER_SIDE * 2;
const TOTAL_ACTIONS = THREE_VS_THREE_DRAFT_SEQUENCE.length;

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
	Array.from({ length: PICKS_PER_SIDE }).map(
		(_, index) => picks[index] ?? null,
	);

const mapAssignmentSlotsFromSessionState = (
	slots: Array<{
		matchSide: string;
		teamOrder: number;
		characterId: number | null;
	}>,
	side: DraftSide,
	charactersById: Map<string, BanPickCharacter>,
	pickedCharacters: BanPickCharacter[],
) => {
	const normalizedSide = side === "blue" ? "BLUE" : "RED";
	const next = createEmptyAssignmentSlots();

	slots
		.filter((slot) => slot.matchSide === normalizedSide)
		.sort((left, right) => left.teamOrder - right.teamOrder)
		.forEach((slot, index) => {
			const teamOrderIndex = index;
			if (
				teamOrderIndex < 0 ||
				teamOrderIndex >= next.length ||
				!slot.characterId
			) {
				return;
			}

			next[teamOrderIndex] =
				charactersById.get(String(slot.characterId)) ?? null;
		});

	const assignedCharacterIds = new Set(
		next
			.filter((character): character is BanPickCharacter => character !== null)
			.map((character) => character.id),
	);
	let pickedCharacterIndex = 0;

	next.forEach((character, index) => {
		if (character !== null) {
			return;
		}

		while (
			pickedCharacterIndex < pickedCharacters.length &&
			assignedCharacterIds.has(pickedCharacters[pickedCharacterIndex].id)
		) {
			pickedCharacterIndex += 1;
		}

		const missingCharacter = pickedCharacters[pickedCharacterIndex];
		if (missingCharacter) {
			next[index] = missingCharacter;
			assignedCharacterIds.add(missingCharacter.id);
			pickedCharacterIndex += 1;
		}
	});

	return next;
};

const mapPickedCharactersFromState = (
	pickedCharacterIds: string[],
	charactersById: Map<string, BanPickCharacter>,
	bannedCharacterIds: Set<string> = new Set(),
) =>
	pickedCharacterIds.flatMap((pickedCharacterId) => {
		if (bannedCharacterIds.has(String(pickedCharacterId))) {
			return [];
		}

		const character = charactersById.get(String(pickedCharacterId));
		return character ? [character] : [];
	});

const mapBanCharactersFromState = (
	bannedCharacterIds: string[],
	charactersById: Map<string, BanPickCharacter>,
) =>
	bannedCharacterIds.flatMap((bannedCharacterId) => {
		const character = charactersById.get(String(bannedCharacterId));
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

	const [blueBans, setBlueBans] = useState<BanPickCharacter[]>([]);
	const [redBans, setRedBans] = useState<BanPickCharacter[]>([]);
	const [bluePicks, setBluePicks] = useState<BanPickCharacter[]>([]);
	const [redPicks, setRedPicks] = useState<BanPickCharacter[]>([]);
	const [pageMatchState, setPageMatchState] = useState<
		MatchStateResponse | undefined
	>(matchState);
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

	const { data: sessionCostResponse } = useQuery({
		queryKey: [
			"session-cost",
			"3vs3",
			match?.id,
			pageMatchState?.currentSession,
		],
		queryFn: () => sessionCostApi.getCurrentSessionCost(match!.id),
		enabled: Boolean(match?.id && pageMatchState?.currentSession),
	});

	const { data: sessionStateResponse } = useQuery({
		queryKey: [
			"session-state",
			"3vs3",
			match?.id,
			pageMatchState?.currentSession,
		],
		queryFn: () => sessionStateApi.getCurrentSessionState(match!.id),
		enabled: Boolean(match?.id && pageMatchState?.currentSession),
	});

	const allCharacters = useMemo(
		() => (data?.data ?? []).map(mapCharacterToBanPickCharacter),
		[data?.data],
	);

	const charactersById = useMemo(
		() =>
			new Map(
				allCharacters.map(
					(character) => [String(character.id), character] as const,
				),
			),
		[allCharacters],
	);

	const playerOptions = useMemo<PlayerOption[]>(() => {
		const players = [match?.bluePlayer, match?.redPlayer, match?.host].filter(
			(player): player is NonNullable<typeof player> => Boolean(player),
		);

		const optionMap = new Map<string, PlayerOption>();
		players.forEach((player) => {
			if (!optionMap.has(player.id)) {
				optionMap.set(player.id, {
					value: player.id,
					label: player.displayName,
				});
			}
		});

		return [...optionMap.values()];
	}, [match?.bluePlayer, match?.host, match?.redPlayer]);

	const blueDefaultCost = useMemo(
		() =>
			sessionCostResponse?.data?.blueTotalCost !== undefined
				? String(Math.floor(Number(sessionCostResponse.data.blueTotalCost)))
				: "",
		[sessionCostResponse?.data?.blueTotalCost],
	);

	const redDefaultCost = useMemo(
		() =>
			sessionCostResponse?.data?.redTotalCost !== undefined
				? String(Math.floor(Number(sessionCostResponse.data.redTotalCost)))
				: "",
		[sessionCostResponse?.data?.redTotalCost],
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

		setBlueBans(
			mapBanCharactersFromState(pageMatchState.blueBanChars, charactersById),
		);
		setRedBans(
			mapBanCharactersFromState(pageMatchState.redBanChars, charactersById),
		);
		const bannedCharacterIds = new Set(
			[...pageMatchState.blueBanChars, ...pageMatchState.redBanChars].map(
				String,
			),
		);
		setBluePicks(
			mapPickedCharactersFromState(
				pageMatchState.blueSelectedChars,
				charactersById,
				bannedCharacterIds,
			),
		);
		setRedPicks(
			mapPickedCharactersFromState(
				pageMatchState.redSelectedChars,
				charactersById,
				bannedCharacterIds,
			),
		);
		setPendingPick(null);
	}, [charactersById, pageMatchState]);

	const selectedCharacterIds = useMemo(() => {
		const selected = new Set<string>();
		[...blueBans, ...redBans, ...bluePicks, ...redPicks].forEach(
			(character) => {
				selected.add(character.id);
			},
		);
		return selected;
	}, [blueBans, bluePicks, redBans, redPicks]);

	const draftStep =
		blueBans.length + redBans.length + bluePicks.length + redPicks.length;
	const isDraftCompleted = draftStep >= TOTAL_ACTIONS;
	const currentAction = !isDraftCompleted
		? THREE_VS_THREE_DRAFT_SEQUENCE[draftStep]
		: undefined;
	const currentPickSide = !isDraftCompleted ? currentAction?.side : undefined;

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
		!isDraftCompleted &&
		currentAction?.side === "blue" &&
		profile?.id === match?.bluePlayer?.id;
	const canRedInteract =
		!isDraftCompleted &&
		currentAction?.side === "red" &&
		profile?.id === match?.redPlayer?.id;

	const canBlueReorderAssignments = profile?.id === match?.bluePlayer?.id;
	const canRedReorderAssignments = profile?.id === match?.redPlayer?.id;

	const applyPickAction = (side: DraftSide, character: BanPickCharacter) => {
		if (isDraftCompleted || !currentAction || side !== currentAction.side) {
			return;
		}

		if (selectedCharacterIds.has(character.id)) {
			return;
		}

		if (currentAction.type === "ban") {
			if (side === "blue") {
				if (blueBans.length >= BANS_PER_SIDE) {
					return;
				}
				setBlueBans((prev) => [...prev, character]);
			} else {
				if (redBans.length >= BANS_PER_SIDE) {
					return;
				}
				setRedBans((prev) => [...prev, character]);
			}
		} else if (side === "blue") {
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

	useSocketEvent(
		SocketEvent.SWAP_BAN_PICK_SLOT_POSITION,
		(payload?: SwapBanPickSlotPositionSocketPayload) => {
			if (
				!payload?.side ||
				!payload?.sourceTeamOrder ||
				!payload?.targetTeamOrder ||
				payload.sourceTeamOrder === payload.targetTeamOrder
			) {
				return;
			}

			if (payload.updatedBy && payload.updatedBy === profile?.id) {
				return;
			}

			const sourceIndex = payload.sourceTeamOrder - 1;
			const targetIndex = payload.targetTeamOrder - 1;
			if (sourceIndex < 0 || targetIndex < 0) {
				return;
			}

			const setSlots =
				payload.side === "blue" ? setBlueAssignments : setRedAssignments;
			setSlots((prev) => {
				if (sourceIndex >= prev.length || targetIndex >= prev.length) {
					return prev;
				}

				const next = [...prev];
				[next[targetIndex], next[sourceIndex]] = [
					next[sourceIndex],
					next[targetIndex],
				];
				return next;
			});
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

		const sessionStateSlots = sessionStateResponse?.data?.banPickSlots ?? [];

		if (!blueAssignmentInitializedRef.current) {
			blueAssignmentInitializedRef.current = true;
			if (sessionStateSlots.length > 0) {
				setBlueAssignments(
					mapAssignmentSlotsFromSessionState(
						sessionStateSlots,
						"blue",
						charactersById,
						bluePicks,
					),
				);
			} else {
				setBlueAssignments(toFixedPickSlots(bluePicks));
			}
		}

		if (!redAssignmentInitializedRef.current) {
			redAssignmentInitializedRef.current = true;
			if (sessionStateSlots.length > 0) {
				setRedAssignments(
					mapAssignmentSlotsFromSessionState(
						sessionStateSlots,
						"red",
						charactersById,
						redPicks,
					),
				);
			} else {
				setRedAssignments(toFixedPickSlots(redPicks));
			}
		}
	}, [
		bluePicks,
		charactersById,
		isDraftCompleted,
		redPicks,
		sessionStateResponse?.data?.banPickSlots,
	]);

	const onSelectCharacter = (side: DraftSide, character: BanPickCharacter) => {
		if (isDraftCompleted || !currentAction || side !== currentAction.side) {
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
		if (!pendingPick || isDraftCompleted || !currentAction) {
			return;
		}

		if (pendingPick.side !== currentAction.side) {
			return;
		}

		applyPickAction(pendingPick.side, pendingPick.character);

		if (!match?.id) {
			return;
		}

		socket.emit(SocketEvent.UPDATE_BAN_PICK_SLOT, {
			matchId: match.id,
			side: pendingPick.side,
			type: currentAction.type,
			character: pendingPick.character,
			updatedBy: profile?.id,
		});
	};

	const onDropAssignment = (side: DraftSide, targetIndex: number) => {
		if (!dragging || dragging.side !== side || dragging.index === targetIndex) {
			setDragging(null);
			return;
		}

		if (!match?.id) {
			setDragging(null);
			return;
		}

		const sourceTeamOrder = dragging.index + 1;
		const targetTeamOrder = targetIndex + 1;

		const setSlots = side === "blue" ? setBlueAssignments : setRedAssignments;
		setSlots((prev) => {
			const next = [...prev];
			[next[targetIndex], next[dragging.index]] = [
				next[dragging.index],
				next[targetIndex],
			];
			return next;
		});

		socket.emit(SocketEvent.SWAP_BAN_PICK_SLOT_POSITION, {
			matchId: match.id,
			side,
			sourceTeamOrder,
			targetTeamOrder,
			updatedBy: profile?.id,
		});

		setDragging(null);
	};

	const onUpdateSlotBuild = ({
		side,
		slotIndex,
		characterId,
		constellation,
		refinement,
	}: {
		side: DraftSide;
		slotIndex: number;
		characterId: string;
		constellation: number;
		refinement: number;
	}) => {
		if (!match?.id) {
			return;
		}

		const sideSlots = side === "blue" ? blueAssignments : redAssignments;
		const selectedCharacter = sideSlots[slotIndex];
		if (!selectedCharacter || selectedCharacter.id !== characterId) {
			return;
		}

		const numericCharacterId = Number(characterId);
		if (!Number.isInteger(numericCharacterId) || numericCharacterId <= 0) {
			return;
		}

		void matchApi.updateSlotBuild(match.id, {
			teamOrder: slotIndex + 1,
			characterId: numericCharacterId,
			characterConstellation: constellation,
			weaponRefinement: refinement,
		});
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
							playerOptions={playerOptions}
							defaultCost={blueDefaultCost}
							canReorder={canBlueReorderAssignments}
							onDragStart={(dragSide, index) =>
								setDragging({ side: dragSide, index })
							}
							onDrop={onDropAssignment}
							onDragEnd={() => setDragging(null)}
							onUpdateSlotBuild={onUpdateSlotBuild}
						/>
					) : (
						<>
							<div className="rounded-xl border border-white/20 bg-white/5 p-4">
								<div className="mb-2 text-xs uppercase tracking-wider text-white/70">
									Bans
								</div>
								<div className="grid grid-cols-3 gap-2">
									{Array.from({ length: BANS_PER_SIDE }).map((_, index) => {
										const committed = blueBans[index];
										const preview =
											!isDraftCompleted &&
											!committed &&
											pendingPick?.side === "blue" &&
											currentAction?.side === "blue" &&
											currentAction?.type === "ban" &&
											index === blueBans.length
												? pendingPick.character
												: null;

										const character = committed ?? preview;
										const isActiveSlot =
											!isDraftCompleted &&
											currentAction?.side === "blue" &&
											currentAction?.type === "ban" &&
											index === blueBans.length;

										return (
											<div
												key={`blue-ban-slot-${index}`}
												className={cn(
													"relative h-16 overflow-hidden rounded-md border border-sky-400/40 bg-sky-500/10",
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

							<PickSlots
								side="blue"
								picks={bluePicks}
								picksPerSide={PICKS_PER_SIDE}
								currentPickSide={currentPickSide}
								isPickTurn={currentAction?.type === "pick"}
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
								: currentAction?.type === "ban"
									? `Ban ${draftStep + 1}/${TOTAL_ACTIONS} - ${currentAction.side === "blue" ? "Blue" : "Red"} side turn`
									: `Pick ${draftStep + 1 - TOTAL_BANS}/${TOTAL_PICKS} - ${currentAction?.side === "blue" ? "Blue" : "Red"} side turn`}
						</p>
					</div>

					<Button
						disabled={
							isDraftCompleted ||
							!pendingPick ||
							!currentAction ||
							pendingPick.side !== currentAction.side
						}
						onClick={onConfirmPick}
						className="w-full"
					>
						{currentAction?.type === "ban" ? "Confirm ban" : "Confirm pick"}
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
							playerOptions={playerOptions}
							defaultCost={redDefaultCost}
							canReorder={canRedReorderAssignments}
							onDragStart={(dragSide, index) =>
								setDragging({ side: dragSide, index })
							}
							onDrop={onDropAssignment}
							onDragEnd={() => setDragging(null)}
							onUpdateSlotBuild={onUpdateSlotBuild}
						/>
					) : (
						<>
							<div className="rounded-xl border border-white/20 bg-white/5 p-4">
								<div className="mb-2 text-xs uppercase tracking-wider text-white/70">
									Bans
								</div>
								<div className="grid grid-cols-3 gap-2">
									{Array.from({ length: BANS_PER_SIDE }).map((_, index) => {
										const committed = redBans[index];
										const preview =
											!isDraftCompleted &&
											!committed &&
											pendingPick?.side === "red" &&
											currentAction?.side === "red" &&
											currentAction?.type === "ban" &&
											index === redBans.length
												? pendingPick.character
												: null;

										const character = committed ?? preview;
										const isActiveSlot =
											!isDraftCompleted &&
											currentAction?.side === "red" &&
											currentAction?.type === "ban" &&
											index === redBans.length;

										return (
											<div
												key={`red-ban-slot-${index}`}
												className={cn(
													"relative h-16 overflow-hidden rounded-md border border-red-500/40 bg-red-500/10",
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

							<PickSlots
								side="red"
								picks={redPicks}
								picksPerSide={PICKS_PER_SIDE}
								currentPickSide={currentPickSide}
								isPickTurn={currentAction?.type === "pick"}
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
