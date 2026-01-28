import { z } from 'zod';

export const registerSchema = z
    .object({
        ingameUuid: z.string().min(1, "validation_required"),
        email: z.email({ message: "validation_email" }),
        password: z
            .string()
            .regex(
                /^(?=.{6,30}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
                "validation_password_strength"
            ),
        avatar: z.url({ message: "validation_url" }).optional(),
        confirmPassword: z.string().min(1, "validation_required"),
        displayName: z.string().min(1, "validation_required")
    })
    .refine((values) => values.password === values.confirmPassword, {
        path: ["confirmPassword"],
        message: "validation_password_mismatch"
    });

export type RegisterInput = z.infer<typeof registerSchema>;

export const basicLoginSchema = z.object({
    ingameUuidOrEmail: z.string().min(1, "validation_required"),
    password: z.string().min(1, "validation_required")
});

export type BasicLoginInput = z.infer<typeof basicLoginSchema>;

export interface TokenResponse {
    accessToken: string;
}