import axios, { AxiosError } from "axios";

export const API_BASE =
	import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5173";

export const http = axios.create({
	baseURL: API_BASE,
	withCredentials: true,
});

// ---- token helpers (simple) ----
function getToken() {
	const cookieName = "accessToken=";
	const decodedCookie = decodeURIComponent(document.cookie);
	const cookies = decodedCookie.split(";");

	for (const rawCookie of cookies) {
		const cookie = rawCookie.trim();
		if (cookie.startsWith(cookieName)) {
			return cookie.slice(cookieName.length);
		}
	}

	return null;
}
function clearToken() {
	document.cookie = "accessToken=; Max-Age=0; path=/";
}

// ---- redirect helper ----
function redirectToLogin() {
	if (window.location.pathname === "/auth/login") return;

	window.location.href = `/auth/login`;
}

// ---- request interceptor: attach token ----
http.interceptors.request.use((config) => {
	const token = getToken();
	if (token) {
		config.headers = config.headers ?? {};
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// ---- response interceptor: handle 401 globally ----
http.interceptors.response.use(
	(res) => res,
	(error: AxiosError) => {
		const status = error.response?.status;

		if (status === 401) {
			clearToken();
			redirectToLogin();
		}

		return Promise.reject(error);
	},
);
