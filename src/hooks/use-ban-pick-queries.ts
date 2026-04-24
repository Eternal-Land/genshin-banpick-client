import { accountCharactersApi } from "@/apis/account-characters";
import type { AccountCharacterResponse } from "@/apis/account-characters/types";
import { userWeaponApis } from "@/apis/user-weapons";
import type { UserWeaponResponse } from "@/apis/user-weapons/types";
import { useQuery } from "@tanstack/react-query";

const ACCOUNT_CHARACTER_QUERY = {};

interface UseBanPickQueriesParams {
	bluePlayerId?: string;
	redPlayerId?: string;
}

interface UseBanPickQueriesResult {
	blueCharacters: AccountCharacterResponse[];
	redCharacters: AccountCharacterResponse[];
	weapons: UserWeaponResponse[];
}

export function useBanPickQueries({
	bluePlayerId,
	redPlayerId,
}: UseBanPickQueriesParams): UseBanPickQueriesResult {
	const { data: blueAccountCharactersResponse } = useQuery({
		queryKey: [
			"account-characters",
			{ ...ACCOUNT_CHARACTER_QUERY, accountId: bluePlayerId },
		],
		queryFn: () => {
			if (!bluePlayerId) {
				return Promise.reject("No blue player ID");
			}

			return accountCharactersApi.listAccountCharacters({
				...ACCOUNT_CHARACTER_QUERY,
				accountId: bluePlayerId,
			});
		},
		enabled: Boolean(bluePlayerId),
	});

	const { data: redAccountCharactersResponse } = useQuery({
		queryKey: [
			"account-characters",
			{ ...ACCOUNT_CHARACTER_QUERY, accountId: redPlayerId },
		],
		queryFn: () => {
			if (!redPlayerId) {
				return Promise.reject("No red player ID");
			}

			return accountCharactersApi.listAccountCharacters({
				...ACCOUNT_CHARACTER_QUERY,
				accountId: redPlayerId,
			});
		},
		enabled: Boolean(redPlayerId),
	});

	const { data: userWeaponsResponse } = useQuery({
		queryKey: ["user-weapons"],
		queryFn: userWeaponApis.listUserWeapons,
	});

	return {
		blueCharacters: blueAccountCharactersResponse?.data ?? [],
		redCharacters: redAccountCharactersResponse?.data ?? [],
		weapons: userWeaponsResponse?.data ?? [],
	};
}
