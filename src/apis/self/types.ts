export interface ProfileResponse {
    id: string;
    email: string;
    ingameUuid: string;
    displayName: string;
    role: number;
    staffRolename: string;
    permissions: string[];
    avatar?: string;
}