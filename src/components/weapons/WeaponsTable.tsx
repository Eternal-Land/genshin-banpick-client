import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import dayjs from "dayjs";
import { BanIcon, PenIcon, SquareCheckIcon } from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	LocaleKeys,
	type WeaponRarityEnum,
	type WeaponTypeEnum,
} from "@/lib/constants";
import type { WeaponQuery, WeaponResponse } from "@/apis/weapons/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	useWeaponTypeLabel,
	useWeaponTypeOptions,
} from "@/hooks/use-weapon-type-label";
import {
	useWeaponRarityLabel,
	useWeaponRarityOptions,
} from "@/hooks/use-weapon-rarity-label";
import FilterTableHead from "../filter-table-head";

export interface WeaponsTableProps {
	isLoading?: boolean;
	weapons?: WeaponResponse[];
	onActivateDeactivate?: (weapon: WeaponResponse) => void;
	filter: WeaponQuery;
	onFilterChange?: (filter: WeaponQuery) => void;
}

export default function WeaponsTable({
	isLoading,
	weapons,
	onActivateDeactivate,
	filter,
	onFilterChange,
}: WeaponsTableProps) {
	const { t } = useTranslation();
	const weaponTypeLabelMap = useWeaponTypeLabel();
	const weaponRarityLabelMap = useWeaponRarityLabel();
	const weaponTypeOptions = useWeaponTypeOptions();
	const weaponRarityOptions = useWeaponRarityOptions();

	const getInitials = (name: string) =>
		name
			.split(" ")
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase())
			.join("");

	return (
		<Table className="w-full table-auto">
			<TableHeader>
				<TableRow>
					<TableHead>{t(LocaleKeys.weapons_table_icon)}</TableHead>
					<TableHead>{t(LocaleKeys.weapons_table_name)}</TableHead>
					<TableHead>{t(LocaleKeys.weapons_table_key)}</TableHead>
					<FilterTableHead
						label={t(LocaleKeys.weapons_table_type)}
						multiSelect
						options={weaponTypeOptions}
						value={filter?.type?.map(String)}
						onValueChange={(value) =>
							onFilterChange?.({
								...filter,
								type: value.map(Number) as WeaponTypeEnum[],
							})
						}
					/>
					<FilterTableHead
						label={t(LocaleKeys.weapons_table_rarity)}
						multiSelect
						options={weaponRarityOptions}
						value={filter?.rarity?.map(String)}
						onValueChange={(value) =>
							onFilterChange?.({
								...filter,
								rarity: value.map(Number) as WeaponRarityEnum[],
							})
						}
					/>
					<FilterTableHead
						label={t(LocaleKeys.weapons_table_status)}
						multiSelect
						options={[
							{
								label: t(LocaleKeys.weapons_status_active),
								value: "true",
							},
							{
								label: t(LocaleKeys.weapons_status_inactive),
								value: "false",
							},
						]}
						value={filter?.isActive?.map(String)}
						onValueChange={(value) =>
							onFilterChange?.({
								...filter,
								isActive: value.map((v) => v === "true"),
							})
						}
					/>
					<TableHead className="w-50">
						{t(LocaleKeys.weapons_table_updated_at)}
					</TableHead>
					<TableHead className="w-30">
						{t(LocaleKeys.weapons_table_action)}
					</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{isLoading
					? Array.from({ length: 5 }).map((_, index) => (
							<TableRow key={`weapon-skeleton-${index}`}>
								<TableCell>
									<Skeleton className="h-10 w-10 rounded-full" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-32" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-24" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-16" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-10" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-16" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-36" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-16" />
								</TableCell>
							</TableRow>
						))
					: weapons?.map((weapon) => (
							<TableRow key={weapon.id}>
								<TableCell>
									<Avatar className="size-10">
										<AvatarImage src={weapon.iconUrl} alt={weapon.name} />
										<AvatarFallback>{getInitials(weapon.name)}</AvatarFallback>
									</Avatar>
								</TableCell>
								<TableCell className="font-medium">{weapon.name}</TableCell>
								<TableCell className="text-muted-foreground">
									{weapon.key}
								</TableCell>
								<TableCell>
									{weaponTypeLabelMap[
										weapon.type as keyof typeof weaponTypeLabelMap
									] ?? "-"}
								</TableCell>
								<TableCell>
									{weaponRarityLabelMap[weapon.rarity] ?? "-"}
								</TableCell>
								<TableCell>
									{weapon.isActive ? (
										<Badge variant="secondary">
											{t(LocaleKeys.weapons_status_active)}
										</Badge>
									) : (
										<Badge variant="destructive">
											{t(LocaleKeys.weapons_status_inactive)}
										</Badge>
									)}
								</TableCell>
								<TableCell>
									{weapon.updatedAt
										? dayjs(weapon.updatedAt).format("DD/MM/YYYY HH:mm")
										: "-"}
								</TableCell>
								<TableCell>
									<div className="flex items-center gap-1">
										<Tooltip>
											<TooltipTrigger asChild>
												<Button asChild variant="outline" size="icon-sm">
													<Link
														to="/admin/weapons/$weaponId"
														params={{ weaponId: weapon.id.toString() }}
													>
														<PenIcon className="size-3" />
													</Link>
												</Button>
											</TooltipTrigger>
											<TooltipContent>
												{t(LocaleKeys.weapons_edit_tooltip)}
											</TooltipContent>
										</Tooltip>
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													type="button"
													variant={
														weapon.isActive ? "destructive" : "secondary"
													}
													size="icon-sm"
													disabled={isLoading}
													onClick={() =>
														onActivateDeactivate && onActivateDeactivate(weapon)
													}
													className="cursor-pointer"
												>
													{weapon.isActive ? (
														<BanIcon className="size-3" />
													) : (
														<SquareCheckIcon className="size-3" />
													)}
												</Button>
											</TooltipTrigger>
											<TooltipContent>
												{weapon.isActive
													? t(LocaleKeys.weapons_deactivate_tooltip)
													: t(LocaleKeys.weapons_activate_tooltip)}
											</TooltipContent>
										</Tooltip>
									</div>
								</TableCell>
							</TableRow>
						))}
			</TableBody>
		</Table>
	);
}
