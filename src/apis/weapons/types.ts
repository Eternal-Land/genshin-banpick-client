import z from "zod";
import type { ProfileResponse } from "../self/types";
import { LocaleKeys, WeaponType } from "@/lib/constants";

export interface WeaponResponse {
	id: number;
	key: string;
	name: string;
	type: typeof WeaponType[keyof typeof WeaponType];
	rarity: number;
	iconUrl?: string;
	isActive: boolean;
	createdAt: Date;
	createdBy?: ProfileResponse;
	updatedAt: Date;
	updatedBy?: ProfileResponse;
}

export const createWeaponSchema = z.object({
    key: z.string().min(1).max(100),
    name: z.string().min(1).max(100),
    type: z.enum(WeaponType, {
		error: LocaleKeys.validation_required,
	}),
    rarity: z.number().int().min(1).max(5),
    iconUrl: z.string().optional(),
});

export type CreateWeaponInput = z.infer<typeof createWeaponSchema>;

export const updateWeaponSchema = createWeaponSchema.extend({
    key: z.string().min(1).max(100),
    name: z.string().min(1).max(100),
    type: z.enum(WeaponType, {
		error: LocaleKeys.validation_required,
	}),
    rarity: z.number().int().min(1).max(5),
    iconUrl: z.string().optional(),
});

export type UpdateWeaponInput = z.infer<typeof updateWeaponSchema>;