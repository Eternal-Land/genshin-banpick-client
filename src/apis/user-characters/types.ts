import type { CharacterResponse } from "@/apis/characters/types";

export type UserCharacterResponse = CharacterResponse;

export interface SearchUserCharactersQuery {
	query?: string;
}
