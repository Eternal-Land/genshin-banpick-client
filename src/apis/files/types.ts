export interface GenerateUploadSignatureResponse {
    signature: string;
    folder: string;
    apiKey: string;
    timestamp: number;
    cloudName: string;
}