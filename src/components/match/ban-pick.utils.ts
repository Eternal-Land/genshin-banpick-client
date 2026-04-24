import type { AccountCharacterResponse } from "@/apis/account-characters/types";
import type { MatchStateResponse } from "@/apis/match/types";
import type { SaveSessionRecordInput } from "@/apis/session-record/types";
import { PlayerSide, CharacterElementDetail } from "@/lib/constants";
import { ELEMENT_FILTER_ALL } from "@/components/match/ban-pick-element-filter";
import { RARITY_FILTER_ALL } from "@/components/match/ban-pick-rarity-filter";
import type {
	BanPickCharacter,
	DraftAction,
} from "@/components/match/ban-pick.types";

export const TURN_DURATION_SECONDS = 30;

export const DRAFT_SEQUENCE: DraftAction[] = [
	{ side: "blue", type: "ban" },
	{ side: "red", type: "ban" },
	{ side: "blue", type: "ban" },
	{ side: "red", type: "ban" },
	{ side: "blue", type: "pick" },
	{ side: "red", type: "pick" },
	{ side: "red", type: "pick" },
	{ side: "blue", type: "pick" },
	{ side: "blue", type: "pick" },
	{ side: "red", type: "pick" },
	{ side: "red", type: "pick" },
	{ side: "blue", type: "pick" },
	{ side: "red", type: "ban" },
	{ side: "blue", type: "ban" },
	{ side: "red", type: "pick" },
	{ side: "blue", type: "pick" },
	{ side: "blue", type: "pick" },
	{ side: "red", type: "pick" },
	{ side: "red", type: "pick" },
	{ side: "blue", type: "pick" },
	{ side: "blue", type: "pick" },
	{ side: "red", type: "pick" },
];

export const EMPTY_SESSION_RECORD_INPUT: SaveSessionRecordInput = {
	blueChamber1: 0,
	blueChamber2: 0,
	blueChamber3: 0,
	blueResetTimes: 0,
	blueFinalTime: 0,
	redChamber1: 0,
	redChamber2: 0,
	redChamber3: 0,
	redResetTimes: 0,
	redFinalTime: 0,
};

export const mapAccountCharacterToBanPickCharacter = (
	accountCharacter: AccountCharacterResponse,
): BanPickCharacter => ({
	id: accountCharacter.characterId.toString(),
	name: accountCharacter.characters.name,
	imageUrl: accountCharacter.characters.iconUrl,
	rarity: (accountCharacter.characters.rarity === 5 ? 5 : 4) as 4 | 5,
	level: accountCharacter.characterLevel,
	constellation: accountCharacter.activatedConstellation,
	cost: accountCharacter.characterCost,
	element: accountCharacter.characters.element,
	weaponType: accountCharacter.characters.weaponType,
});

export const getBanPickCharacterId = (character: AccountCharacterResponse) =>
	character.characterId.toString();

export const mapDraftSideToPlayerSide = (side: DraftAction["side"]) =>
	side === "blue" ? PlayerSide.BLUE : PlayerSide.RED;

export function applyDraftActionToMatchState(
	prevState: MatchStateResponse,
	action: DraftAction,
	characterId: string,
	nextTurn?: MatchStateResponse["currentTurn"],
): MatchStateResponse {
	const nextState: MatchStateResponse = {
		...prevState,
		blueBanChars: [...prevState.blueBanChars],
		redBanChars: [...prevState.redBanChars],
		blueSelectedChars: [...prevState.blueSelectedChars],
		redSelectedChars: [...prevState.redSelectedChars],
	};

	if (action.type === "ban") {
		if (action.side === "blue") {
			nextState.blueBanChars.push(characterId);
		} else {
			nextState.redBanChars.push(characterId);
		}
	} else if (action.side === "blue") {
		nextState.blueSelectedChars.push(characterId);
	} else {
		nextState.redSelectedChars.push(characterId);
	}

	if (nextTurn !== undefined) {
		nextState.currentTurn = nextTurn;
	}

	return nextState;
}

export function mapSelectedWeaponsByCharacterId(
	picks: AccountCharacterResponse[],
	weaponIds: string[],
) {
	const selectedByCharacterId: Record<string, number | undefined> = {};

	picks.forEach((character, index) => {
		const rawWeaponId = weaponIds[index];
		if (!rawWeaponId) {
			return;
		}

		const weaponId = Number(rawWeaponId);
		if (!Number.isInteger(weaponId) || weaponId <= 0) {
			return;
		}

		selectedByCharacterId[getBanPickCharacterId(character)] = weaponId;
	});

	return selectedByCharacterId;
}

export function getExpectedDraftCounts() {
	return DRAFT_SEQUENCE.reduce(
		(acc, action) => {
			if (action.side === "blue") {
				if (action.type === "ban") {
					acc.blueBanCount += 1;
				} else {
					acc.bluePickCount += 1;
				}
			} else if (action.type === "ban") {
				acc.redBanCount += 1;
			} else {
				acc.redPickCount += 1;
			}

			return acc;
		},
		{
			blueBanCount: 0,
			bluePickCount: 0,
			redBanCount: 0,
			redPickCount: 0,
		},
	);
}

export function validateSessionCompletionData(
	matchState: MatchStateResponse,
	record: SaveSessionRecordInput,
	isRealtimeMatch: boolean,
) {
	const validationErrors: string[] = [];
	const expectedDraftCounts = getExpectedDraftCounts();

	if (matchState.blueBanChars.length !== expectedDraftCounts.blueBanCount) {
		validationErrors.push("Blue ban phase is not completed.");
	}

	if (matchState.redBanChars.length !== expectedDraftCounts.redBanCount) {
		validationErrors.push("Red ban phase is not completed.");
	}

	if (
		matchState.blueSelectedChars.length !== expectedDraftCounts.bluePickCount
	) {
		validationErrors.push("Blue pick phase is not completed.");
	}

	if (matchState.redSelectedChars.length !== expectedDraftCounts.redPickCount) {
		validationErrors.push("Red pick phase is not completed.");
	}

	if (isRealtimeMatch) {
		if (record.blueChamber1 <= 0) {
			validationErrors.push(
				"Blue time must be greater than 0 for realtime match.",
			);
		}

		if (record.redChamber1 <= 0) {
			validationErrors.push(
				"Red time must be greater than 0 for realtime match.",
			);
		}

		if (
			record.blueChamber2 !== 0 ||
			record.blueChamber3 !== 0 ||
			record.blueResetTimes !== 0
		) {
			validationErrors.push(
				"Blue chamber 2, chamber 3, and reset must be 0 for realtime match.",
			);
		}

		if (
			record.redChamber2 !== 0 ||
			record.redChamber3 !== 0 ||
			record.redResetTimes !== 0
		) {
			validationErrors.push(
				"Red chamber 2, chamber 3, and reset must be 0 for realtime match.",
			);
		}

		if (record.blueFinalTime !== record.blueChamber1) {
			validationErrors.push(
				"Blue final time must equal chamber 1 for realtime match.",
			);
		}

		if (record.redFinalTime !== record.redChamber1) {
			validationErrors.push(
				"Red final time must equal chamber 1 for realtime match.",
			);
		}
	} else {
		const expectedBlueFinalTime =
			record.blueChamber1 + record.blueChamber2 + record.blueChamber3;
		if (record.blueFinalTime <= 0) {
			validationErrors.push("Blue final time must be greater than 0.");
		} else if (record.blueFinalTime !== expectedBlueFinalTime) {
			validationErrors.push("Blue final time must equal sum of chamber times.");
		}

		const expectedRedFinalTime =
			record.redChamber1 + record.redChamber2 + record.redChamber3;
		if (record.redFinalTime <= 0) {
			validationErrors.push("Red final time must be greater than 0.");
		} else if (record.redFinalTime !== expectedRedFinalTime) {
			validationErrors.push("Red final time must equal sum of chamber times.");
		}
	}

	return validationErrors;
}

export function filterCharacters(
	characters: AccountCharacterResponse[],
	search: string,
	elementFilter: string,
	rarityFilter: string,
) {
	const normalizedSearch = search.trim().toLowerCase();

	return characters.filter((character) => {
		const matchesSearch =
			!normalizedSearch ||
			character.characters.name.toLowerCase().includes(normalizedSearch);

		const matchesElement =
			elementFilter === ELEMENT_FILTER_ALL ||
			CharacterElementDetail[character.characters.element].key ===
				elementFilter;

		const matchesRarity =
			rarityFilter === RARITY_FILTER_ALL ||
			character.characters.rarity.toString() === rarityFilter;

		return matchesSearch && matchesElement && matchesRarity;
	});
}

export function mapCharacterNamesToAccountCharacters(
	characters: AccountCharacterResponse[],
	characterIdsOrNames: string[],
) {
	const charactersById = new Map(
		characters.flatMap((character) => [
			[getBanPickCharacterId(character), character] as const,
			[character.id, character] as const,
		]),
	);

	const charactersByName = new Map(
		characters.map((character) => [
			character.characters.name.toLowerCase(),
			character,
		]),
	);

	return characterIdsOrNames.flatMap((characterIdOrName) => {
		const normalizedValue = String(characterIdOrName).trim();
		if (!normalizedValue) {
			return [];
		}

		const mappedById = charactersById.get(normalizedValue);
		if (mappedById) {
			return [mappedById];
		}

		const mappedByName = charactersByName.get(normalizedValue.toLowerCase());
		if (mappedByName) {
			return [mappedByName];
		}

		return [];
	});
}
