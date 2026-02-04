import { http } from "@/lib/http";
import type { BasicLoginInput, RegisterInput, TokenResponse } from "./types";
import type { BaseApiResponse } from "@/lib/types";
import { store } from "@/lib/redux";
import { setProfile } from "@/lib/redux/auth.slice";

async function register(input: RegisterInput) {
	await http.post<BaseApiResponse>("/api/auth/register", input);
}

async function basicLogin(input: BasicLoginInput) {
	const response = await http.post<BaseApiResponse<TokenResponse>>(
		"/api/auth/login/basic",
		input,
	);
	return response.data;
}

function logout() {
	localStorage.removeItem("token");
	store.dispatch(setProfile(null));
	window.location.href = "/auth/login";
}

export const authApi = {
	register,
	basicLogin,
	logout,
} as const;
