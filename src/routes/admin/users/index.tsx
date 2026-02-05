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
import { RefreshSpinner } from "@/components/ui/spinner";
import TablePagination from "@/components/ui/table-pagination";
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
		handleFilterChange({
			...filter,
			page: newPage,
		});
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
					<CardFooter>
						<TablePagination
							page={filter.page}
							pagination={pagination}
							isLoading={isLoading}
							onPageChange={handlePageChange}
							className="w-full"
						/>
					</CardFooter>
				)}
			</Card>
		</div>
	);
}
