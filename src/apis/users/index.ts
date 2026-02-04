import { http } from "@/lib/http";
import type { BaseApiResponse } from "@/lib/types";
import type { UserQuery, UserResponse } from "./types";

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
        `/api/admin/users?${queryParams.toString()}`
    );
    return response.data;
}

export const usersApi = {
    listUsers
} as const