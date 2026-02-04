import { fallback } from "@tanstack/zod-adapter";
import z from "zod";

export const paginationQuerySchema = z.object({
    page: fallback(z.int().min(1), 1),
    take: fallback(z.int().min(1).max(200), 10)
})