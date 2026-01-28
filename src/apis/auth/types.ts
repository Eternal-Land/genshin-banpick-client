import { z } from "zod";
import { LocaleKeys } from "@/lib/constants";

export const registerSchema = z
    .object({
        ingameUuid: z.string().min(1, LocaleKeys.validation_required),
        email: z.email({ message: LocaleKeys.validation_email }),
        password: z
            .string()
            .regex(
                /^(?=.{6,30}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
                LocaleKeys.validation_password_strength
            ),
        avatar: z.url({ message: LocaleKeys.validation_url }).optional(),
        confirmPassword: z.string().min(1, LocaleKeys.validation_required),
        displayName: z.string().min(1, LocaleKeys.validation_required)
    })
    .refine((values) => values.password === values.confirmPassword, {
        path: ["confirmPassword"],
        message: LocaleKeys.validation_password_mismatch
    });

export type RegisterInput = z.infer<typeof registerSchema>;

export const basicLoginSchema = z.object({
    ingameUuidOrEmail: z.string().min(1, LocaleKeys.validation_required),
    password: z.string().min(1, LocaleKeys.validation_required)
});

export type BasicLoginInput = z.infer<typeof basicLoginSchema>;

export interface TokenResponse {
    accessToken: string;
}