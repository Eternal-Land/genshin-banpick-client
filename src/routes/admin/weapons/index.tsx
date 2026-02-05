import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { weaponApis } from "@/apis/weapons";
import {
	weaponQuerySchema,
	type WeaponQuery,
	type WeaponResponse,
} from "@/apis/weapons/types";
import type { BaseApiResponse } from "@/lib/types";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { PlusIcon, RefreshCcwIcon, SearchIcon } from "lucide-react";
import { RefreshSpinner } from "@/components/ui/spinner";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { useTranslation } from "react-i18next";
import { LocaleKeys } from "@/lib/constants";
import { WeaponsTable, WeaponToggleDialog } from "@/components/weapons";

export const Route = createFileRoute("/admin/weapons/")({
	component: RouteComponent,
	validateSearch: zodValidator(weaponQuerySchema),
});

function RouteComponent() {
	const { t } = useTranslation();
	const filter = Route.useSearch();
	const navigate = Route.useNavigate();
	const [search, setSearch] = useState(filter.search || "");
	const [confirmTarget, setConfirmTarget] = useState<WeaponResponse | null>(
		null,
	);

	const {
		data: weaponsResponse,
		isLoading,
		isFetching,
		error,
		refetch,
	} = useQuery({
		queryKey: ["weapons", filter],
		queryFn: () => weaponApis.listWeapons(filter),
	});

	const toggleMutation = useMutation<
		BaseApiResponse,
		AxiosError<BaseApiResponse>,
		string
	>({
		mutationFn: (id) => weaponApis.toggleActive(id),
		onSuccess: () => {
			toast.success(t(LocaleKeys.weapons_status_updated));
			refetch();
			setConfirmTarget(null);
		},
		onError: (mutationError) => {
			toast.error(
				mutationError.response?.data.message ||
					t(LocaleKeys.weapons_status_update_error),
			);
		},
	});

	const weapons = weaponsResponse?.data ?? [];

	const handleFilterChange = (newFilter: WeaponQuery) => {
		navigate({
			search: newFilter,
			replace: true,
		});
	};

	const triggerSearchEffect = useDebounce((v: string) => {
		handleFilterChange({
			...filter,
			search: v,
		});
	}, 500);

	const handleSearchChange = (v: string) => {
		setSearch(v);
		triggerSearchEffect(v);
	};

	const handleConfirmToggle = () => {
		if (!confirmTarget) return;
		toggleMutation.mutate(confirmTarget.id.toString());
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>{t(LocaleKeys.weapons_title)}</CardTitle>
					<CardDescription className="flex flex-wrap items-center gap-2">
						<span>
							{t(LocaleKeys.weapons_count, { count: weapons.length })}
						</span>
						{error ? (
							<span className="text-destructive">
								{t(LocaleKeys.weapons_load_error)}
							</span>
						) : null}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<InputGroup>
							<InputGroupInput
								placeholder={t(LocaleKeys.weapons_search_placeholder)}
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
								<TooltipContent>{t(LocaleKeys.weapons_refresh)}</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button asChild size="icon">
										<Link to="/admin/weapons/create">
											<PlusIcon className="size-4" />
										</Link>
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									{t(LocaleKeys.weapons_create_new)}
								</TooltipContent>
							</Tooltip>
						</div>
					</div>

					<div className="w-full max-w-full overflow-x-auto">
						<WeaponsTable
							isLoading={isLoading}
							weapons={weapons}
							onActivateDeactivate={setConfirmTarget}
							filter={filter}
							onFilterChange={handleFilterChange}
						/>
					</div>
				</CardContent>
			</Card>

			<WeaponToggleDialog
				weapon={confirmTarget}
				isPending={toggleMutation.isPending}
				onConfirm={handleConfirmToggle}
				onCancel={() => setConfirmTarget(null)}
			/>
		</div>
	);
}
