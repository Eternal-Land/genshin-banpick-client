import { useTranslation } from "react-i18next";
import { LocaleKeys } from "@/lib/constants";
import type { PaginationDto } from "@/lib/types";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";

export interface TablePaginationProps {
	/** Current page number (1-based) */
	page: number;
	/** Pagination data from API response */
	pagination?: PaginationDto;
	/** Whether the data is loading */
	isLoading?: boolean;
	/** Callback when page changes */
	onPageChange: (page: number) => void;
	/** Whether to show the page info text (e.g., "Page 1 of 10") */
	showPageInfo?: boolean;
	/** Custom className for the container */
	className?: string;
}

/**
 * Generate page numbers for pagination with ellipsis
 */
function getPageNumbers(currentPage: number, totalPage: number) {
	const pages: (number | "ellipsis")[] = [];

	if (totalPage <= 7) {
		// Show all pages if total is 7 or less
		for (let i = 1; i <= totalPage; i++) {
			pages.push(i);
		}
	} else {
		// Always show first page
		pages.push(1);

		if (currentPage > 3) {
			pages.push("ellipsis");
		}

		// Show pages around current page
		const start = Math.max(2, currentPage - 1);
		const end = Math.min(totalPage - 1, currentPage + 1);

		for (let i = start; i <= end; i++) {
			pages.push(i);
		}

		if (currentPage < totalPage - 2) {
			pages.push("ellipsis");
		}

		// Always show last page
		pages.push(totalPage);
	}

	return pages;
}

export default function TablePagination({
	page,
	pagination,
	isLoading,
	onPageChange,
	showPageInfo = true,
	className,
}: TablePaginationProps) {
	const { t } = useTranslation();

	const totalPage = pagination?.totalPage ?? 1;

	const handlePageChange = (newPage: number) => {
		if (newPage >= 1 && newPage <= totalPage) {
			onPageChange(newPage);
		}
	};

	const isPreviousDisabled = page <= 1 || isLoading;
	const isNextDisabled = page >= totalPage || isLoading;

	const pageNumbers = pagination ? getPageNumbers(page, totalPage) : [];

	return (
		<div className={className}>
			<div className="flex items-center justify-between">
				{showPageInfo && (
					<span className="text-muted-foreground text-sm">
						{pagination
							? t(LocaleKeys.pagination_page_info, {
									current: page,
									total: totalPage,
								})
							: null}
					</span>
				)}
				<Pagination className="mx-0 w-auto">
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious
								text={t(LocaleKeys.pagination_previous)}
								onClick={() => handlePageChange(page - 1)}
								aria-disabled={isPreviousDisabled}
								className={
									isPreviousDisabled
										? "pointer-events-none opacity-50"
										: "cursor-pointer"
								}
							/>
						</PaginationItem>

						{pageNumbers.map((pageNum, index) =>
							pageNum === "ellipsis" ? (
								<PaginationItem key={`ellipsis-${index}`}>
									<PaginationEllipsis />
								</PaginationItem>
							) : (
								<PaginationItem key={pageNum}>
									<PaginationLink
										onClick={() => handlePageChange(pageNum)}
										isActive={page === pageNum}
										className={
											isLoading
												? "pointer-events-none opacity-50"
												: "cursor-pointer"
										}
									>
										{pageNum}
									</PaginationLink>
								</PaginationItem>
							),
						)}

						<PaginationItem>
							<PaginationNext
								text={t(LocaleKeys.pagination_next)}
								onClick={() => handlePageChange(page + 1)}
								aria-disabled={isNextDisabled}
								className={
									isNextDisabled
										? "pointer-events-none opacity-50"
										: "cursor-pointer"
								}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			</div>
		</div>
	);
}
