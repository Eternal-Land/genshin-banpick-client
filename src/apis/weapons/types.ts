import z from "zod";
import type { ProfileResponse } from "../self/types";
import {
	LocaleKeys,
	WeaponRarity,
	WeaponType,
	type WeaponRarityEnum,
	type WeaponTypeEnum,
} from "@/lib/constants";

export interface WeaponResponse {
	id: number;
	key: string;
	name: string;
	type: WeaponTypeEnum;
	rarity: WeaponRarityEnum;
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
	rarity: z.enum(WeaponRarity, {
		error: LocaleKeys.validation_required,
	}),
	iconUrl: z.string().optional(),
});

export type CreateWeaponInput = z.infer<typeof createWeaponSchema>;

export const updateWeaponSchema = createWeaponSchema.extend({
	key: z.string().min(1).max(100),
	name: z.string().min(1).max(100),
	type: z.enum(WeaponType, {
		error: LocaleKeys.validation_required,
	}),
	rarity: z.enum(WeaponRarity, {
		error: LocaleKeys.validation_required,
	}),
	iconUrl: z.string().optional(),
});

export type UpdateWeaponInput = z.infer<typeof updateWeaponSchema>;
