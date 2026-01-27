import { z } from 'zod';

export const registerSchema = z
    .object({
        ingameUuid: z.string().min(1, "In-game UUID is required"),
        email: z.email(),
        password: z
            .string()
            .regex(
                /^(?=.{6,30}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
                "Password must be 6-30 characters and include upper, lower, number, and symbol"
            ),
        avatar: z.url().optional(),
        confirmPassword: z.string(),
        displayName: z.string().min(1, "Display name is required")
    })
    .refine((values) => values.password === values.confirmPassword, {
        path: ["confirmPassword"],
        message: "Passwords do not match"
    });

export type RegisterInput = z.infer<typeof registerSchema>;

export const basicLoginSchema = z.object({
    ingameUuidOrEmail: z.string(),
    password: z.string()
});

export type BasicLoginInput = z.infer<typeof basicLoginSchema>;

export interface TokenResponse {
    accessToken: string;
}

export interface ProfileResponse {
    id: string;
    email: string;
    ingameUuid: string;
    displayName: string;
    role: number;
    staffRolename: string;
    permissions: string[];
    avatar?: string;
}