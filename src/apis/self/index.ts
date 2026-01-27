import type { BaseApiResponse } from "@/lib/types";
import axios from "axios";
import type { ProfileResponse } from "./types";
import { API_BASE } from "@/lib/http";

async function getSelf() {
    const response = await axios.get<BaseApiResponse<ProfileResponse>>(API_BASE + "/api/self", {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
    });
    return response.data;
}

export const selfApi = {
    getSelf,
} as const;