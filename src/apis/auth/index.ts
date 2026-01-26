import { API_BASE, http } from "@/lib/http";
import type { BasicLoginInput, ProfileResponse, RegisterInput, TokenResponse } from "./types";
import type { BaseApiResponse } from "@/lib/types";
import axios from "axios";
import { store } from "@/lib/redux";
import { setProfile } from "@/lib/redux/auth.slice";

async function register(input: RegisterInput) {
    await http.post<BaseApiResponse>("/api/auth/register", input);
}

async function basicLogin(input: BasicLoginInput) {
    const response = await http.post<BaseApiResponse<TokenResponse>>("/api/auth/login/basic", input);
    return response.data;
}

async function getProfile() {
    const response = await axios.get<BaseApiResponse<ProfileResponse>>(API_BASE + "/api/auth/profile", {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
    });
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
    getProfile,
    logout
} as const;