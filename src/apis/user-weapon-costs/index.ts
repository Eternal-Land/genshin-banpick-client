import { http } from "@/lib/http";
import type { BaseApiResponse } from "@/lib/types";
import type { UserWeaponCostResponse } from "./types";

async function listWeaponCosts() {
	const response = await http.get<BaseApiResponse<UserWeaponCostResponse[]>>(
		"/api/user/weapon-costs",
	);
	return response.data;
}

export const userWeaponCostsApi = {
	listWeaponCosts,
} as const;
