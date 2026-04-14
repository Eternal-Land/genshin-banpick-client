import { http } from "@/lib/http";
import type { BaseApiResponse } from "@/lib/types";
import type { ProfileResponse } from "@/apis/self/types";
import type { SearchUsersQuery, UserQuery, UserResponse } from "./types";

async function listUsers(query: UserQuery) {
	const queryParams = new URLSearchParams();
	queryParams.append("page", query.page.toString());
	queryParams.append("take", query.take.toString());
	if (query.search) {
		queryParams.append("search", query.search);
	}
	if (query.isActive && query.isActive.length > 0) {
		query.isActive.forEach((active) => {
			queryParams.append("isActive", active.toString());
		});
	}

	const response = await http.get<BaseApiResponse<UserResponse[]>>(
		`/api/admin/users?${queryParams.toString()}`,
	);
	return response.data;
}

async function searchUsers(query: SearchUsersQuery) {
	const queryParams = new URLSearchParams();
	queryParams.append("page", query.page.toString());
	queryParams.append("take", query.take.toString());
	if (query.search) {
		queryParams.append("search", query.search);
	}

	const response = await http.get<BaseApiResponse<ProfileResponse[]>>(
		`/api/user/search?${queryParams.toString()}`,
	);
	return response.data;
}

async function deactivateUser(id: string) {
	const response = await http.delete<BaseApiResponse>(`/api/admin/users/${id}`);
	return response.data;
}

async function reactivateUser(id: string) {
	const response = await http.put<BaseApiResponse>(
		`/api/admin/users/${id}/reactivate`,
	);
	return response.data;
}

export const usersApi = {
	listUsers,
	searchUsers,
	deactivateUser,
	reactivateUser,
} as const;
