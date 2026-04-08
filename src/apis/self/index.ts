import type { BaseApiResponse } from "@/lib/types";
import type { ProfileResponse, UpdateProfileInput } from "./types";
import { http } from "@/lib/http";

async function getSelf() {
	const response =
		await http.get<BaseApiResponse<ProfileResponse>>("/api/self");
	return response.data;
}

async function updateProfile(input: UpdateProfileInput) {
	const response = await http.put<BaseApiResponse>("/api/self", input);
	return response.data;
}

export const selfApi = {
	getSelf,
	updateProfile,
} as const;
