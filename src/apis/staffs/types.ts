import z from "zod";
import type { ProfileResponse } from "../self/types";

export const createStaffSchema = z.object({
    ingameUuid: z.string().optional(),
    email: z.email({ message: "validation_email" }),
    displayName: z.string().min(1, "validation_required"),
    staffRoleId: z.number().min(1, "validation_required"),
    avatar: z.url({ message: "validation_url" }).optional(),
    password: z
        .string()
        .regex(
            /^(?=.{6,30}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
            "validation_password_strength"
        ),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export const updateStaffSchema = z.object({
    ingameUuid: z.string().optional(),
    email: z.email({ message: "validation_email" }),
    displayName: z.string().min(1, "validation_required"),
    staffRoleId: z.number().min(1, "validation_required"),
    avatar: z.url({ message: "validation_url" }).optional(),
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