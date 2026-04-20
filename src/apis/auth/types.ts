import { z } from "zod";
import { commonLocaleKeys } from "@/i18n/keys";
import { getTranslationToken } from "@/i18n/namespaces";

export const registerSchema = z
	.object({
		ingameUuid: z
			.string()
			.min(
				1,
				getTranslationToken("common", commonLocaleKeys.validation_required),
			),
		email: z.email({
			message: getTranslationToken("common", commonLocaleKeys.validation_email),
		}),
		password: z
			.string()
			.regex(
				/^(?=.{6,30}$)(?=.*[a-z])(?=.*\d).+$/,
				getTranslationToken(
					"common",
					commonLocaleKeys.validation_password_strength,
				),
			),
		avatar: z.string().optional(),
		confirmPassword: z
			.string()
			.min(
				1,
				getTranslationToken("common", commonLocaleKeys.validation_required),
			),
		displayName: z
			.string()
			.min(
				1,
				getTranslationToken("common", commonLocaleKeys.validation_required),
			),
	})
	.refine((values) => values.password === values.confirmPassword, {
		path: ["confirmPassword"],
		message: getTranslationToken(
			"common",
			commonLocaleKeys.validation_password_mismatch,
		),
	});

export type RegisterInput = z.infer<typeof registerSchema>;

export const basicLoginSchema = z.object({
	ingameUuidOrEmail: z
		.string()
		.min(
			1,
			getTranslationToken("common", commonLocaleKeys.validation_required),
		),
	password: z
		.string()
		.min(
			1,
			getTranslationToken("common", commonLocaleKeys.validation_required),
		),
});

export type BasicLoginInput = z.infer<typeof basicLoginSchema>;

export interface TokenResponse {
	accessToken: string;
}
