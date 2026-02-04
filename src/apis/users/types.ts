import { paginationQuerySchema } from "@/lib/types";
import z from "zod";

export interface UserResponse {
	id: string;
	ingameUuid?: string;
	email: string;
	avatar?: string;
	displayName: string;
	createdAt: string;
	lastLoginAt?: string;
	isActive: boolean;
}

export const userQuerySchema = z.object({
	...paginationQuerySchema.shape,
	search: z.string().optional(),
	isActive: z.array(z.boolean()).optional(),
});

export type UserQuery = z.infer<typeof userQuerySchema>;
