import { http } from "@/lib/http";
import type {
	BasicLoginInput,
	ForgotPasswordInput,
	RegisterInput,
	TokenResponse,
} from "./types";
import type { BaseApiResponse } from "@/lib/types";
import { store } from "@/lib/redux";
import { setProfile } from "@/lib/redux/auth.slice";

async function register(input: RegisterInput) {
	await http.post<BaseApiResponse>("/api/auth/register", input);
}

async function forgotPassword(input: ForgotPasswordInput) {
	const response = await http.post<BaseApiResponse>(
		"/api/auth/forgot-password",
		{
			ingameUuid: input.ingameUuid,
			email: input.email,
			password: input.password,
		},
	);

	return response.data;
}

async function basicLogin(input: BasicLoginInput) {
	const response = await http.post<BaseApiResponse<TokenResponse>>(
		"/api/auth/login/basic",
		input,
	);
	return response.data;
}

async function logout() {
	await http.post("/api/auth/logout");
	store.dispatch(setProfile(undefined));
	window.location.href = "/auth/login";
}

export const authApi = {
	register,
	forgotPassword,
	basicLogin,
	logout,
} as const;
