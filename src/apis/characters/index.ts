import { http } from "@/lib/http";
import type { BaseApiResponse } from "@/lib/types";
import type {
	CharacterQuery,
	CharacterResponse,
	CreateCharacterInput,
} from "./types";

async function listCharacters(query: CharacterQuery) {
	const searchParams = new URLSearchParams();
	searchParams.append("page", query.page.toString());
	searchParams.append("take", query.take.toString());
	if (query.search) {
		searchParams.append("search", query.search);
	}
	if (query.element && query.element.length > 0) {
		query.element.forEach((item) => {
			searchParams.append("element", item.toString());
		});
	}
	if (query.weaponType && query.weaponType.length > 0) {
		query.weaponType.forEach((item) => {
			searchParams.append("weaponType", item.toString());
		});
	}
	if (query.rarity && query.rarity.length > 0) {
		query.rarity.forEach((item) => {
			searchParams.append("rarity", item.toString());
		});
	}
	if (query.isActive && query.isActive.length > 0) {
		query.isActive.forEach((active) => {
			searchParams.append("isActive", active.toString());
		});
	}

	const response = await http.get<BaseApiResponse<CharacterResponse[]>>(
		`/api/admin/characters?${searchParams.toString()}`,
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
