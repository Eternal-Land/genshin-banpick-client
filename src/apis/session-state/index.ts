import { http } from "@/lib/http";
import type { BaseApiResponse } from "@/lib/types";
import type { SessionStateResponse } from "./types";

async function getCurrentSessionState(matchId: string) {
	const response = await http.get<BaseApiResponse<SessionStateResponse>>(
		`/api/user/session-state/${matchId}/current`,
	);
	return response.data;
}

export const sessionStateApi = {
	getCurrentSessionState,
} as const;
