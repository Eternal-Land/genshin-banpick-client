import z from "zod";
import type { ProfileResponse } from "../auth/types";

export const createStaffSchema = z.object({
    ingameUuid: z.string().optional(),
    email: z.email(),
    displayName: z.string().min(1, "Display name is required"),
    staffRoleId: z.number().min(1, "Staff role is required"),
    avatar: z.url().optional(),
    password: z
        .string()
        .regex(
            /^(?=.{6,30}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
            "Password must be 6-30 characters and include upper, lower, number, and symbol"
        ),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export const updateStaffSchema = z.object({
    ingameUuid: z.string().optional(),
    email: z.email(),
    displayName: z.string().min(1, "Display name is required"),
    staffRoleId: z.number().min(1, "Staff role is required"),
    avatar: z.url().optional(),
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