import { http } from "@/lib/http";
import type { BaseApiResponse } from "@/lib/types";
import type { CreateWeaponInput, UpdateWeaponInput, WeaponResponse } from "./types";

async function listWeapons() {
    const response = await http.get<BaseApiResponse<WeaponResponse[]>>("/api/admin/weapons");
    return response.data;
}

async function getWeapon(id: string) {
    const response = await http.get<BaseApiResponse<WeaponResponse>>(`/api/admin/weapons/${id}`);
    return response.data;
}

async function createWeapon(input: CreateWeaponInput) {
    const response = await http.post<BaseApiResponse<WeaponResponse>>("/api/admin/weapons", input);
    return response.data;
}

async function updateWeapon(id: string, input: UpdateWeaponInput) {
    const response = await http.put<BaseApiResponse<WeaponResponse>>(
        `/api/admin/weapons/${id}`,
        input
    );
    return response.data;
}

async function toggleActive(id: string) {
    const response = await http.put<BaseApiResponse<WeaponResponse>>(
        `/api/admin/weapons/${id}/toggle-active`
    );
    return response.data;
}

export const weaponApis = {
    listWeapons,
    getWeapon,
    createWeapon,
    updateWeapon,
    toggleActive
} as const;