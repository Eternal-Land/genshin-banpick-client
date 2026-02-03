import { http } from "@/lib/http";
import type { BaseApiResponse } from "@/lib/types";
import type { CharacterResponse, CreateCharacterInput } from "./types";

async function listCharacters() {
	const response = await http.get<BaseApiResponse<CharacterResponse[]>>(
		"/api/admin/characters",
	);
	return response.data;
}

async function getCharacter(id: number) {
	const response = await http.get<BaseApiResponse<CharacterResponse>>(
		`/api/admin/characters/${id}`,
	);
	return response.data;
}

async function createCharacter(input: CreateCharacterInput) {
	const response = await http.post<BaseApiResponse<CharacterResponse>>(
		"/api/admin/characters",
		input,
	);
	return response.data;
}

async function updateCharacter(
	id: number,
	input: Partial<CreateCharacterInput>,
) {
	const response = await http.put<BaseApiResponse<CharacterResponse>>(
		`/api/admin/characters/${id}`,
		input,
	);
	return response.data;
}

async function toggleActive(id: number) {
	const response = await http.put<BaseApiResponse<CharacterResponse>>(
		`/api/admin/characters/${id}/toggle-active`,
	);
	return response.data;
}

export const charactersApi = {
	listCharacters,
	getCharacter,
	createCharacter,
	updateCharacter,
	toggleActive,
} as const;
