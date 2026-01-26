export interface PaginationDto {
    page: number;
    take: number;
    totalRecord: number;
    totalPage: number;
    nextPage?: number;
    prevPage?: number;
}