import type { PlayerSideEnum } from "@/lib/constants";

export interface SessionStateBanPickSlotResponse {
	id: number;
	matchSessionId: number;
	teamOrder: number;
	slotType: string;
	matchSide: string;
	characterId: number | null;
	weaponId: number | null;
	weaponRefinement: number | null;
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

export interface SessionStateResponse {
	matchSessionId: number;
	banPickSlots: SessionStateBanPickSlotResponse[];
	teamCosts: SessionStateTeamCostResponse[];
}
