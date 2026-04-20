import z from "zod";
import { commonLocaleKeys } from "@/i18n/keys";
import { getTranslationToken } from "@/i18n/namespaces";
import type { ProfileResponse } from "../self/types";

export const createStaffSchema = z.object({
	ingameUuid: z.string().optional(),
	email: z.email({
		message: getTranslationToken("common", commonLocaleKeys.validation_email),
	}),
	displayName: z
		.string()
		.min(
			1,
			getTranslationToken("common", commonLocaleKeys.validation_required),
		),
	staffRoleId: z
		.number()
		.min(
			1,
			getTranslationToken("common", commonLocaleKeys.validation_required),
		),
	avatar: z.string().optional(),
	password: z
		.string()
		.regex(
			/^(?=.{6,30}$)(?=.*[a-z])(?=.*\d).+$/,
			getTranslationToken(
				"common",
				commonLocaleKeys.validation_password_strength,
			),
		),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export const updateStaffSchema = z.object({
	ingameUuid: z.string().optional(),
	email: z.email({
		message: getTranslationToken("common", commonLocaleKeys.validation_email),
	}),
	displayName: z
		.string()
		.min(
			1,
			getTranslationToken("common", commonLocaleKeys.validation_required),
		),
	staffRoleId: z
		.number()
		.min(
			1,
			getTranslationToken("common", commonLocaleKeys.validation_required),
		),
	avatar: z
		.url({
			message: getTranslationToken("common", commonLocaleKeys.validation_url),
		})
		.optional(),
});

export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

export interface StaffResponse {
	id: string;
	email: string;
	ingameUuid?: string;
	displayName: string;
	role: number;
	staffRoleId: number;
	staffRoleName: string;
	createdAt: string;
	lastLoginAt?: string;
	isActive: boolean;
	createdBy: ProfileResponse;
	avatar?: string;
}
