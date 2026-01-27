import z from "zod";

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

export const updateProfileSchema = z.object({
    ingameUuid: z.string().optional(),
    avatar: z.url().optional(),
    displayName: z.string().optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;