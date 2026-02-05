import { http } from "@/lib/http";
import type { BaseApiResponse } from "@/lib/types";
import type {
	CreateWeaponInput,
	UpdateWeaponInput,
	WeaponQuery,
	WeaponResponse,
} from "./types";

async function listWeapons(query: WeaponQuery) {
	const searchParams = new URLSearchParams();
	searchParams.append("page", query.page.toString());
	searchParams.append("take", query.take.toString());
	if (query.search) {
		searchParams.append("search", query.search);
	}
	if (query.type && query.type.length > 0) {
		query.type.forEach((item) => {
			searchParams.append("type", item.toString());
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

	const response = await http.get<BaseApiResponse<WeaponResponse[]>>(
		`/api/admin/weapons?${searchParams.toString()}`,
	);
	return response.data;
}

async function getWeapon(id: string) {
	const response = await http.get<BaseApiResponse<WeaponResponse>>(
		`/api/admin/weapons/${id}`,
	);
	return response.data;
}

async function createWeapon(input: CreateWeaponInput) {
	const response = await http.post<BaseApiResponse<WeaponResponse>>(
		"/api/admin/weapons",
		input,
	);
	return response.data;
}

async function updateWeapon(id: string, input: UpdateWeaponInput) {
	const response = await http.put<BaseApiResponse<WeaponResponse>>(
		`/api/admin/weapons/${id}`,
		input,
	);
	return response.data;
}

async function toggleActive(id: string) {
	const response = await http.put<BaseApiResponse<WeaponResponse>>(
		`/api/admin/weapons/${id}/toggle-active`,
	);
	return response.data;
}

export const weaponApis = {
	listWeapons,
	getWeapon,
	createWeapon,
	updateWeapon,
	toggleActive,
} as const;
