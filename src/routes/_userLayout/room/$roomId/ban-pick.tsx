import BanPickActionPanel from "@/components/match/ban-pick-action-panel";
import BanPickSideSection from "@/components/match/ban-pick-side-section";
import {
	applyDraftActionToMatchState,
	DRAFT_SEQUENCE,
	EMPTY_SESSION_RECORD_INPUT,
	filterCharacters,
	getBanPickCharacterId,
	mapAccountCharacterToBanPickCharacter,
	mapCharacterNamesToAccountCharacters,
	mapDraftSideToPlayerSide,
	mapSelectedWeaponsByCharacterId,
	TURN_DURATION_SECONDS,
	validateSessionCompletionData,
} from "@/components/match/ban-pick.utils";
import { matchApi } from "@/apis/match";
import type { MatchResponse, MatchStateResponse } from "@/apis/match/types";
import { sessionCostApi } from "@/apis/session-cost";
import type { SessionCostResponse } from "@/apis/session-cost/types";
import { sessionRecordApi } from "@/apis/session-record";
import type { SaveSessionRecordInput } from "@/apis/session-record/types";
import type { AccountCharacterResponse } from "@/apis/account-characters/types";
import type { BanPickCharacter } from "@/components/match/ban-pick.types";
import type { BanPickTimerInputValues } from "@/components/match/ban-pick-timer-inputs";
import { MatchType, PlayerSide, MatchStatus } from "@/lib/constants";
import { SocketEvent } from "@/lib/constants";
import { selectAuthProfile } from "@/lib/redux/auth.slice";
import { useAppSelector } from "@/hooks/use-app-selector";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { useBanPickFilters } from "@/hooks/use-ban-pick-filters";
import { useBanPickQueries } from "@/hooks/use-ban-pick-queries";
import { useDebounce } from "@/hooks/use-debounce";
import { matchLocaleKeys } from "@/i18n/keys";
import {
	createFileRoute,
	useLoaderData,
	useRouter,
} from "@tanstack/react-router";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { socket } from "@/lib/socket";

dayjs.extend(customParseFormat);

export const Route = createFileRoute("/_userLayout/room/$roomId/ban-pick")({
	component: RouteComponent,
});

interface AccountDraftSideState {
	bans: AccountCharacterResponse[];
	picks: AccountCharacterResponse[];
}

interface AccountDraftState {
	blue: AccountDraftSideState;
	red: AccountDraftSideState;
}

interface BanPickTimerInputsBySide {
	blue: BanPickTimerInputValues;
	red: BanPickTimerInputValues;
}

interface MatchTimerInputsSyncPayload {
	timerInputs: BanPickTimerInputsBySide;
	updatedBy?: string;
}

const EMPTY_TIMER_SIDE_VALUES: BanPickTimerInputValues = {
	chamber1: "",
	chamber2: "",
	chamber3: "",
	reset: "",
};

const EMPTY_TIMER_INPUTS_BY_SIDE: BanPickTimerInputsBySide = {
	blue: EMPTY_TIMER_SIDE_VALUES,
	red: EMPTY_TIMER_SIDE_VALUES,
};

const EMPTY_DRAFT_STATE: AccountDraftState = {
	blue: { bans: [], picks: [] },
	red: { bans: [], picks: [] },
};

const formatClockFromSeconds = (value: number) => {
	const normalized = Number.isFinite(value)
		? Math.max(0, Math.floor(value))
		: 0;
	const minutes = Math.floor(normalized / 60);
	const seconds = normalized % 60;
	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const parseClockToSecondsStrict = (value: string) => {
	const normalized = value.trim();
	if (!normalized) {
		return {
			value: 0,
			error: "Time is required in mm:ss format.",
		};
	}

	const parsed = dayjs(normalized, "mm:ss", true);
	if (!parsed.isValid()) {
		return {
			value: 0,
			error: "Time must be in mm:ss format.",
		};
	}

	return {
		value: parsed.minute() * 60 + parsed.second(),
		error: null,
	};
};

const parseResetStrict = (value: string) => {
	const normalized = value.trim();
	if (!normalized) {
		return {
			value: 0,
			error: null,
		};
	}

	if (!/^\d+$/.test(normalized)) {
		return {
			value: 0,
			error: "Reset must be a non-negative integer.",
		};
	}

	return {
		value: Number(normalized),
		error: null,
	};
};

const mapDraftBanCharacters = (
	preferredCharacters: AccountCharacterResponse[],
	fallbackCharacters: AccountCharacterResponse[],
	characterIdsOrNames: string[],
) => {
	const preferredById = new Map(
		preferredCharacters.flatMap((character) => [
			[getBanPickCharacterId(character), character] as const,
			[character.id, character] as const,
		]),
	);
	const preferredByName = new Map(
		preferredCharacters.map((character) => [
			character.characters.name.toLowerCase(),
			character,
		]),
	);

	const fallbackById = new Map(
		fallbackCharacters.flatMap((character) => [
			[getBanPickCharacterId(character), character] as const,
			[character.id, character] as const,
		]),
	);
	const fallbackByName = new Map(
		fallbackCharacters.map((character) => [
			character.characters.name.toLowerCase(),
			character,
		]),
	);

	return characterIdsOrNames.flatMap((characterIdOrName) => {
		const normalizedValue = String(characterIdOrName).trim();
		if (!normalizedValue) {
			return [];
		}

		const mappedPreferred =
			preferredById.get(normalizedValue) ??
			preferredByName.get(normalizedValue.toLowerCase());
		if (mappedPreferred) {
			return [mappedPreferred];
		}

		const mappedFallback =
			fallbackById.get(normalizedValue) ??
			fallbackByName.get(normalizedValue.toLowerCase());
		if (mappedFallback) {
			return [mappedFallback];
		}

		return [];
	});
};

const parseTimerInputsToRecord = (
	timerInputs: BanPickTimerInputsBySide,
	isRealtimeMatch: boolean,
) => {
	const errors: string[] = [];

	const blueChamber1 = parseClockToSecondsStrict(timerInputs.blue.chamber1);
	if (blueChamber1.error) {
		errors.push(`Blue ${blueChamber1.error}`);
	}

	const redChamber1 = parseClockToSecondsStrict(timerInputs.red.chamber1);
	if (redChamber1.error) {
		errors.push(`Red ${redChamber1.error}`);
	}

	if (isRealtimeMatch) {
		return {
			record: {
				blueChamber1: blueChamber1.value,
				blueChamber2: 0,
				blueChamber3: 0,
				blueResetTimes: 0,
				blueFinalTime: blueChamber1.value,
				redChamber1: redChamber1.value,
				redChamber2: 0,
				redChamber3: 0,
				redResetTimes: 0,
				redFinalTime: redChamber1.value,
			},
			errors,
		};
	}

	const blueChamber2 = parseClockToSecondsStrict(timerInputs.blue.chamber2);
	if (blueChamber2.error) {
		errors.push(`Blue chamber 2 ${blueChamber2.error.toLowerCase()}`);
	}

	const blueChamber3 = parseClockToSecondsStrict(timerInputs.blue.chamber3);
	if (blueChamber3.error) {
		errors.push(`Blue chamber 3 ${blueChamber3.error.toLowerCase()}`);
	}

	const redChamber2 = parseClockToSecondsStrict(timerInputs.red.chamber2);
	if (redChamber2.error) {
		errors.push(`Red chamber 2 ${redChamber2.error.toLowerCase()}`);
	}

	const redChamber3 = parseClockToSecondsStrict(timerInputs.red.chamber3);
	if (redChamber3.error) {
		errors.push(`Red chamber 3 ${redChamber3.error.toLowerCase()}`);
	}

	const blueReset = parseResetStrict(timerInputs.blue.reset);
	if (blueReset.error) {
		errors.push(`Blue ${blueReset.error}`);
	}

	const redReset = parseResetStrict(timerInputs.red.reset);
	if (redReset.error) {
		errors.push(`Red ${redReset.error}`);
	}

	return {
		record: {
			blueChamber1: blueChamber1.value,
			blueChamber2: blueChamber2.value,
			blueChamber3: blueChamber3.value,
			blueResetTimes: blueReset.value,
			blueFinalTime:
				blueChamber1.value + blueChamber2.value + blueChamber3.value,
			redChamber1: redChamber1.value,
			redChamber2: redChamber2.value,
			redChamber3: redChamber3.value,
			redResetTimes: redReset.value,
			redFinalTime: redChamber1.value + redChamber2.value + redChamber3.value,
		},
		errors,
	};
};

const parseClockToSecondsForAutosave = (value: string) => {
	const normalized = value.trim();
	if (!normalized) {
		return {
			value: 0,
			error: null,
		};
	}

	const parsed = dayjs(normalized, "mm:ss", true);
	if (!parsed.isValid()) {
		return {
			value: 0,
			error: "invalid",
		};
	}

	return {
		value: parsed.minute() * 60 + parsed.second(),
		error: null,
	};
};

const parseResetForAutosave = (value: string) => {
	const normalized = value.trim();
	if (!normalized) {
		return {
			value: 0,
			error: null,
		};
	}

	if (!/^\d+$/.test(normalized)) {
		return {
			value: 0,
			error: "invalid",
		};
	}

	return {
		value: Number(normalized),
		error: null,
	};
};

const parseTimerInputsToRecordForAutosave = (
	timerInputs: BanPickTimerInputsBySide,
	isRealtimeMatch: boolean,
) => {
	const blueChamber1 = parseClockToSecondsForAutosave(timerInputs.blue.chamber1);
	const redChamber1 = parseClockToSecondsForAutosave(timerInputs.red.chamber1);

	if (blueChamber1.error || redChamber1.error) {
		return null;
	}

	if (isRealtimeMatch) {
		return {
			blueChamber1: blueChamber1.value,
			blueChamber2: 0,
			blueChamber3: 0,
			blueResetTimes: 0,
			blueFinalTime: blueChamber1.value,
			redChamber1: redChamber1.value,
			redChamber2: 0,
			redChamber3: 0,
			redResetTimes: 0,
			redFinalTime: redChamber1.value,
		} satisfies SaveSessionRecordInput;
	}

	const blueChamber2 = parseClockToSecondsForAutosave(timerInputs.blue.chamber2);
	const blueChamber3 = parseClockToSecondsForAutosave(timerInputs.blue.chamber3);
	const redChamber2 = parseClockToSecondsForAutosave(timerInputs.red.chamber2);
	const redChamber3 = parseClockToSecondsForAutosave(timerInputs.red.chamber3);
	const blueReset = parseResetForAutosave(timerInputs.blue.reset);
	const redReset = parseResetForAutosave(timerInputs.red.reset);

	if (
		blueChamber2.error ||
		blueChamber3.error ||
		redChamber2.error ||
		redChamber3.error ||
		blueReset.error ||
		redReset.error
	) {
		return null;
	}

	return {
		blueChamber1: blueChamber1.value,
		blueChamber2: blueChamber2.value,
		blueChamber3: blueChamber3.value,
		blueResetTimes: blueReset.value,
		blueFinalTime: blueChamber1.value + blueChamber2.value + blueChamber3.value,
		redChamber1: redChamber1.value,
		redChamber2: redChamber2.value,
		redChamber3: redChamber3.value,
		redResetTimes: redReset.value,
		redFinalTime: redChamber1.value + redChamber2.value + redChamber3.value,
	} satisfies SaveSessionRecordInput;
};

function RouteComponent() {
	const { t } = useTranslation("match");
	const { roomId } = Route.useParams();
	const { match: initialMatch, matchState } = useLoaderData({
		from: "/_userLayout/room/$roomId",
	});
	const router = useRouter();
	const profile = useAppSelector(selectAuthProfile);
	const [match, setMatch] = useState<MatchResponse | undefined>(initialMatch);
	const bluePlayer = match?.bluePlayer;
	const redPlayer = match?.redPlayer;
	const isRealtimeMatch = match?.type === MatchType.REALTIME;
	const canReorderBlueTeam = profile?.id === bluePlayer?.id;
	const canReorderRedTeam = profile?.id === redPlayer?.id;

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
	const [turnRemainingSeconds, setTurnRemainingSeconds] = useState(
		TURN_DURATION_SECONDS,
	);
	const [pendingCharacter, setPendingCharacter] =
		useState<AccountCharacterResponse | null>(null);
	const [isSubmittingTurnAction, setIsSubmittingTurnAction] = useState(false);
	const [pageMatchState, setPageMatchState] = useState<
		MatchStateResponse | undefined
	>(matchState);
	const [sessionCost, setSessionCost] = useState<SessionCostResponse | null>(
		null,
	);
	const [timerInputs, setTimerInputs] = useState<BanPickTimerInputsBySide>(
		EMPTY_TIMER_INPUTS_BY_SIDE,
	);
	const isApplyingRemoteTimerSyncRef = useRef(false);
	const [
		blueSelectedWeaponRefinementByCharacterIdLocal,
		setBlueSelectedWeaponRefinementByCharacterIdLocal,
	] = useState<Record<string, number | undefined>>({});
	const [
		redSelectedWeaponRefinementByCharacterIdLocal,
		setRedSelectedWeaponRefinementByCharacterIdLocal,
	] = useState<Record<string, number | undefined>>({});
	const autoResolvedStepRef = useRef<number | null>(null);
	const lastCalculatedTurnRef = useRef<string | null>(null);
	const initializedSessionIdRef = useRef<number | null>(
		Number.isInteger(Number(matchState?.currentSession))
			? Number(matchState?.currentSession)
			: null,
	);
	const hydrationRequestIdRef = useRef(0);
	const sessionRecordInputRef = useRef<SaveSessionRecordInput>(
		EMPTY_SESSION_RECORD_INPUT,
	);

	const onTimerValuesChange = useCallback(
		(side: "blue" | "red", values: BanPickTimerInputValues) => {
			setTimerInputs((prev) => {
				const previousSideValues = prev[side];
				if (
					previousSideValues.chamber1 === values.chamber1 &&
					previousSideValues.chamber2 === values.chamber2 &&
					previousSideValues.chamber3 === values.chamber3 &&
					previousSideValues.reset === values.reset
				) {
					return prev;
				}

				return {
					...prev,
					[side]: values,
				};
			});
		},
		[],
	);

	const emitTimerInputsSyncDebounced = useDebounce(
		(nextTimerInputs: BanPickTimerInputsBySide) => {
			socket.emit(SocketEvent.UPDATE_MATCH_TIMER_INPUTS, {
				matchId: roomId,
				timerInputs: nextTimerInputs,
				updatedBy: profile?.id,
			});

			const record = parseTimerInputsToRecordForAutosave(
				nextTimerInputs,
				isRealtimeMatch,
			);
			if (!record) {
				return;
			}

			const matchSessionId = Number(pageMatchState?.currentSession);
			if (!Number.isInteger(matchSessionId) || matchSessionId <= 0) {
				return;
			}

			socket.emit(SocketEvent.SAVE_MATCH_TIMER_INPUTS, {
				matchId: roomId,
				matchSessionId,
				record,
			});
		},
		350,
	);

	const navigateByMatchStatus = useCallback(
		(status?: number) => {
			switch (status) {
				case MatchStatus.COMPLETED:
					void router.navigate({
						to: "/room/$roomId/result",
						params: { roomId },
					});
					return;
				case MatchStatus.LIVE:
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
		},
		[profile?.id, roomId, router],
	);

	useSocketEvent(SocketEvent.UPDATE_MATCH_STATE, (data: MatchStateResponse) => {
		setPageMatchState(data);
	});

	useSocketEvent(SocketEvent.MATCH_UPDATED, (data?: MatchResponse) => {
		if (data) {
			setMatch(data);
		}

		navigateByMatchStatus(data?.status);
	});

	useSocketEvent(SocketEvent.UPDATE_MATCH_SESSION, () => {
		void (async () => {
			try {
				if (match?.id) {
					const currentSessionCost =
						await sessionCostApi.getCurrentSessionCost(match.id);
					setSessionCost(currentSessionCost.data ?? null);

					const latestMatchState = await matchApi.getMatchState(match.id);
					if (latestMatchState.data) {
						setPageMatchState(latestMatchState.data);
					}
				}

				const response = await matchApi.getMatch(roomId);
				if (response.data) {
					setMatch(response.data);
				}
				navigateByMatchStatus(response.data?.status);
			} catch {
				// Session update navigation is best-effort.
			}
		})();
	});

	useSocketEvent(
		SocketEvent.UPDATE_MATCH_TIMER_INPUTS,
		(payload?: MatchTimerInputsSyncPayload) => {
			if (!payload?.timerInputs) {
				return;
			}

			if (payload.updatedBy && payload.updatedBy === profile?.id) {
				return;
			}

			isApplyingRemoteTimerSyncRef.current = true;
			setTimerInputs(payload.timerInputs);
		},
	);

	useEffect(() => {
		if (isApplyingRemoteTimerSyncRef.current) {
			isApplyingRemoteTimerSyncRef.current = false;
			return;
		}

		emitTimerInputsSyncDebounced(timerInputs);
	}, [emitTimerInputsSyncDebounced, timerInputs]);

	useEffect(() => {
		setMatch(initialMatch);
	}, [initialMatch]);

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

		navigateByMatchStatus(match.status);
	}, [match, navigateByMatchStatus, profile?.id, router]);

	const { blueCharacters, redCharacters, weapons } = useBanPickQueries({
		bluePlayerId: bluePlayer?.id,
		redPlayerId: redPlayer?.id,
	});
	const allMatchCharacters = useMemo(
		() => [...blueCharacters, ...redCharacters],
		[blueCharacters, redCharacters],
	);

	const draftState = useMemo<AccountDraftState>(() => {
		if (!pageMatchState) {
			return EMPTY_DRAFT_STATE;
		}

		return {
			blue: {
				bans: mapDraftBanCharacters(
					blueCharacters,
					allMatchCharacters,
					pageMatchState.blueBanChars,
				),
				picks: mapCharacterNamesToAccountCharacters(
					blueCharacters,
					pageMatchState.blueSelectedChars,
				),
			},
			red: {
				bans: mapDraftBanCharacters(
					redCharacters,
					allMatchCharacters,
					pageMatchState.redBanChars,
				),
				picks: mapCharacterNamesToAccountCharacters(
					redCharacters,
					pageMatchState.redSelectedChars,
				),
			},
		};
	}, [allMatchCharacters, blueCharacters, pageMatchState, redCharacters]);

	const draftStep = useMemo(() => {
		if (!pageMatchState) {
			return 0;
		}

		return Math.min(
			pageMatchState.blueBanChars.length +
				pageMatchState.blueSelectedChars.length +
				pageMatchState.redBanChars.length +
				pageMatchState.redSelectedChars.length,
			DRAFT_SEQUENCE.length,
		);
	}, [pageMatchState]);

	const currentAction =
		draftStep < DRAFT_SEQUENCE.length ? DRAFT_SEQUENCE[draftStep] : undefined;

	const isDraftCompleted = draftStep >= DRAFT_SEQUENCE.length;

	const formattedTurnCountdown = useMemo(() => {
		const totalSeconds = isDraftCompleted ? 0 : turnRemainingSeconds;
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;

		return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
	}, [isDraftCompleted, turnRemainingSeconds]);

	const isCurrentUserTurn = useMemo(() => {
		if (isDraftCompleted || !profile?.id || !currentAction) {
			return false;
		}

		const expectedTurn = mapDraftSideToPlayerSide(currentAction.side);

		if (profile.id === bluePlayer?.id) {
			return expectedTurn === PlayerSide.BLUE;
		}

		if (profile.id === redPlayer?.id) {
			return expectedTurn === PlayerSide.RED;
		}

		return false;
	}, [
		bluePlayer?.id,
		currentAction,
		isDraftCompleted,
		profile?.id,
		redPlayer?.id,
	]);

	const selectedCharacterNames = useMemo(() => {
		const selected = new Set<string>();

		[
			...draftState.blue.bans,
			...draftState.blue.picks,
			...draftState.red.bans,
			...draftState.red.picks,
		].forEach((character) => selected.add(character.characters.name));

		return selected;
	}, [draftState]);

	const selectedCharacterIds = useMemo(() => {
		const selected = new Set<string>();

		[
			...draftState.blue.bans,
			...draftState.blue.picks,
			...draftState.red.bans,
			...draftState.red.picks,
		].forEach((character) => selected.add(getBanPickCharacterId(character)));

		return selected;
	}, [draftState]);

	const leftFilteredCharacters = useMemo(
		() =>
			filterCharacters(
				blueCharacters,
				leftSearch,
				leftElementFilter,
				leftRarityFilter,
			),
		[blueCharacters, leftSearch, leftElementFilter, leftRarityFilter],
	);

	const rightFilteredCharacters = useMemo(
		() =>
			filterCharacters(
				redCharacters,
				rightSearch,
				rightElementFilter,
				rightRarityFilter,
			),
		[redCharacters, rightSearch, rightElementFilter, rightRarityFilter],
	);

	const leftFilteredBanPickCharacters = useMemo(
		() => leftFilteredCharacters.map(mapAccountCharacterToBanPickCharacter),
		[leftFilteredCharacters],
	);

	const rightFilteredBanPickCharacters = useMemo(
		() => rightFilteredCharacters.map(mapAccountCharacterToBanPickCharacter),
		[rightFilteredCharacters],
	);

	const blueBanPickBans = useMemo(
		() => draftState.blue.bans.map(mapAccountCharacterToBanPickCharacter),
		[draftState.blue.bans],
	);

	const blueBanPickPicks = useMemo(
		() => draftState.blue.picks.map(mapAccountCharacterToBanPickCharacter),
		[draftState.blue.picks],
	);

	const redBanPickBans = useMemo(
		() => draftState.red.bans.map(mapAccountCharacterToBanPickCharacter),
		[draftState.red.bans],
	);

	const redBanPickPicks = useMemo(
		() => draftState.red.picks.map(mapAccountCharacterToBanPickCharacter),
		[draftState.red.picks],
	);

	const blueSelectedWeaponByCharacterId = useMemo(
		() =>
			pageMatchState
				? mapSelectedWeaponsByCharacterId(
						draftState.blue.picks,
						pageMatchState.blueSelectedWeapons,
					)
				: {},
		[draftState.blue.picks, pageMatchState],
	);

	const redSelectedWeaponByCharacterId = useMemo(
		() =>
			pageMatchState
				? mapSelectedWeaponsByCharacterId(
						draftState.red.picks,
						pageMatchState.redSelectedWeapons,
					)
				: {},
		[draftState.red.picks, pageMatchState],
	);

	const blueSelectedWeaponRefinementByCharacterIdFromState = useMemo(
		() => {
			if (!pageMatchState) {
				return {} as Record<string, number | undefined>;
			}

			const refinements = pageMatchState.blueSelectedWeaponRefinements ?? [];
			const mapped: Record<string, number | undefined> = {};

			draftState.blue.picks.forEach((character, index) => {
				const refinement = refinements[index];
				if (typeof refinement === "number" && refinement > 0) {
					mapped[getBanPickCharacterId(character)] = refinement;
				}
			});

			return mapped;
		},
		[draftState.blue.picks, pageMatchState],
	);

	const redSelectedWeaponRefinementByCharacterIdFromState = useMemo(
		() => {
			if (!pageMatchState) {
				return {} as Record<string, number | undefined>;
			}

			const refinements = pageMatchState.redSelectedWeaponRefinements ?? [];
			const mapped: Record<string, number | undefined> = {};

			draftState.red.picks.forEach((character, index) => {
				const refinement = refinements[index];
				if (typeof refinement === "number" && refinement > 0) {
					mapped[getBanPickCharacterId(character)] = refinement;
				}
			});

			return mapped;
		},
		[draftState.red.picks, pageMatchState],
	);

	const blueSelectedWeaponRefinementByCharacterId = useMemo(
		() => ({
			...blueSelectedWeaponRefinementByCharacterIdFromState,
			...blueSelectedWeaponRefinementByCharacterIdLocal,
		}),
		[
			blueSelectedWeaponRefinementByCharacterIdFromState,
			blueSelectedWeaponRefinementByCharacterIdLocal,
		],
	);

	const redSelectedWeaponRefinementByCharacterId = useMemo(
		() => ({
			...redSelectedWeaponRefinementByCharacterIdFromState,
			...redSelectedWeaponRefinementByCharacterIdLocal,
		}),
		[
			redSelectedWeaponRefinementByCharacterIdFromState,
			redSelectedWeaponRefinementByCharacterIdLocal,
		],
	);

	const pendingBanPickCharacter = useMemo(
		() =>
			pendingCharacter
				? mapAccountCharacterToBanPickCharacter(pendingCharacter)
				: null,
		[pendingCharacter],
	);

	const blueSideCost = useMemo(
		() => ({
			totalCost: sessionCost?.blueTotalCost,
			milestoneCost: sessionCost?.blueCostMilestone,
			constellationCost: sessionCost?.blueConstellationCost,
			refinementCost: sessionCost?.blueRefinementCost,
			levelCost: sessionCost?.blueLevelCost,
			timeBonusCost: sessionCost?.blueTimeBonusCost,
		}),
		[sessionCost],
	);

	const redSideCost = useMemo(
		() => ({
			totalCost: sessionCost?.redTotalCost,
			milestoneCost: sessionCost?.redCostMilestone,
			constellationCost: sessionCost?.redConstellationCost,
			refinementCost: sessionCost?.redRefinementCost,
			levelCost: sessionCost?.redLevelCost,
			timeBonusCost: sessionCost?.redTimeBonusCost,
		}),
		[sessionCost],
	);

	const leadComparison = useMemo(() => {
		const parsedRecord = parseTimerInputsToRecordForAutosave(
			timerInputs,
			isRealtimeMatch,
		);

		const toChamberScore = (chamberSeconds: number) => {
			const normalizedSeconds = Number.isFinite(chamberSeconds)
				? Math.max(0, chamberSeconds)
				: 0;
			const chamberTimeInMinutes = normalizedSeconds / 60;
			return Math.max(0, Math.floor(600 - chamberTimeInMinutes * 60));
		};

		const blueChamberScoreTotal =
			toChamberScore(parsedRecord?.blueChamber1 ?? 0) +
			toChamberScore(parsedRecord?.blueChamber2 ?? 0) +
			toChamberScore(parsedRecord?.blueChamber3 ?? 0);

		const redChamberScoreTotal =
			toChamberScore(parsedRecord?.redChamber1 ?? 0) +
			toChamberScore(parsedRecord?.redChamber2 ?? 0) +
			toChamberScore(parsedRecord?.redChamber3 ?? 0);

		const blueTimeBonusCost = Math.max(
			0,
			Math.floor(Number(sessionCost?.blueTimeBonusCost ?? 0)),
		);
		const redTimeBonusCost = Math.max(
			0,
			Math.floor(Number(sessionCost?.redTimeBonusCost ?? 0)),
		);

		const blueTotalComparableSeconds =
			blueTimeBonusCost + blueChamberScoreTotal;
		const redTotalComparableSeconds =
			redTimeBonusCost + redChamberScoreTotal;

		let leadingSide: "blue" | "red" | null = null;
		if (blueTotalComparableSeconds > redTotalComparableSeconds) {
			leadingSide = "blue";
		} else if (redTotalComparableSeconds > blueTotalComparableSeconds) {
			leadingSide = "red";
		}

		return {
			blueTotalComparableSeconds,
			redTotalComparableSeconds,
			leadingSide,
		};
	}, [isRealtimeMatch, sessionCost?.blueTimeBonusCost, sessionCost?.redTimeBonusCost, timerInputs]);

	const getAvailableCharactersForAction = useCallback(() => {
		if (!currentAction) {
			return [] as AccountCharacterResponse[];
		}

		const openedListCharacters =
			currentAction.side === "blue"
				? leftFilteredCharacters
				: rightFilteredCharacters;

		const availableOpenedListCharacters = openedListCharacters.filter(
			(character) =>
				!selectedCharacterIds.has(getBanPickCharacterId(character)),
		);

		if (availableOpenedListCharacters.length > 0) {
			return availableOpenedListCharacters;
		}

		const fallbackCharacters =
			currentAction.side === "blue" ? blueCharacters : redCharacters;

		return fallbackCharacters.filter(
			(character) =>
				!selectedCharacterIds.has(getBanPickCharacterId(character)),
		);
	}, [
		blueCharacters,
		currentAction,
		leftFilteredCharacters,
		redCharacters,
		rightFilteredCharacters,
		selectedCharacterIds,
	]);

	const onSelectCharacter = (character: AccountCharacterResponse) => {
		if (
			!currentAction ||
			selectedCharacterIds.has(getBanPickCharacterId(character))
		) {
			return;
		}

		setPendingCharacter(character);
	};

	const onConfirmCharacter = async () => {
		if (!pendingCharacter || !currentAction || !match?.id) {
			return;
		}

		if (isSubmittingTurnAction) {
			return;
		}

		const characterId = getBanPickCharacterId(pendingCharacter);
		const nextAction = DRAFT_SEQUENCE[draftStep + 1];
		const ensuredNextTurn = nextAction
			? mapDraftSideToPlayerSide(nextAction.side)
			: undefined;
		const previousMatchState = pageMatchState;

		setPendingCharacter(null);
		setPageMatchState((prev) => {
			if (!prev) {
				return prev;
			}

			return applyDraftActionToMatchState(
				prev,
				currentAction,
				characterId,
				ensuredNextTurn,
			);
		});
		setIsSubmittingTurnAction(true);

		try {
			if (currentAction.type === "ban") {
				await matchApi.banChar(match.id, characterId);
			} else {
				await matchApi.pickChar(match.id, characterId);
			}
		} catch {
			setPageMatchState(previousMatchState);
			toast.error(t(matchLocaleKeys.ban_pick_failed_submit_turn));
		} finally {
			setIsSubmittingTurnAction(false);
		}
	};

	const onPickBlueWeapon = async (
		character: BanPickCharacter,
		weaponId: number,
		weaponRefinement: number,
	) => {
		if (!match?.id) {
			return;
		}

		if (profile?.id !== bluePlayer?.id) {
			return;
		}

		try {
			const isUnequip = weaponId <= 0;
			await matchApi.pickWeapon(
				match.id,
				character.id,
				String(weaponId),
				weaponRefinement,
			);

			const matchSessionId = Number(pageMatchState?.currentSession);
			if (!Number.isInteger(matchSessionId) || matchSessionId <= 0) {
				return;
			}

			const pickedWeapon = weapons.find((weapon) => weapon.id === weaponId);
			const response = await sessionCostApi.calculateSessionCost(
				matchSessionId,
				{
					characterId: Number(character.id),
					activatedConstellation: character.constellation,
					characterLevel: character.level,
					...(isUnequip
						? {}
						: {
								weaponId,
								weaponRefinement,
								weaponRarity: pickedWeapon?.rarity,
						  }),
					side: PlayerSide.BLUE,
				},
			);

			if (response.data) {
				setSessionCost(response.data);
				setBlueSelectedWeaponRefinementByCharacterIdLocal((prev) => ({
					...prev,
					[character.id]: isUnequip ? undefined : weaponRefinement,
				}));
			}
		} catch {
			toast.error(
				t(matchLocaleKeys.ban_pick_failed_pick_weapon, {
					characterName: character.name,
				}),
			);
			throw new Error("Failed to pick weapon");
		}
	};

	const onPickRedWeapon = async (
		character: BanPickCharacter,
		weaponId: number,
		weaponRefinement: number,
	) => {
		if (!match?.id) {
			return;
		}

		if (profile?.id !== redPlayer?.id) {
			return;
		}

		try {
			const isUnequip = weaponId <= 0;
			await matchApi.pickWeapon(
				match.id,
				character.id,
				String(weaponId),
				weaponRefinement,
			);

			const matchSessionId = Number(pageMatchState?.currentSession);
			if (!Number.isInteger(matchSessionId) || matchSessionId <= 0) {
				return;
			}

			const pickedWeapon = weapons.find((weapon) => weapon.id === weaponId);
			const response = await sessionCostApi.calculateSessionCost(
				matchSessionId,
				{
					characterId: Number(character.id),
					activatedConstellation: character.constellation,
					characterLevel: character.level,
					...(isUnequip
						? {}
						: {
								weaponId,
								weaponRefinement,
								weaponRarity: pickedWeapon?.rarity,
						  }),
					side: PlayerSide.RED,
				},
			);

			if (response.data) {
				setSessionCost(response.data);
				setRedSelectedWeaponRefinementByCharacterIdLocal((prev) => ({
					...prev,
					[character.id]: isUnequip ? undefined : weaponRefinement,
				}));
			}
		} catch {
			toast.error(
				t(matchLocaleKeys.ban_pick_failed_pick_weapon, {
					characterName: character.name,
				}),
			);
			throw new Error("Failed to pick weapon");
		}
	};

	useEffect(() => {
		setPageMatchState(matchState);

		const incomingSessionId = Number(matchState?.currentSession);
		const normalizedIncomingSessionId =
			Number.isInteger(incomingSessionId) && incomingSessionId > 0
				? incomingSessionId
				: null;

		if (initializedSessionIdRef.current === normalizedIncomingSessionId) {
			return;
		}

		initializedSessionIdRef.current = normalizedIncomingSessionId;
		setSessionCost(null);
		setBlueSelectedWeaponRefinementByCharacterIdLocal({});
		setRedSelectedWeaponRefinementByCharacterIdLocal({});
		setTimerInputs(EMPTY_TIMER_INPUTS_BY_SIDE);
		sessionRecordInputRef.current = EMPTY_SESSION_RECORD_INPUT;
		lastCalculatedTurnRef.current = null;
	}, [matchState]);

	useEffect(() => {
		if (!match?.id || !pageMatchState?.currentSession) {
			return;
		}

		const currentSessionId = Number(pageMatchState.currentSession);
		if (!Number.isInteger(currentSessionId) || currentSessionId <= 0) {
			return;
		}

		let isCancelled = false;
		const requestId = hydrationRequestIdRef.current + 1;
		hydrationRequestIdRef.current = requestId;

		void (async () => {
			try {
				const response = await sessionRecordApi.getMatchReport(match.id);
				const session = response.data?.sessions?.find(
					(item) => item.matchSessionId === currentSessionId,
				);
				const record = session?.record;

				if (isCancelled || requestId !== hydrationRequestIdRef.current) {
					return;
				}

				if (!record) {
					setTimerInputs(EMPTY_TIMER_INPUTS_BY_SIDE);
					return;
				}

				setTimerInputs({
					blue: {
						chamber1: formatClockFromSeconds(record.blueChamber1),
						chamber2: isRealtimeMatch
							? ""
							: formatClockFromSeconds(record.blueChamber2),
						chamber3: isRealtimeMatch
							? ""
							: formatClockFromSeconds(record.blueChamber3),
						reset: isRealtimeMatch ? "" : String(record.blueResetTimes),
					},
					red: {
						chamber1: formatClockFromSeconds(record.redChamber1),
						chamber2: isRealtimeMatch
							? ""
							: formatClockFromSeconds(record.redChamber2),
						chamber3: isRealtimeMatch
							? ""
							: formatClockFromSeconds(record.redChamber3),
						reset: isRealtimeMatch ? "" : String(record.redResetTimes),
					},
				});
			} catch {
				if (!isCancelled && requestId === hydrationRequestIdRef.current) {
					setTimerInputs(EMPTY_TIMER_INPUTS_BY_SIDE);
				}
			}
		})();

		return () => {
			isCancelled = true;
		};
	}, [isRealtimeMatch, match?.id, pageMatchState?.currentSession]);

	useEffect(() => {
		if (!match?.id || !pageMatchState) {
			return;
		}

		const matchSessionId = Number(pageMatchState.currentSession);
		if (!Number.isInteger(matchSessionId) || matchSessionId <= 0) {
			setSessionCost(null);
			return;
		}

		let isCancelled = false;

		void (async () => {
			try {
				const response = await sessionCostApi.getCurrentSessionCost(match.id);
				if (!isCancelled) {
					setSessionCost(response.data ?? null);
				}
			} catch {
				if (!isCancelled) {
					setSessionCost(null);
				}
			}
		})();

		return () => {
			isCancelled = true;
		};
	}, [
		match?.id,
		pageMatchState?.currentSession,
		pageMatchState?.blueSelectedWeapons,
		pageMatchState?.redSelectedWeapons,
	]);

	useEffect(() => {
		if (!pageMatchState) {
			return;
		}

		const matchSessionId = Number(pageMatchState.currentSession);
		if (!Number.isInteger(matchSessionId) || matchSessionId <= 0) {
			return;
		}

		const completedTurn = draftStep - 1;
		if (completedTurn < 0) {
			return;
		}

		const latestAction = DRAFT_SEQUENCE[completedTurn];
		if (!latestAction) {
			return;
		}

		const latestCharacters =
			latestAction.type === "ban"
				? draftState[latestAction.side].bans
				: draftState[latestAction.side].picks;

		const latestCharacter = latestCharacters[latestCharacters.length - 1];
		if (!latestCharacter) {
			return;
		}

		const latestCharacterId = getBanPickCharacterId(latestCharacter);
		const lastCalculatedKey = [
			matchSessionId,
			completedTurn,
			latestAction.side,
			latestAction.type,
			latestCharacterId,
		].join(":");

		if (lastCalculatedTurnRef.current === lastCalculatedKey) {
			return;
		}

		// Reserve key before requesting to avoid duplicate calls from rapid state updates
		// (e.g. optimistic update + socket sync for the same turn).
		lastCalculatedTurnRef.current = lastCalculatedKey;

		const selectedWeaponId =
			latestAction.type === "pick"
				? latestAction.side === "blue"
					? blueSelectedWeaponByCharacterId[latestCharacterId]
					: redSelectedWeaponByCharacterId[latestCharacterId]
				: undefined;

		const selectedWeapon = selectedWeaponId
			? weapons.find((weapon) => weapon.id === selectedWeaponId)
			: undefined;

		const selectedWeaponRefinement =
			latestAction.type === "pick"
				? latestAction.side === "blue"
					? blueSelectedWeaponRefinementByCharacterId[latestCharacterId]
					: redSelectedWeaponRefinementByCharacterId[latestCharacterId]
				: undefined;

		void (async () => {
			try {
				const response = await sessionCostApi.calculateSessionCost(
					matchSessionId,
					{
						characterId: latestCharacter.characterId,
						activatedConstellation: latestCharacter.activatedConstellation,
						characterLevel: latestCharacter.characterLevel,
						weaponId: selectedWeapon?.id,
						weaponRefinement:
							selectedWeaponRefinement ?? (selectedWeapon ? 1 : undefined),
						weaponRarity: selectedWeapon?.rarity,
						side: mapDraftSideToPlayerSide(latestAction.side),
						currentTurn: completedTurn,
					},
				);

				if (response.data) {
					setSessionCost(response.data);
				}
			} catch {
				if (lastCalculatedTurnRef.current === lastCalculatedKey) {
					lastCalculatedTurnRef.current = null;
				}
				// Cost calculation is best-effort and should not block draft flow.
			}
		})();
	}, [
		blueSelectedWeaponByCharacterId,
		blueSelectedWeaponRefinementByCharacterId,
		draftState,
		draftStep,
		isDraftCompleted,
		pageMatchState,
		redSelectedWeaponByCharacterId,
		redSelectedWeaponRefinementByCharacterId,
		weapons,
	]);

	useEffect(() => {
		if (isDraftCompleted) {
			return;
		}

		setTurnRemainingSeconds(TURN_DURATION_SECONDS);
	}, [draftStep, isDraftCompleted]);

	useEffect(() => {
		if (isDraftCompleted || turnRemainingSeconds <= 0 || !isCurrentUserTurn) {
			return;
		}

		const timeout = setTimeout(() => {
			setTurnRemainingSeconds((prev) => Math.max(0, prev - 1));
		}, 1000);

		return () => clearTimeout(timeout);
	}, [isCurrentUserTurn, isDraftCompleted, turnRemainingSeconds]);

	useEffect(() => {
		if (
			isDraftCompleted ||
			turnRemainingSeconds > 0 ||
			!currentAction ||
			!isCurrentUserTurn
		) {
			return;
		}

		if (autoResolvedStepRef.current === draftStep) {
			return;
		}

		autoResolvedStepRef.current = draftStep;

		const availableCharacters = getAvailableCharactersForAction();

		if (availableCharacters.length === 0) {
			toast.error(t(matchLocaleKeys.ban_pick_no_character_auto_pick));
			setTurnRemainingSeconds(TURN_DURATION_SECONDS);
			setPendingCharacter(null);
			autoResolvedStepRef.current = null;
			return;
		}

		const randomCharacter =
			availableCharacters[
				Math.floor(Math.random() * availableCharacters.length)
			];
		const randomCharacterId = getBanPickCharacterId(randomCharacter);
		const nextAction = DRAFT_SEQUENCE[draftStep + 1];
		const ensuredNextTurn = nextAction
			? mapDraftSideToPlayerSide(nextAction.side)
			: undefined;
		const previousMatchState = pageMatchState;

		if (isSubmittingTurnAction || !match?.id) {
			return;
		}

		setPageMatchState((prev) => {
			if (!prev) {
				return prev;
			}

			return applyDraftActionToMatchState(
				prev,
				currentAction,
				randomCharacterId,
				ensuredNextTurn,
			);
		});
		setIsSubmittingTurnAction(true);

		void (async () => {
			try {
				if (currentAction.type === "ban") {
					await matchApi.banChar(match.id, randomCharacterId);
				} else {
					await matchApi.pickChar(match.id, randomCharacterId);
				}

				setPendingCharacter(null);
				toast.info(
					t(matchLocaleKeys.ban_pick_auto_selected, {
						characterName: randomCharacter.characters.name,
					}),
				);
			} catch {
				setPageMatchState(previousMatchState);
				toast.error(t(matchLocaleKeys.ban_pick_failed_auto_submit));
				setTurnRemainingSeconds(TURN_DURATION_SECONDS);
				autoResolvedStepRef.current = null;
			} finally {
				setIsSubmittingTurnAction(false);
			}
		})();
	}, [
		currentAction,
		draftStep,
		getAvailableCharactersForAction,
		isDraftCompleted,
		isCurrentUserTurn,
		isSubmittingTurnAction,
		match?.id,
		turnRemainingSeconds,
	]);

	const handleSubmit = async () => {
		if (isDraftCompleted) {
			if (profile?.id !== match?.host?.id) return;
			if (!pageMatchState) {
				toast.error(t(matchLocaleKeys.ban_pick_match_state_unavailable));
				return;
			}

			const parsedTimer = parseTimerInputsToRecord(
				timerInputs,
				isRealtimeMatch,
			);

			if (parsedTimer.errors.length > 0) {
				toast.error(parsedTimer.errors[0]);
				return;
			}

			const record = parsedTimer.record;
			sessionRecordInputRef.current = record;
			const sessionValidationErrors = validateSessionCompletionData(
				pageMatchState,
				record,
				isRealtimeMatch,
			);
			if (sessionValidationErrors.length > 0) {
				toast.error(
					sessionValidationErrors[0] ??
						t(matchLocaleKeys.ban_pick_session_data_incomplete),
				);
				return;
			}

			try {
				setIsSubmittingTurnAction(true);
				const matchSessionId = Number(pageMatchState?.currentSession);
				if (Number.isInteger(matchSessionId) && matchSessionId > 0) {
					await sessionRecordApi.saveSessionRecord(matchSessionId, record);
				}
				if (match?.id) {
					await matchApi.completeSession(match.id);
					const refreshedMatchResponse = await matchApi.getMatch(match.id);
					const refreshedMatch = refreshedMatchResponse.data;
					if (refreshedMatch) {
						setMatch(refreshedMatch);
					}
					const reportResponse = await sessionRecordApi.getMatchReport(
						match.id,
					);
					const report = reportResponse.data;
					const completedSessionCount =
						report?.sessions?.filter((session) => session.sessionStatus === 2)
							.length ?? 0;
					const isReportFullyCompleted =
						Boolean(report) &&
						completedSessionCount >= (report?.sessionCount ?? 0);

					if (
						refreshedMatch?.status === MatchStatus.COMPLETED ||
						isReportFullyCompleted
					) {
						toast.success(
							t(matchLocaleKeys.ban_pick_session_completed_match_finished),
						);
						void router.navigate({
							to: "/room/$roomId/result",
							params: { roomId: match.id },
						});
					} else {
						toast.success(
							t(matchLocaleKeys.ban_pick_session_completed_next_started),
						);
						await router.invalidate();

						const latestMatchResponse = await matchApi.getMatch(match.id);
						if (latestMatchResponse.data) {
							setMatch(latestMatchResponse.data);
						}
					}
				}
			} catch {
				toast.error(t(matchLocaleKeys.ban_pick_failed_complete_session));
			} finally {
				setIsSubmittingTurnAction(false);
			}

			return;
		}

		await onConfirmCharacter();
	};

	return (
		<>
			<div className="min-h-screen max-w-screen overflow-hidden">
				<div className="grid grid-cols-7 h-dvh gap-4">
					<BanPickSideSection
						side="blue"
						player={bluePlayer}
						cost={blueSideCost}
						isRealtimeMatch={isRealtimeMatch}
						timerValues={timerInputs.blue}
						onTimerValuesChange={onTimerValuesChange}
						bans={blueBanPickBans}
						picks={blueBanPickPicks}
						currentAction={currentAction}
						isDraftCompleted={isDraftCompleted}
						pendingCharacter={pendingBanPickCharacter}
						canInteract={isCurrentUserTurn}
						search={leftSearch}
						onSearchChange={setLeftSearch}
						selectedElement={leftElementFilter}
						onSelectElement={setLeftElementFilter}
						selectedRarity={leftRarityFilter}
						onSelectRarity={setLeftRarityFilter}
						characters={leftFilteredBanPickCharacters}
						selectedCharacterNames={selectedCharacterNames}
						filteredCharacters={leftFilteredCharacters}
						onSelectCharacter={onSelectCharacter}
						weapons={weapons}
						canReorderTeam={canReorderBlueTeam}
						canPickWeapon={profile?.id === bluePlayer?.id}
						selectedWeaponByCharacterId={blueSelectedWeaponByCharacterId}
						selectedWeaponRefinementByCharacterId={blueSelectedWeaponRefinementByCharacterId}
						onPickWeapon={onPickBlueWeapon}
					/>

					<BanPickActionPanel
						formattedTurnCountdown={formattedTurnCountdown}
						isDraftCompleted={isDraftCompleted}
						draftStep={draftStep}
						draftSequenceLength={DRAFT_SEQUENCE.length}
						currentAction={currentAction}
						isSubmittingTurnAction={isSubmittingTurnAction}
						isButtonDisabled={
							isSubmittingTurnAction ||
							(isDraftCompleted
								? profile?.id !== match?.host?.id
								: !isCurrentUserTurn || !pendingCharacter)
						}
						blueTotalComparableSeconds={leadComparison.blueTotalComparableSeconds}
						redTotalComparableSeconds={leadComparison.redTotalComparableSeconds}
						leadingSide={leadComparison.leadingSide}
						onSubmit={handleSubmit}
					/>

					<BanPickSideSection
						side="red"
						player={redPlayer}
						cost={redSideCost}
						isRealtimeMatch={isRealtimeMatch}
						timerValues={timerInputs.red}
						onTimerValuesChange={onTimerValuesChange}
						bans={redBanPickBans}
						picks={redBanPickPicks}
						currentAction={currentAction}
						isDraftCompleted={isDraftCompleted}
						pendingCharacter={pendingBanPickCharacter}
						canInteract={isCurrentUserTurn}
						search={rightSearch}
						onSearchChange={setRightSearch}
						selectedElement={rightElementFilter}
						onSelectElement={setRightElementFilter}
						selectedRarity={rightRarityFilter}
						onSelectRarity={setRightRarityFilter}
						characters={rightFilteredBanPickCharacters}
						selectedCharacterNames={selectedCharacterNames}
						filteredCharacters={rightFilteredCharacters}
						onSelectCharacter={onSelectCharacter}
						weapons={weapons}
						canReorderTeam={canReorderRedTeam}
						canPickWeapon={profile?.id === redPlayer?.id}
						selectedWeaponByCharacterId={redSelectedWeaponByCharacterId}
						selectedWeaponRefinementByCharacterId={redSelectedWeaponRefinementByCharacterId}
						onPickWeapon={onPickRedWeapon}
					/>
				</div>
			</div>
		</>
	);
}
