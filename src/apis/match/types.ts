import z from "zod";
import type { ProfileResponse } from "../self/types";
import { paginationQuerySchema } from "@/lib/types";
import {
	MatchType,
	type MatchStatusEnum,
	type MatchTypeEnum,
	type PlayerSideEnum,
} from "@/lib/constants";

export interface MatchResponse {
	id: string;
	host?: ProfileResponse;
	sessionCount: number;
	createdAt: string;
	redPlayer?: ProfileResponse;
	bluePlayer?: ProfileResponse;
	type: MatchTypeEnum;
	status: MatchStatusEnum;
}

export interface MatchStateResponse {
	hostJoined: boolean;
	redPlayerJoined: boolean;
	bluePlayerJoined: boolean;
	currentSession: number;
	currentTurn: PlayerSideEnum;
	blueBanChars: string[];
	blueSelectedChars: string[];
	blueSelectedWeapons: string[];
	blueSelectedWeaponRefinements: number[];
	redBanChars: string[];
	redSelectedChars: string[];
	redSelectedWeapons: string[];
	redSelectedWeaponRefinements: number[];
}

export const listMatchesQuerySchema = z.object({
	...paginationQuerySchema.shape,
	accountId: z.string().optional(),
});

export type ListMatchesQuery = z.infer<typeof listMatchesQuerySchema>;

export const createMatchInputSchema = z.object({
	sessionCount: z
		.number()
		.min(1, "Session count must be at least 1")
		.max(5, "Session count must be at most 5"),
	type: z.enum(MatchType).default(MatchType.REALTIME),
	redPlayerId: z.string(),
	bluePlayerId: z.string(),
});

export type CreateMatchInput = z.infer<typeof createMatchInputSchema>;
