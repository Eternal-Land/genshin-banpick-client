import type { PlayerSideEnum } from "@/lib/constants";

export interface SessionStateBanPickSlotResponse {
	id: number;
	matchSessionId: number;
	teamOrder: number;
	slotType: string;
	matchSide: string;
	characterId: number | null;
	characterConstellation: number | null;
	weaponId: number | null;
	weaponRefinement: number | null;
	characterLevel: number | null;
}

export interface SessionStateTeamCostResponse {
	id: number;
	matchSessionId: number;
	sessionCostId: number;
	teamSide: PlayerSideEnum;
	chamberIndex: number;
	accountId: string;
	totalCharacterConstellationCost: number;
	totalWeaponRefinementCost: number;
	totalCharacterLevelCost: number;
	totalChamberTimeBonus: number;
	isUsedStar: boolean;
}

export interface SessionStateRecordResponse {
	id: number;
	matchSessionId: number;
	blueChamber1: number;
	blueChamber2: number;
	blueChamber3: number;
	blueResetTimes: number;
	blueFinalTime: number;
	redChamber1: number;
	redChamber2: number;
	redChamber3: number;
	redResetTimes: number;
	redFinalTime: number;
}

export interface SessionStateResponse {
	matchSessionId: number;
	banPickSlots: SessionStateBanPickSlotResponse[];
	teamCosts: SessionStateTeamCostResponse[];
	sessionRecord: SessionStateRecordResponse | null;
}
