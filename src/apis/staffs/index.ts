import { http } from "@/lib/http";
import type { BaseApiResponse } from "@/lib/types";
import type {
	CreateStaffInput,
	StaffResponse,
	UpdateStaffInput,
} from "./types";

async function listStaffs() {
	const response =
		await http.get<BaseApiResponse<StaffResponse[]>>("/api/admin/staffs");
	return response.data;
}

async function getStaff(id: string) {
	const response = await http.get<BaseApiResponse<StaffResponse>>(
		`/api/admin/staffs/${id}`,
	);
	return response.data;
}

async function createStaff(input: CreateStaffInput) {
	const response = await http.post<BaseApiResponse<StaffResponse>>(
		"/api/admin/staffs",
		input,
	);
	return response.data;
}

async function updateStaff(id: string, input: UpdateStaffInput) {
	const response = await http.put<BaseApiResponse<StaffResponse>>(
		`/api/admin/staffs/${id}`,
		input,
	);
	return response.data;
}

async function toggleStaffActiveStatus(id: string) {
	const response = await http.put<BaseApiResponse<StaffResponse>>(
		`/api/admin/staffs/${id}/toggle-active`,
	);
	return response.data;
}

export const staffsApi = {
	listStaffs,
	getStaff,
	createStaff,
	updateStaff,
	toggleStaffActiveStatus,
} as const;
