import type { PaginationDto } from "./pagination-dto";

export interface BaseApiResponse<T = any> {
    code: string;
    message: string;
    error?: any;
    data?: T;
    pagination?: PaginationDto;
}