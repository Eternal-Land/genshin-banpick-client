import { http } from "@/lib/http";
import type { BaseApiResponse } from "@/lib/types";
import type { GenerateUploadSignatureResponse } from "./types";
import axios, { type AxiosProgressEvent } from "axios";

async function uploadFile(
	folder: string,
	file: File,
	onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
) {
	if (!folder.trim()) {
		throw new Error("Upload folder is required");
	}

	const response = await http.get<
		BaseApiResponse<GenerateUploadSignatureResponse>
	>("/api/files/upload-signature", {
		params: { folder },
	});
	const { apiKey, cloudName, signature, timestamp } = response.data.data!;

	if (!apiKey || !cloudName || !signature || !timestamp) {
		throw new Error("Invalid upload signature response");
	}

	const formData = new FormData();
	formData.append("file", file);
	formData.append("api_key", apiKey);
	formData.append("timestamp", timestamp.toString());
	formData.append("signature", signature);
	formData.append("folder", folder);

	const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
	let uploadResponse;
	try {
		uploadResponse = await axios.post(uploadUrl, formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
			withCredentials: false,
			onUploadProgress,
		});
	} catch (error) {
		if (axios.isAxiosError(error)) {
			const cloudinaryMessage = error.response?.data?.error?.message;
			if (cloudinaryMessage) {
				throw new Error(cloudinaryMessage);
			}
		}
		throw error;
	}

	return uploadResponse.data;
}

export const filesApi = { uploadFile } as const;
