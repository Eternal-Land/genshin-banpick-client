import { http } from "@/lib/http";
import type {
	CostMilestoneResponse,
	CreateCostMilestoneInput,
	UpdateCostMilestoneInput,
} from "./types";
import type { BaseApiResponse } from "@/lib/types";

async function listCostMilestones() {
	const response = await http.get<BaseApiResponse<CostMilestoneResponse[]>>(
		`/api/admin/cost-milestones`,
	);
	return response.data;
}

async function createCostMilestone(input: CreateCostMilestoneInput) {
	const response = await http.post<BaseApiResponse<CostMilestoneResponse>>(
		"/api/admin/cost-milestones",
		input,
	);
	return response.data;
}

async function updateCostMilestone(
	id: number,
	input: UpdateCostMilestoneInput,
) {
	const response = await http.put<BaseApiResponse<CostMilestoneResponse>>(
		`/api/admin/cost-milestones/${id}`,
		input,
	);
	return response.data;
}

async function deleteCostMilestone(id: number) {
	const response = await http.delete<BaseApiResponse>(
		`/api/admin/cost-milestones/${id}`,
	);
	return response.data;
}

export const costMilestonesApi = {
	listCostMilestones,
	createCostMilestone,
	updateCostMilestone,
	deleteCostMilestone,
} as const;
