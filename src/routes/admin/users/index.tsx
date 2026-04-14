import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { RefreshCcwIcon, SearchIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usersApi } from "@/apis/users";
import { getTranslationToken } from "@/i18n/namespaces";
import { usersLocaleKeys } from "@/i18n/keys";
import type { BaseApiResponse } from "@/lib/types";
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
import { toast } from "sonner";
import {
	userQuerySchema,
	type UserQuery,
	type UserResponse,
} from "@/apis/users/types";
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

	const toggleStatusMutation = useMutation<
		BaseApiResponse,
		AxiosError<BaseApiResponse>,
		UserResponse
	>({
		mutationFn: (user) =>
			user.isActive
				? usersApi.deactivateUser(user.id)
				: usersApi.reactivateUser(user.id),
		onSuccess: (_response, user) => {
			toast.success(
				user.isActive
					? t(
							getTranslationToken(
								"users",
								usersLocaleKeys.users_deactivate_success,
							),
						)
					: t(
							getTranslationToken(
								"users",
								usersLocaleKeys.users_activate_success,
							),
						),
			);
			refetch();
		},
		onError: (mutationError, user) => {
			toast.error(
				mutationError.response?.data.message ||
					(user.isActive
						? t(
								getTranslationToken(
									"users",
									usersLocaleKeys.users_deactivate_error,
								),
							)
						: t(
								getTranslationToken(
									"users",
									usersLocaleKeys.users_activate_error,
								),
							)),
			);
		},
	});

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

	const handleToggleUserStatus = (user: UserResponse) => {
		toggleStatusMutation.mutate(user);
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>
						{t(getTranslationToken("users", usersLocaleKeys.users_title))}
					</CardTitle>
					<CardDescription className="flex flex-wrap items-center gap-2">
						<span>
							{pagination
								? t(getTranslationToken("users", usersLocaleKeys.users_count), {
										count: pagination.totalRecord,
									})
								: null}
						</span>
						{error ? (
							<span className="text-destructive">
								{t(
									getTranslationToken(
										"users",
										usersLocaleKeys.users_load_error,
									),
								)}
							</span>
						) : null}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex gap-3 sm:flex-row sm:items-center sm:justify-between">
						<InputGroup>
							<InputGroupInput
								placeholder={t(
									getTranslationToken(
										"users",
										usersLocaleKeys.users_search_placeholder,
									),
								)}
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
								<TooltipContent>
									{t(
										getTranslationToken("users", usersLocaleKeys.users_refresh),
									)}
								</TooltipContent>
							</Tooltip>
						</div>
					</div>

					<div className="w-full max-w-full overflow-x-auto">
						<UsersTable
							isLoading={isLoading}
							isToggleStatusPending={toggleStatusMutation.isPending}
							users={users}
							filter={filter}
							onFilterChange={handleFilterChange}
							onToggleUserStatus={handleToggleUserStatus}
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
