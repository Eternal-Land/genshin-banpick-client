import type { ProfileResponse } from "../self/types";

export interface CostMilestoneResponse {
	id: number;
	costFrom: number;
	costTo?: number;
	isActive: boolean;
	createdAt: string;
	createdBy: ProfileResponse;
	updatedAt?: string;
	updatedBy?: ProfileResponse;
}
