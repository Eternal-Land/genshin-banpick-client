import z from "zod";
import { LocaleKeys, type AccountRoleEnum } from "@/lib/constants";

export interface ProfileResponse {
    id: string;
    email: string;
    ingameUuid: string;
    displayName: string;
    role: AccountRoleEnum;
    staffRolename: string;
    permissions: string[];
    avatar?: string;
}

export const updateProfileSchema = z.object({
    ingameUuid: z.string().optional(),
    avatar: z.url({ message: LocaleKeys.validation_url }).optional(),
    displayName: z.string().optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;