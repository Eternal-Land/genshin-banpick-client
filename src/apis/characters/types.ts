import z from "zod";
import {
	CharacterElement,
	LocaleKeys,
	WeaponType,
	type CharacterElementEnum,
	type WeaponTypeEnum,
} from "@/lib/constants";
import type { ProfileResponse } from "../self/types";

export interface CharacterResponse {
	id: number;
	key: string;
	name: string;
	element: CharacterElementEnum;
	weaponType: WeaponTypeEnum;
	iconUrl: string;
	rarity: number;
	isActive: boolean;
	createdAt: string;
	createdBy?: ProfileResponse;
	updatedAt: string;
	updatedBy?: ProfileResponse;
}

export const createCharacterSchema = z.object({
	key: z.string().min(1, LocaleKeys.validation_required),
	name: z.string().min(1, LocaleKeys.validation_required),
	element: z.enum(CharacterElement, {
		message: LocaleKeys.validation_required,
	}),
	weaponType: z.enum(WeaponType, {
		message: LocaleKeys.validation_required,
	}),
	iconUrl: z.string().optional(),
	rarity: z.number().int({ message: LocaleKeys.validation_required }),
});

export type CreateCharacterInput = z.infer<typeof createCharacterSchema>;

export const updateCharacterSchema = z.object({
	key: z.string().min(1, LocaleKeys.validation_required).optional(),
	name: z.string().min(1, LocaleKeys.validation_required).optional(),
	element: z
		.enum(CharacterElement, {
			message: LocaleKeys.validation_required,
		})
		.optional(),
	weaponType: z
		.enum(WeaponType, {
			message: LocaleKeys.validation_required,
		})
		.optional(),
	iconUrl: z.url({ message: LocaleKeys.validation_url }).optional(),
	rarity: z
		.number()
		.int({ message: LocaleKeys.validation_required })
		.optional(),
});

export type UpdateCharacterInput = z.infer<typeof updateCharacterSchema>;
