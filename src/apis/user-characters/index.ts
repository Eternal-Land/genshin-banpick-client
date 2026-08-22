import { http } from "@/lib/http";
import type { BaseApiResponse } from "@/lib/types";
import type { SearchUserCharactersQuery, UserCharacterResponse } from "./types";

async function listCharacters() {
	const response = await http.get<BaseApiResponse<UserCharacterResponse[]>>(
		"/api/user/characters",
	);
	return response.data;
}

async function searchCharacters(query: SearchUserCharactersQuery = {}) {
	const searchParams = new URLSearchParams();
	if (query.query && query.query.trim()) {
		searchParams.append("query", query.query.trim());
	}

	const queryString = searchParams.toString();
	const response = await http.get<BaseApiResponse<UserCharacterResponse[]>>(
		`/api/user/characters/search${queryString ? `?${queryString}` : ""}`,
	);
	return response.data;
}

export const userCharactersApi = {
	listCharacters,
	searchCharacters,
} as const;
