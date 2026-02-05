import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { RefreshCcwIcon, SearchIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usersApi } from "@/apis/users";
import { LocaleKeys } from "@/lib/constants";
import { UsersTable } from "@/components/users";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { RefreshSpinner } from "@/components/ui/spinner";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { userQuerySchema, type UserQuery } from "@/apis/users/types";
import { zodValidator } from "@tanstack/zod-adapter";
import { useDebounce } from "@/hooks/use-debounce";

export const Route = createFileRoute("/admin/users/")({
	component: RouteComponent,
	validateSearch: zodValidator(userQuerySchema),
});

function RouteComponent() {
	const { t } = useTranslation();
	const navigate = Route.useNavigate();
	const filter = Route.useSearch();
	// Search state separated for debounce effect
	const [search, setSearch] = useState(filter.search || "");

	const {
		data: usersResponse,
		isLoading,
		isFetching,
		error,
		refetch,
	} = useQuery({
		queryKey: ["users", filter],
		queryFn: () => usersApi.listUsers(filter),
	});

	const users = usersResponse?.data ?? [];
	const pagination = usersResponse?.pagination;

	const handleFilterChange = (newFilter: UserQuery) => {
		navigate({
			replace: true,
			search: newFilter,
		});
	};

	const triggerSearchDebounce = useDebounce((value: string) => {
		handleFilterChange({
			...filter,
			search: value,
		});
	}, 500);

	const handleSearchChange = (value: string) => {
		setSearch(value);
		triggerSearchDebounce(value);
	};

	const handlePageChange = (newPage: number) => {
		if (newPage >= 1 && (!pagination || newPage <= pagination.totalPage)) {
			handleFilterChange({
				...filter,
				page: newPage,
			});
		}
	};

	// Generate page numbers for pagination
	const getPageNumbers = () => {
		if (!pagination) return [];
		const { totalPage } = pagination;
		const pages: (number | "ellipsis")[] = [];

		if (totalPage <= 7) {
			// Show all pages if total is 7 or less
			for (let i = 1; i <= totalPage; i++) {
				pages.push(i);
			}
		} else {
			// Always show first page
			pages.push(1);

			if (filter.page > 3) {
				pages.push("ellipsis");
			}

			// Show pages around current page
			const start = Math.max(2, filter.page - 1);
			const end = Math.min(totalPage - 1, filter.page + 1);

			for (let i = start; i <= end; i++) {
				pages.push(i);
			}

			if (filter.page < totalPage - 2) {
				pages.push("ellipsis");
			}

			// Always show last page
			pages.push(totalPage);
		}

		return pages;
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>{t(LocaleKeys.users_title)}</CardTitle>
					<CardDescription className="flex flex-wrap items-center gap-2">
						<span>
							{pagination
								? t(LocaleKeys.users_count, { count: pagination.totalRecord })
								: null}
						</span>
						{error ? (
							<span className="text-destructive">
								{t(LocaleKeys.users_load_error)}
							</span>
						) : null}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex gap-3 sm:flex-row sm:items-center sm:justify-between">
						<InputGroup>
							<InputGroupInput
								placeholder={t(LocaleKeys.users_search_placeholder)}
								value={search}
								onChange={(event) => handleSearchChange(event.target.value)}
							/>
							<InputGroupAddon align="inline-end">
								<SearchIcon className="size-4" />
							</InputGroupAddon>
						</InputGroup>

						<div className="flex gap-2">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										type="button"
										variant="outline"
										onClick={() => refetch()}
										disabled={isFetching}
										size="icon"
									>
										{isFetching ? (
											<RefreshSpinner className="size-4" />
										) : (
											<RefreshCcwIcon className="size-4" />
										)}
									</Button>
								</TooltipTrigger>
								<TooltipContent>{t(LocaleKeys.users_refresh)}</TooltipContent>
							</Tooltip>
						</div>
					</div>

					<div className="w-full max-w-full overflow-x-auto">
						<UsersTable
							isLoading={isLoading}
							users={users}
							filter={filter}
							onFilterChange={handleFilterChange}
						/>
					</div>
				</CardContent>

				{(pagination || isLoading) && (
					<CardFooter className="flex items-center justify-between">
						<span className="text-muted-foreground text-sm">
							{pagination
								? t(LocaleKeys.users_pagination_page, {
										current: filter.page,
										total: pagination.totalPage,
									})
								: null}
						</span>
						<Pagination className="mx-0 w-auto">
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious
										onClick={() => handlePageChange(filter.page - 1)}
										aria-disabled={filter.page <= 1 || isLoading}
										className={
											filter.page <= 1 || isLoading
												? "pointer-events-none opacity-50"
												: "cursor-pointer"
										}
									/>
								</PaginationItem>

								{getPageNumbers().map((pageNum, index) =>
									pageNum === "ellipsis" ? (
										<PaginationItem key={`ellipsis-${index}`}>
											<PaginationEllipsis />
										</PaginationItem>
									) : (
										<PaginationItem key={pageNum}>
											<PaginationLink
												onClick={() => handlePageChange(pageNum)}
												isActive={filter.page === pageNum}
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
										onClick={() => handlePageChange(filter.page + 1)}
										aria-disabled={
											!pagination ||
											filter.page >= pagination.totalPage ||
											isLoading
										}
										className={
											!pagination ||
											filter.page >= pagination.totalPage ||
											isLoading
												? "pointer-events-none opacity-50"
												: "cursor-pointer"
										}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</CardFooter>
				)}
			</Card>
		</div>
	);
}
