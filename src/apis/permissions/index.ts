import { http } from "@/lib/http";
import type { PermissionResponse } from "./types";
import type { BaseApiResponse } from "@/lib/types";

async function listPermissions() {
	const response = await http.get<BaseApiResponse<PermissionResponse[]>>(
		"/api/admin/permissions",
	);
	return response.data;
}

export const permissionsApi = {
	listPermissions,
} as const;
