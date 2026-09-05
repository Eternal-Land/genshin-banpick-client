import { userCharactersApi } from "@/apis/user-characters";
import { sessionStateApi } from "@/apis/session-state";
import type { SessionStateTeamCostResponse } from "@/apis/session-state/types";
import { usersApi } from "@/apis/users";
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
import { matchLocaleKeys } from "@/i18n/keys";
import { getTranslationToken } from "@/i18n/namespaces";
import {
	MatchStatus,
	PlayerSide,
	type CharacterElementEnum,
	type MatchStatusEnum,
} from "@/lib/constants";
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
import { useTranslation } from "react-i18next";
import {
	ArrowLeftRightIcon,
	PauseCircle,
	PlayCircle,
	StepBack,
	StepForward,
} from "lucide-react";
import { toast } from "sonner";

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

interface UpdatePickSlotSocketPayload {
	side?: DraftSide;
	teamOrder?: number;
	characterId?: number;
	characterConstellation?: number;
	weaponRefinement?: number;
	characterLevel?: number;
	updatedBy?: string;
}

interface UpdateTeamCostSocketPayload {
	teamSide?: DraftSide;
	chamberIndex?: number;
	accountId?: string;
	isUsedStar?: boolean;
	totalCharacterConstellationCost?: number;
	totalWeaponRefinementCost?: number;
	totalCharacterLevelCost?: number;
	totalChamberTimeBonus?: number;
	updatedBy?: string;
}

interface UpdateChamberClearTimeSocketPayload {
	teamSide?: DraftSide;
	chamberIndex?: number;
	clearTimeSeconds?: number;
	updatedBy?: string;
}

interface MatchUpdatedSocketPayload {
	id?: string;
	status?: MatchStatusEnum;
}

interface PlayerOption {
	value: string;
	label: string;
}

interface SlotBuildState {
	characterId: string;
	constellation: number;
	refinement: number;
	level: number;
}

const BANS_PER_SIDE = 1;
const PICKS_PER_SIDE = 24;
const TEAM_PLAYER_COUNT = 3;
const PICKS_PER_PLAYER = PICKS_PER_SIDE / TEAM_PLAYER_COUNT;
const TOTAL_BANS = BANS_PER_SIDE * 2;
const TOTAL_PICKS = PICKS_PER_SIDE * 2;
const TOTAL_ACTIONS = THREE_VS_THREE_DRAFT_SEQUENCE.length;
const CHAMBER_STAR_TIME_BONUS_SECONDS = -15;

function calculatePunishTime(remainTimeSec: number) {
	if (remainTimeSec >= 0) {
		return 0;
	}
	return Math.floor(-remainTimeSec / 20) * 5;
}

const createEmptyAssignmentSlots = () =>
	Array.from({ length: PICKS_PER_SIDE }, () => null as BanPickCharacter | null);

const createEmptySlotBuilds = () =>
	Array.from({ length: PICKS_PER_SIDE }).map(() => ({
		characterId: "",
		constellation: 0,
		refinement: 0,
		level: 90,
	}));

const createSlotBuildsFromAssignments = (
	assignments: Array<BanPickCharacter | null>,
) =>
	assignments.map((character) => ({
		characterId: character?.id ?? "",
		constellation: character?.constellation ?? 0,
		refinement: 0,
		level: character?.level ?? 90,
	}));

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

const mapSlotBuildsFromSessionState = (
	slots: Array<{
		matchSide: string;
		teamOrder: number;
		characterId: number | null;
		characterConstellation: number | null;
		weaponRefinement: number | null;
		characterLevel: number | null;
	}>,
	side: DraftSide,
) => {
	const normalizedSide = side === "blue" ? "BLUE" : "RED";
	const next = createEmptySlotBuilds();

	slots
		.filter((slot) => slot.matchSide === normalizedSide)
		.sort((left, right) => left.teamOrder - right.teamOrder)
		.forEach((slot) => {
			const teamOrderIndex = slot.teamOrder - 1;
			if (teamOrderIndex < 0 || teamOrderIndex >= next.length) {
				return;
			}

			next[teamOrderIndex] = {
				characterId: slot.characterId ? String(slot.characterId) : "",
				constellation:
					typeof slot.characterConstellation === "number"
						? slot.characterConstellation
						: 0,
				refinement:
					typeof slot.weaponRefinement === "number" ? slot.weaponRefinement : 0,
				level:
					typeof slot.characterLevel === "number" ? slot.characterLevel : 90,
			};
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

// const formatSecondsToClock = (seconds: number) => {
// 	const totalSeconds = Math.max(0, Math.floor(seconds));
// 	const minutes = Math.floor(totalSeconds / 60);
// 	const remainingSeconds = totalSeconds % 60;
// 	return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
// };

const formatSignedSecondsToClock = (seconds: number) => {
	const normalized = Number.isFinite(seconds) ? Math.floor(seconds) : 0;
	const sign = normalized < 0 ? "-" : "";
	const absolute = Math.abs(normalized);
	const minutes = Math.floor(absolute / 60);
	const remainingSeconds = absolute % 60;

	return `${sign}${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const formatSecondsToClock = (seconds: number) => {
	const normalized = Number.isFinite(seconds)
		? Math.max(0, Math.floor(seconds))
		: 0;
	const minutes = Math.floor(normalized / 60);
	const remainingSeconds = normalized % 60;

	return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

function RouteComponent() {
	const { roomId } = Route.useParams();
	const router = useRouter();
	const { t } = useTranslation();
	const tMatch = (key: string, options?: Record<string, string | number>) =>
		t(getTranslationToken("match", key), options);
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
	const [blueSlotBuilds, setBlueSlotBuilds] = useState<SlotBuildState[]>(
		createEmptySlotBuilds,
	);
	const [redSlotBuilds, setRedSlotBuilds] = useState<SlotBuildState[]>(
		createEmptySlotBuilds,
	);
	const [teamCosts, setTeamCosts] = useState<SessionStateTeamCostResponse[]>(
		[],
	);
	const [dragging, setDragging] = useState<DraggingState | null>(null);
	const [blueChamberBaseTimes, setBlueChamberBaseTimes] = useState<number[]>([
		0, 0, 0,
	]);
	const [redChamberBaseTimes, setRedChamberBaseTimes] = useState<number[]>([
		0, 0, 0,
	]);
	const [isCompletingMatch, setIsCompletingMatch] = useState(false);
	const [isUndoingPreviousTurn, setIsUndoingPreviousTurn] = useState(false);
	const [isUpdatingPause, setIsUpdatingPause] = useState(false);
	const [nowMs, setNowMs] = useState(() => Date.now());

	const blueAssignmentInitializedRef = useRef(false);
	const redAssignmentInitializedRef = useRef(false);

	useEffect(() => {
		const intervalId = window.setInterval(() => {
			setNowMs(Date.now());
		}, 250);

		return () => {
			window.clearInterval(intervalId);
		};
	}, []);

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

	const [playerSearch, setPlayerSearch] = useState("");

	const { data: usersResponse } = useQuery({
		queryKey: ["users", "search", "3vs3", playerSearch],
		queryFn: () =>
			usersApi.searchUsers({
				page: 1,
				take: 100,
				search: playerSearch || undefined,
			}),
	});

	useEffect(() => {
		setTeamCosts(sessionStateResponse?.data?.teamCosts ?? []);
	}, [sessionStateResponse?.data?.teamCosts]);

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
		const optionMap = new Map<string, PlayerOption>();
		(usersResponse?.data ?? []).forEach((player) => {
			if (!optionMap.has(player.id)) {
				optionMap.set(player.id, {
					value: player.id,
					label: player.displayName,
				});
			}
		});

		return [...optionMap.values()];
	}, [usersResponse?.data]);

	useEffect(() => {
		const record = sessionStateResponse?.data?.sessionRecord;
		if (!record) {
			setBlueChamberBaseTimes([0, 0, 0]);
			setRedChamberBaseTimes([0, 0, 0]);
			return;
		}

		setBlueChamberBaseTimes([
			record.blueChamber1,
			record.blueChamber2,
			record.blueChamber3,
		]);
		setRedChamberBaseTimes([
			record.redChamber1,
			record.redChamber2,
			record.redChamber3,
		]);
	}, [sessionStateResponse?.data?.sessionRecord]);

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
	const isTimerPaused = Boolean(pageMatchState?.pausedAt);
	const currentAction = !isDraftCompleted
		? THREE_VS_THREE_DRAFT_SEQUENCE[draftStep]
		: undefined;
	const currentPickSide = !isDraftCompleted ? currentAction?.side : undefined;

	const turnTimeRemainingSeconds = useMemo(() => {
		if (!pageMatchState?.turnExpiredAt) {
			return null;
		}

		const turnExpiredAtMs = new Date(pageMatchState.turnExpiredAt).getTime();
		if (!Number.isFinite(turnExpiredAtMs)) {
			return null;
		}

		const pausedAtMs = pageMatchState.pausedAt
			? new Date(pageMatchState.pausedAt).getTime()
			: null;
		const anchorMs =
			pausedAtMs !== null && Number.isFinite(pausedAtMs) ? pausedAtMs : nowMs;

		return Math.ceil((turnExpiredAtMs - anchorMs) / 1000);
	}, [nowMs, pageMatchState?.pausedAt, pageMatchState?.turnExpiredAt]);

	const overtimeSeconds = useMemo(() => {
		if (turnTimeRemainingSeconds === null) {
			return 0;
		}

		return Math.max(0, -turnTimeRemainingSeconds);
	}, [turnTimeRemainingSeconds]);

	const activeTurnSide = useMemo(() => {
		if (pageMatchState?.currentTurn === PlayerSide.BLUE) {
			return "blue" as const;
		}

		if (pageMatchState?.currentTurn === PlayerSide.RED) {
			return "red" as const;
		}

		return null;
	}, [pageMatchState?.currentTurn]);

	const blueRemainingTimeSeconds = useMemo(() => {
		const base = Number(pageMatchState?.blueTimeRemain ?? 0);
		if (activeTurnSide !== "blue") {
			return base;
		}

		return base - overtimeSeconds;
	}, [activeTurnSide, overtimeSeconds, pageMatchState?.blueTimeRemain]);

	const redRemainingTimeSeconds = useMemo(() => {
		const base = Number(pageMatchState?.redTimeRemain ?? 0);
		if (activeTurnSide !== "red") {
			return base;
		}

		return base - overtimeSeconds;
	}, [activeTurnSide, overtimeSeconds, pageMatchState?.redTimeRemain]);

	const blueTurnTimeDisplay = useMemo(() => {
		if (activeTurnSide !== "blue" || turnTimeRemainingSeconds === null) {
			return "--:--";
		}

		return formatSecondsToClock(turnTimeRemainingSeconds);
	}, [activeTurnSide, turnTimeRemainingSeconds]);

	const redTurnTimeDisplay = useMemo(() => {
		if (activeTurnSide !== "red" || turnTimeRemainingSeconds === null) {
			return "--:--";
		}

		return formatSecondsToClock(turnTimeRemainingSeconds);
	}, [activeTurnSide, turnTimeRemainingSeconds]);

	const blueRemainingTimeDisplay = useMemo(
		() => formatSignedSecondsToClock(blueRemainingTimeSeconds),
		[blueRemainingTimeSeconds],
	);

	const bluePunishTime = useMemo(
		() => calculatePunishTime(blueRemainingTimeSeconds),
		[blueRemainingTimeSeconds],
	);

	const redRemainingTimeDisplay = useMemo(
		() => formatSignedSecondsToClock(redRemainingTimeSeconds),
		[redRemainingTimeSeconds],
	);

	const redPunishTime = useMemo(
		() => calculatePunishTime(redRemainingTimeSeconds),
		[redRemainingTimeSeconds],
	);

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

	const blueFinalTimeSeconds = useMemo(() => {
		const chamberTotal = blueChamberBaseTimes.reduce(
			(total, chamberBaseTime, index) => {
				const chamberCost = teamCosts.find(
					(item) =>
						item.teamSide === PlayerSide.BLUE &&
						item.chamberIndex === index + 1,
				);
				const chamberBonus = chamberCost?.totalChamberTimeBonus ?? 0;
				const starBonus = chamberCost?.isUsedStar
					? CHAMBER_STAR_TIME_BONUS_SECONDS
					: 0;
				return total + chamberBaseTime + chamberBonus + starBonus;
			},
			0,
		);

		return chamberTotal + bluePunishTime;
	}, [blueChamberBaseTimes, bluePunishTime, teamCosts]);

	const redFinalTimeSeconds = useMemo(() => {
		const chamberTotal = redChamberBaseTimes.reduce(
			(total, chamberBaseTime, index) => {
				const chamberCost = teamCosts.find(
					(item) =>
						item.teamSide === PlayerSide.RED && item.chamberIndex === index + 1,
				);
				const chamberBonus = chamberCost?.totalChamberTimeBonus ?? 0;
				const starBonus = chamberCost?.isUsedStar
					? CHAMBER_STAR_TIME_BONUS_SECONDS
					: 0;
				return total + chamberBaseTime + chamberBonus + starBonus;
			},
			0,
		);

		return chamberTotal + redPunishTime;
	}, [redChamberBaseTimes, redPunishTime, teamCosts]);

	const finalTimeGapSeconds = Math.abs(
		blueFinalTimeSeconds - redFinalTimeSeconds,
	);
	const fasterTeam =
		blueFinalTimeSeconds < redFinalTimeSeconds
			? "blue"
			: redFinalTimeSeconds < blueFinalTimeSeconds
				? "red"
				: "tie";

	const canBlueInteract =
		!isDraftCompleted &&
		!isTimerPaused &&
		currentAction?.side === "blue" &&
		profile?.id === match?.bluePlayer?.id;
	const canRedInteract =
		!isDraftCompleted &&
		!isTimerPaused &&
		currentAction?.side === "red" &&
		profile?.id === match?.redPlayer?.id;

	const isHost = profile?.id === match?.host?.id;
	const isParticipant =
		profile?.id === match?.host?.id ||
		profile?.id === match?.bluePlayer?.id ||
		profile?.id === match?.redPlayer?.id;
	const canEditBlueAssignments =
		isHost || profile?.id === match?.bluePlayer?.id;
	const canEditRedAssignments = isHost || profile?.id === match?.redPlayer?.id;
	const canBlueReorderAssignments = canEditBlueAssignments;
	const canRedReorderAssignments = canEditRedAssignments;

	const hasAllAssignedCharacters = useMemo(
		() =>
			blueAssignments.every((character) => character !== null) &&
			redAssignments.every((character) => character !== null),
		[blueAssignments, redAssignments],
	);

	const hasAllSlotBuilds = useMemo(
		() =>
			blueAssignments.every(
				(character, index) =>
					!character || blueSlotBuilds[index]?.characterId === character.id,
			) &&
			redAssignments.every(
				(character, index) =>
					!character || redSlotBuilds[index]?.characterId === character.id,
			),
		[blueAssignments, blueSlotBuilds, redAssignments, redSlotBuilds],
	);

	const hasAllTeamCostAssignments = useMemo(
		() =>
			[PlayerSide.BLUE, PlayerSide.RED].every((teamSide) =>
				Array.from({ length: TEAM_PLAYER_COUNT }).every((_, chamberOffset) => {
					const chamberIndex = chamberOffset + 1;
					const teamCost = teamCosts.find(
						(item) =>
							item.teamSide === teamSide && item.chamberIndex === chamberIndex,
					);

					return Boolean(teamCost?.accountId);
				}),
			),
		[teamCosts],
	);

	const hasAllChamberTimes = useMemo(
		() =>
			blueChamberBaseTimes.every((time) => Number(time) > 0) &&
			redChamberBaseTimes.every((time) => Number(time) > 0),
		[blueChamberBaseTimes, redChamberBaseTimes],
	);

	const isAssignmentBoardCompleted =
		hasAllAssignedCharacters &&
		hasAllSlotBuilds &&
		hasAllTeamCostAssignments &&
		hasAllChamberTimes;

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
			const setSlotBuilds =
				payload.side === "blue" ? setBlueSlotBuilds : setRedSlotBuilds;
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

			setSlotBuilds((prev) => {
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

	useSocketEvent(
		SocketEvent.UPDATE_PICK_SLOT,
		(payload?: UpdatePickSlotSocketPayload) => {
			const characterConstellation = payload?.characterConstellation;
			const weaponRefinement = payload?.weaponRefinement;
			const characterLevel = payload?.characterLevel;
			if (
				!payload?.side ||
				!payload?.teamOrder ||
				!payload?.characterId ||
				typeof characterConstellation !== "number" ||
				typeof weaponRefinement !== "number" ||
				typeof characterLevel !== "number"
			) {
				return;
			}

			if (payload.updatedBy && payload.updatedBy === profile?.id) {
				return;
			}

			const slotIndex = payload.teamOrder - 1;
			if (slotIndex < 0) {
				return;
			}

			const setSlotBuilds =
				payload.side === "blue" ? setBlueSlotBuilds : setRedSlotBuilds;
			setSlotBuilds((prev) => {
				if (slotIndex >= prev.length) {
					return prev;
				}

				const next = [...prev];
				next[slotIndex] = {
					characterId: String(payload.characterId),
					constellation: characterConstellation,
					refinement: weaponRefinement,
					level: characterLevel,
				};
				return next;
			});
		},
	);

	useSocketEvent(
		SocketEvent.UPDATE_TEAM_COST,
		(payload?: UpdateTeamCostSocketPayload) => {
			if (
				!payload?.teamSide ||
				!payload.chamberIndex ||
				!payload.accountId ||
				typeof payload.isUsedStar !== "boolean" ||
				typeof payload.totalChamberTimeBonus !== "number"
			) {
				return;
			}

			// Totals are server-computed, so apply them even for the acting user.
			setTeamCosts((prev) => {
				const next = [...prev];
				const teamSide =
					payload.teamSide === "blue" ? PlayerSide.BLUE : PlayerSide.RED;
				const chamberIndex = payload.chamberIndex!;
				const accountId = payload.accountId!;
				const totalChamberTimeBonus = payload.totalChamberTimeBonus!;
				const isUsedStar = payload.isUsedStar!;
				const index = next.findIndex(
					(item) =>
						item.teamSide === teamSide && item.chamberIndex === chamberIndex,
				);

				const updated = {
					id: next[index]?.id ?? 0,
					matchSessionId: next[index]?.matchSessionId ?? 0,
					sessionCostId: next[index]?.sessionCostId ?? 0,
					teamSide,
					chamberIndex,
					accountId,
					totalCharacterConstellationCost:
						payload.totalCharacterConstellationCost ??
						next[index]?.totalCharacterConstellationCost ??
						0,
					totalWeaponRefinementCost:
						payload.totalWeaponRefinementCost ??
						next[index]?.totalWeaponRefinementCost ??
						0,
					totalCharacterLevelCost:
						payload.totalCharacterLevelCost ??
						next[index]?.totalCharacterLevelCost ??
						0,
					totalChamberTimeBonus,
					isUsedStar,
				};

				if (index >= 0) {
					next[index] = updated;
				} else {
					next.push(updated);
				}

				return next;
			});
		},
	);

	const applyChamberClearTimeUpdate = (
		teamSide: DraftSide,
		chamberIndex: number,
		clearTimeSeconds: number,
	) => {
		const chamberSlotIndex = chamberIndex - 1;
		if (chamberSlotIndex < 0 || chamberSlotIndex >= TEAM_PLAYER_COUNT) {
			return;
		}

		const chamberValue = Math.max(0, 600 - Math.floor(clearTimeSeconds));
		const setChamberTimes =
			teamSide === "blue" ? setBlueChamberBaseTimes : setRedChamberBaseTimes;

		setChamberTimes((prev) => {
			if (chamberSlotIndex >= prev.length) {
				return prev;
			}

			const next = [...prev];
			next[chamberSlotIndex] = chamberValue;
			return next;
		});
	};

	useSocketEvent(
		SocketEvent.UPDATE_CHAMBER_CLEAR_TIME,
		(payload?: UpdateChamberClearTimeSocketPayload) => {
			if (
				!payload?.teamSide ||
				!payload.chamberIndex ||
				typeof payload.clearTimeSeconds !== "number"
			) {
				return;
			}

			applyChamberClearTimeUpdate(
				payload.teamSide,
				payload.chamberIndex,
				payload.clearTimeSeconds,
			);
		},
	);

	useSocketEvent(
		SocketEvent.MATCH_UPDATED,
		(payload?: MatchUpdatedSocketPayload) => {
			if (!payload?.id || payload.id !== match?.id || !payload.status) {
				return;
			}

			if (payload.status === MatchStatus.COMPLETED) {
				void router.navigate({
					to: "/room/$roomId/result",
					params: { roomId },
				});
				return;
			}

			if (payload.status === MatchStatus.WAITING) {
				void router.navigate({
					to: "/room/$roomId/waiting",
					params: { roomId },
				});
			}
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
			setBlueSlotBuilds(createEmptySlotBuilds());
			setRedSlotBuilds(createEmptySlotBuilds());
			return;
		}

		const sessionStateSlots = sessionStateResponse?.data?.banPickSlots ?? [];
		const hasSessionStateSlots = sessionStateSlots.length > 0;

		if (!blueAssignmentInitializedRef.current) {
			if (hasSessionStateSlots) {
				setBlueAssignments(
					mapAssignmentSlotsFromSessionState(
						sessionStateSlots,
						"blue",
						charactersById,
						bluePicks,
					),
				);
				setBlueSlotBuilds(
					mapSlotBuildsFromSessionState(sessionStateSlots, "blue"),
				);
				blueAssignmentInitializedRef.current = true;
			} else {
				const fallbackBlueAssignments = toFixedPickSlots(bluePicks);
				setBlueAssignments(fallbackBlueAssignments);
				setBlueSlotBuilds(
					createSlotBuildsFromAssignments(fallbackBlueAssignments),
				);
			}
		}

		if (!redAssignmentInitializedRef.current) {
			if (hasSessionStateSlots) {
				setRedAssignments(
					mapAssignmentSlotsFromSessionState(
						sessionStateSlots,
						"red",
						charactersById,
						redPicks,
					),
				);
				setRedSlotBuilds(
					mapSlotBuildsFromSessionState(sessionStateSlots, "red"),
				);
				redAssignmentInitializedRef.current = true;
			} else {
				const fallbackRedAssignments = toFixedPickSlots(redPicks);
				setRedAssignments(fallbackRedAssignments);
				setRedSlotBuilds(
					createSlotBuildsFromAssignments(fallbackRedAssignments),
				);
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
		if (!pendingPick || isDraftCompleted || !currentAction || isTimerPaused) {
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
		if (
			(side === "blue" && !canBlueReorderAssignments) ||
			(side === "red" && !canRedReorderAssignments)
		) {
			setDragging(null);
			return;
		}

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
		const setSlotBuilds =
			side === "blue" ? setBlueSlotBuilds : setRedSlotBuilds;
		setSlots((prev) => {
			const next = [...prev];
			[next[targetIndex], next[dragging.index]] = [
				next[dragging.index],
				next[targetIndex],
			];
			return next;
		});

		setSlotBuilds((prev) => {
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
		level,
	}: {
		side: DraftSide;
		slotIndex: number;
		characterId: string;
		constellation: number;
		refinement: number;
		level: number;
	}) => {
		if (
			(side === "blue" && !canEditBlueAssignments) ||
			(side === "red" && !canEditRedAssignments)
		) {
			return;
		}

		if (!match?.id) {
			return;
		}

		const sideSlots = side === "blue" ? blueAssignments : redAssignments;
		const setSlotBuilds =
			side === "blue" ? setBlueSlotBuilds : setRedSlotBuilds;
		const selectedCharacter = sideSlots[slotIndex];
		if (!selectedCharacter || selectedCharacter.id !== characterId) {
			return;
		}

		const numericCharacterId = Number(characterId);
		if (!Number.isInteger(numericCharacterId) || numericCharacterId <= 0) {
			return;
		}

		setSlotBuilds((prev) => {
			if (slotIndex < 0 || slotIndex >= prev.length) {
				return prev;
			}

			const next = [...prev];
			next[slotIndex] = {
				characterId,
				constellation,
				refinement,
				level,
			};
			return next;
		});

		socket.emit(SocketEvent.UPDATE_PICK_SLOT, {
			matchId: match.id,
			side,
			teamOrder: slotIndex + 1,
			characterId: numericCharacterId,
			characterConstellation: constellation,
			weaponRefinement: refinement,
			characterLevel: level,
			updatedBy: profile?.id,
		});
	};

	const onUpdateTeamCost = ({
		side,
		chamberIndex,
		accountId,
		isUsedStar,
	}: {
		side: DraftSide;
		chamberIndex: number;
		accountId: string;
		isUsedStar: boolean;
	}) => {
		if (
			(side === "blue" && !canEditBlueAssignments) ||
			(side === "red" && !canEditRedAssignments)
		) {
			return;
		}

		if (!match?.id) {
			return;
		}

		const teamSide = side === "blue" ? 0 : 1;
		setTeamCosts((prev) => {
			const index = prev.findIndex(
				(item) =>
					item.teamSide === teamSide && item.chamberIndex === chamberIndex,
			);
			const next = [...prev];
			if (index < 0) {
				next.push({
					id: 0,
					matchSessionId: sessionStateResponse?.data?.matchSessionId ?? 0,
					sessionCostId: 0,
					teamSide,
					chamberIndex,
					accountId,
					totalCharacterConstellationCost: 0,
					totalWeaponRefinementCost: 0,
					totalCharacterLevelCost: 0,
					totalChamberTimeBonus: 0,
					isUsedStar,
				});
				return next;
			}

			next[index] = {
				...next[index],
				accountId,
				isUsedStar,
			};
			return next;
		});

		socket.emit(SocketEvent.UPDATE_TEAM_COST, {
			matchId: match.id,
			teamSide: side,
			chamberIndex,
			accountId,
			isUsedStar,
			updatedBy: profile?.id,
		});
	};

	const onUpdateChamberClearTime = ({
		side,
		chamberIndex,
		clearTimeSeconds,
	}: {
		side: DraftSide;
		chamberIndex: number;
		clearTimeSeconds: number;
	}) => {
		if (
			(side === "blue" && !canEditBlueAssignments) ||
			(side === "red" && !canEditRedAssignments)
		) {
			return;
		}

		if (!match?.id || !sessionStateResponse?.data?.matchSessionId) {
			return;
		}

		applyChamberClearTimeUpdate(side, chamberIndex, clearTimeSeconds);

		socket.emit(SocketEvent.UPDATE_CHAMBER_CLEAR_TIME, {
			matchId: match.id,
			matchSessionId: sessionStateResponse.data.matchSessionId,
			teamSide: side,
			chamberIndex,
			clearTimeSeconds,
			updatedBy: profile?.id,
		});
	};

	const onCompleteMatch = async () => {
		if (
			!match?.id ||
			!isHost ||
			!isDraftCompleted ||
			!isAssignmentBoardCompleted
		) {
			return;
		}

		try {
			setIsCompletingMatch(true);
			await matchApi.completeSession(match.id);

			const refreshedMatchResponse = await matchApi.getMatch(match.id);
			const refreshedMatch = refreshedMatchResponse.data;

			if (refreshedMatch?.status === MatchStatus.COMPLETED) {
				void router.navigate({
					to: "/room/$roomId/result",
					params: { roomId: match.id },
				});
				return;
			}

			await router.invalidate();
			toast.success(tMatch(matchLocaleKeys.three_vs_three_session_completed));
		} catch {
			toast.error(tMatch(matchLocaleKeys.ban_pick_failed_complete_session));
		} finally {
			setIsCompletingMatch(false);
		}
	};

	const onUndoPreviousTurn = async () => {
		if (!match?.id || !isHost || draftStep <= 0 || isUndoingPreviousTurn) {
			return;
		}

		try {
			setIsUndoingPreviousTurn(true);
			await new Promise<void>((resolve, reject) => {
				socket
					.timeout(5000)
					.emit(
						SocketEvent.UNDO_LAST_BAN_PICK_TURN,
						{ matchId: match.id, updatedBy: profile?.id },
						(error: unknown, response?: { ok?: boolean }) => {
							if (error) {
								reject(error);
								return;
							}

							if (!response?.ok) {
								reject(new Error("Undo previous turn failed"));
								return;
							}

							resolve();
						},
					);
			});
			setPendingPick(null);
		} catch {
			toast.error(
				tMatch(matchLocaleKeys.three_vs_three_failed_undo_previous_turn),
			);
		} finally {
			setIsUndoingPreviousTurn(false);
		}
	};

	const onTogglePause = async () => {
		if (!match?.id || !isParticipant || isDraftCompleted || isUpdatingPause) {
			return;
		}

		try {
			setIsUpdatingPause(true);
			if (isTimerPaused) {
				await matchApi.resumeMatchTimer(match.id);
			} else {
				await matchApi.pauseMatchTimer(match.id);
			}
		} catch {
			if (isTimerPaused) {
				toast.error(tMatch(matchLocaleKeys.three_vs_three_failed_resume_timer));
			} else {
				toast.error(tMatch(matchLocaleKeys.three_vs_three_failed_pause_timer));
			}
		} finally {
			setIsUpdatingPause(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex h-dvh items-center justify-center text-white/70">
				{tMatch(matchLocaleKeys.three_vs_three_loading_character_pool)}
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex h-dvh items-center justify-center text-red-400">
				{tMatch(matchLocaleKeys.three_vs_three_failed_load_characters)}
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
						turnTimeDisplay={blueTurnTimeDisplay}
						remainingTimeDisplay={blueRemainingTimeDisplay}
						remainingTimeSeconds={blueRemainingTimeSeconds}
						isActiveTurn={activeTurnSide === "blue"}
						isOvertime={activeTurnSide === "blue" && overtimeSeconds > 0}
						punishTime={bluePunishTime}
					/>

					<div className="flex min-h-0 flex-1 flex-col">
						{isDraftCompleted ? (
							<SideAssignmentBoard
								side="blue"
								slots={blueAssignments}
								slotBuilds={blueSlotBuilds}
								teamCosts={teamCosts.filter((item) => item.teamSide === 0)}
								chamberBaseTimes={blueChamberBaseTimes}
								punishTimeSeconds={bluePunishTime}
								teamPlayerCount={TEAM_PLAYER_COUNT}
								picksPerPlayer={PICKS_PER_PLAYER}
								playerOptions={playerOptions}
								defaultCost={blueDefaultCost}
								canEdit={canEditBlueAssignments}
								canReorder={canBlueReorderAssignments}
								onDragStart={(dragSide, index) =>
									setDragging({ side: dragSide, index })
								}
								onDrop={onDropAssignment}
								onDragEnd={() => setDragging(null)}
								onUpdateSlotBuild={onUpdateSlotBuild}
								onUpdateTeamCost={onUpdateTeamCost}
								onUpdateChamberClearTime={onUpdateChamberClearTime}
								onSearchPlayers={setPlayerSearch}
							/>
						) : (
							<div className="flex min-h-0 flex-1 flex-col gap-4">
								<div className="rounded-xl border border-white/20 bg-white/5 p-4">
									<div className="mb-2 text-xs uppercase tracking-wider text-white/70">
										{tMatch(matchLocaleKeys.three_vs_three_bans_label)}
									</div>
									<div className="grid grid-cols-8 gap-2">
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
														"relative h-16 overflow-hidden rounded-md border border-gray-400/40 bg-gray-500/10",
														isActiveSlot && "animate-pulse border-yellow-400",
													)}
												>
													{character ? (
														<img
															src={character.imageUrl}
															alt={character.name}
															className={cn(
																"h-full w-full object-cover",
																"grayscale",
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
									onlyDisplayNames
								/>
							</div>
						)}
					</div>
				</div>

				<div className="col-span-1 flex flex-col items-center justify-between gap-4 py-4">
					<div className="w-full rounded-md border border-white/30 bg-white/5 p-3 text-center">
						<p className="text-sm text-white/80">
							{isDraftCompleted
								? tMatch(matchLocaleKeys.three_vs_three_assignment_hint)
								: currentAction?.type === "ban"
									? tMatch(matchLocaleKeys.three_vs_three_turn_ban_label, {
											step: draftStep + 1,
											total: TOTAL_ACTIONS,
											side:
												currentAction.side === "blue"
													? tMatch(matchLocaleKeys.match_result_blue_fallback)
													: tMatch(matchLocaleKeys.match_result_red_fallback),
										})
									: tMatch(matchLocaleKeys.three_vs_three_turn_pick_label, {
											step: draftStep + 1 - TOTAL_BANS,
											total: TOTAL_PICKS,
											side:
												currentAction?.side === "blue"
													? tMatch(matchLocaleKeys.match_result_blue_fallback)
													: tMatch(matchLocaleKeys.match_result_red_fallback),
										})}
						</p>
						{isTimerPaused && (
							<p className="mt-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
								{tMatch(matchLocaleKeys.three_vs_three_timer_paused)}
							</p>
						)}
					</div>

					<div className="w-full rounded-md p-3 text-center">
						<p className="mt-2 text-sm text-white/90">
							{blueFinalTimeSeconds === redFinalTimeSeconds && (
								<ArrowLeftRightIcon className="mx-1 inline h-8 w-8" />
							)}
							{blueFinalTimeSeconds < redFinalTimeSeconds && (
								<StepForward className="mx-1 inline h-8 w-8 text-blue-400" />
							)}
							{redFinalTimeSeconds < blueFinalTimeSeconds && (
								<StepBack className="mx-1 inline h-8 w-8 text-red-400" />
							)}
						</p>
						<p className="mt-1 text-xs text-white/70">
							{fasterTeam === "tie" ? (
								tMatch(matchLocaleKeys.three_vs_three_same_final_time)
							) : (
								<>
									<span
										className={cn(
											fasterTeam === "blue" ? "text-blue-400" : "text-red-400",
										)}
									>
										{tMatch(matchLocaleKeys.three_vs_three_gap_label, {
											seconds: finalTimeGapSeconds,
										})}
									</span>
								</>
							)}
						</p>
					</div>

					<div className="space-y-4">
						<Button
							disabled={
								!isParticipant ||
								isDraftCompleted ||
								isUndoingPreviousTurn ||
								isCompletingMatch ||
								isUpdatingPause
							}
							onClick={() => void onTogglePause()}
							className="w-full"
							variant="secondary"
						>
							{isUpdatingPause ? (
								isTimerPaused ? (
									tMatch(matchLocaleKeys.three_vs_three_resuming_timer)
								) : (
									tMatch(matchLocaleKeys.three_vs_three_pausing_timer)
								)
							) : isTimerPaused ? (
								<>
									<PlayCircle className="mr-2 inline h-4 w-4" />
									{tMatch(matchLocaleKeys.three_vs_three_resume_timer)}
								</>
							) : (
								<>
									<PauseCircle className="mr-2 inline h-4 w-4" />
									{tMatch(matchLocaleKeys.three_vs_three_pause_timer)}
								</>
							)}
						</Button>

						<Button
							disabled={
								!isHost ||
								draftStep <= 0 ||
								isUndoingPreviousTurn ||
								isCompletingMatch ||
								isUpdatingPause ||
								isDraftCompleted
							}
							onClick={() => void onUndoPreviousTurn()}
							className="w-full"
							variant="outline"
						>
							{isUndoingPreviousTurn
								? tMatch(matchLocaleKeys.three_vs_three_undoing_previous_turn)
								: tMatch(matchLocaleKeys.three_vs_three_undo_previous_turn)}
						</Button>

						<Button
							disabled={
								isDraftCompleted
									? !isHost ||
										!isAssignmentBoardCompleted ||
										isCompletingMatch ||
										isUndoingPreviousTurn ||
										isUpdatingPause
									: !pendingPick ||
										!currentAction ||
										isTimerPaused ||
										pendingPick.side !== currentAction.side ||
										isUndoingPreviousTurn ||
										isUpdatingPause
							}
							onClick={
								isDraftCompleted ? () => void onCompleteMatch() : onConfirmPick
							}
							className="w-full"
						>
							{isDraftCompleted
								? isCompletingMatch
									? tMatch(matchLocaleKeys.ban_pick_submitting)
									: tMatch(matchLocaleKeys.ban_pick_complete_session)
								: currentAction?.type === "ban"
									? tMatch(matchLocaleKeys.three_vs_three_confirm_ban)
									: tMatch(matchLocaleKeys.three_vs_three_confirm_pick)}
						</Button>
					</div>
				</div>

				<div className="col-span-3 flex h-full flex-col gap-4 overflow-hidden">
					<SideHeader
						side="red"
						player={match?.redPlayer}
						picksCount={redPicks.length}
						picksPerSide={PICKS_PER_SIDE}
						turnTimeDisplay={redTurnTimeDisplay}
						remainingTimeDisplay={redRemainingTimeDisplay}
						remainingTimeSeconds={redRemainingTimeSeconds}
						isActiveTurn={activeTurnSide === "red"}
						isOvertime={activeTurnSide === "red" && overtimeSeconds > 0}
						punishTime={redPunishTime}
					/>

					<div className="flex min-h-0 flex-1 flex-col">
						{isDraftCompleted ? (
							<SideAssignmentBoard
								side="red"
								slots={redAssignments}
								slotBuilds={redSlotBuilds}
								teamCosts={teamCosts.filter((item) => item.teamSide === 1)}
								chamberBaseTimes={redChamberBaseTimes}
								punishTimeSeconds={redPunishTime}
								teamPlayerCount={TEAM_PLAYER_COUNT}
								picksPerPlayer={PICKS_PER_PLAYER}
								playerOptions={playerOptions}
								defaultCost={redDefaultCost}
								canEdit={canEditRedAssignments}
								canReorder={canRedReorderAssignments}
								onDragStart={(dragSide, index) =>
									setDragging({ side: dragSide, index })
								}
								onDrop={onDropAssignment}
								onDragEnd={() => setDragging(null)}
								onUpdateSlotBuild={onUpdateSlotBuild}
								onUpdateTeamCost={onUpdateTeamCost}
								onUpdateChamberClearTime={onUpdateChamberClearTime}
								onSearchPlayers={setPlayerSearch}
							/>
						) : (
							<div className="flex min-h-0 flex-1 flex-col gap-4">
								<div className="rounded-xl border border-white/20 bg-white/5 p-4">
									<div className="mb-2 text-xs uppercase tracking-wider text-white/70">
										{tMatch(matchLocaleKeys.three_vs_three_bans_label)}
									</div>
									<div className="grid grid-cols-8 gap-2">
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
														"relative h-16 overflow-hidden rounded-md border border-gray-500/40 bg-gray-500/10",
														isActiveSlot && "animate-pulse border-yellow-400",
													)}
												>
													{character ? (
														<img
															src={character.imageUrl}
															alt={character.name}
															className={cn(
																"h-full w-full object-cover",
																"grayscale",
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
									onlyDisplayNames
								/>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
