import { http } from "@/lib/http";
import type { BaseApiResponse } from "@/lib/types";
import type { GenerateUploadSignatureResponse } from "./types";
import axios, { type AxiosProgressEvent } from "axios";

async function uploadFile(file: File, onUploadProgress?: (progressEvent: AxiosProgressEvent) => void) {
    const response = await http.get<BaseApiResponse<GenerateUploadSignatureResponse>>("/api/files/upload-signature");
    const {
        apiKey,
        cloudName,
        folder,
        signature,
        timestamp
    } = response.data.data!;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("folder", folder);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
    const uploadResponse = await axios.post(uploadUrl, formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        },
        onUploadProgress,
    });

    return uploadResponse.data;
}

export const filesApi = { uploadFile } as const;