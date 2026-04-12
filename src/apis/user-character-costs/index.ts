import { http } from "@/lib/http";
import type { BaseApiResponse } from "@/lib/types";
import type { UserCharacterCostResponse } from "./types";

async function listCharacterCosts() {
	const response = await http.get<BaseApiResponse<UserCharacterCostResponse[]>>(
		"/api/user/character-costs",
	);
	return response.data;
}

export const userCharacterCostsApi = {
	listCharacterCosts,
} as const;
