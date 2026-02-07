import z from "zod";
import { LocaleKeys } from "@/lib/constants/locale-keys";
import type { ProfileResponse } from "../self/types";

export interface CostMilestoneResponse {
	id: number;
	costFrom: number;
	costTo?: number | null;
	costValuePerSec: number;
	createdAt: string;
	createdBy: ProfileResponse;
	updatedAt?: string;
	updatedBy?: ProfileResponse;
}

export const createCostMilestoneSchema = z.object({
	costFrom: z.number().min(0, LocaleKeys.cost_milestones_cost_from_min),
	costTo: z
		.number()
		.min(0, LocaleKeys.cost_milestones_cost_to_min)
		.nullable()
		.optional(),
	costValuePerSec: z
		.number()
		.min(0, LocaleKeys.cost_milestones_cost_value_per_sec_min),
});

export type CreateCostMilestoneInput = z.infer<
	typeof createCostMilestoneSchema
>;

export const updateCostMilestoneSchema = z.object({
	costFrom: z.number().min(0, LocaleKeys.cost_milestones_cost_from_min),
	costTo: z
		.number()
		.min(0, LocaleKeys.cost_milestones_cost_to_min)
		.nullable()
		.optional(),
	costValuePerSec: z
		.number()
		.min(0, LocaleKeys.cost_milestones_cost_value_per_sec_min),
});

export type UpdateCostMilestoneInput = z.infer<
	typeof updateCostMilestoneSchema
>;
