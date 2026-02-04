import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import type { UserQuery, UserResponse } from "@/apis/users/types";
import { LocaleKeys } from "@/lib/constants";
import FilterTableHead from "@/components/filter-table-head";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Empty } from "@/components/ui/empty";

export interface UsersTableProps {
	isLoading?: boolean;
	users?: UserResponse[];
	filter: UserQuery;
	onFilterChange?: (filter: UserQuery) => void;
}

function getInitials(name: string) {
	return name
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join("");
}

export default function UsersTable({
	isLoading,
	users,
	filter,
	onFilterChange,
}: UsersTableProps) {
	const { t } = useTranslation();

	const statusFilterOptions = [
		{ label: t(LocaleKeys.users_status_active), value: "true" },
		{ label: t(LocaleKeys.users_status_inactive), value: "false" },
	];

	return (
		<Table className="w-full table-auto">
			<TableHeader>
				<TableRow>
					<TableHead>{t(LocaleKeys.users_table_name)}</TableHead>
					<TableHead>{t(LocaleKeys.users_table_email)}</TableHead>
					<TableHead>{t(LocaleKeys.users_table_ingame_uid)}</TableHead>
					<FilterTableHead
						label={t(LocaleKeys.users_table_status)}
						options={statusFilterOptions}
						multiSelect
						value={filter?.isActive?.map(String)}
						onValueChange={(value) =>
							onFilterChange?.({
								...filter,
								isActive: value.map((v) => v === "true"),
							})
						}
					/>
					<TableHead>{t(LocaleKeys.users_table_last_login)}</TableHead>
					<TableHead>{t(LocaleKeys.users_table_created_at)}</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{isLoading
					? Array.from({ length: 10 }).map((_, index) => (
							<TableRow key={`user-skeleton-${index}`}>
								<TableCell>
									<div className="flex items-center gap-3">
										<Skeleton className="size-9 rounded-full" />
										<Skeleton className="h-4 w-32" />
									</div>
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-40" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-24" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-16" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-24" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-28" />
								</TableCell>
							</TableRow>
						))
					: users?.map((user) => (
							<TableRow key={user.id}>
								<TableCell className="font-medium wrap-break-words">
									<div className="flex items-center gap-3">
										<Avatar className="size-9">
											<AvatarImage src={user.avatar} alt={user.displayName} />
											<AvatarFallback>
												{getInitials(user.displayName)}
											</AvatarFallback>
										</Avatar>
										<span>{user.displayName}</span>
									</div>
								</TableCell>
								<TableCell className="wrap-break-words">{user.email}</TableCell>
								<TableCell className="wrap-break-words">
									{user.ingameUuid || "-"}
								</TableCell>
								<TableCell>
									<Badge variant={user.isActive ? "success" : "destructive"}>
										{user.isActive
											? t(LocaleKeys.users_status_active)
											: t(LocaleKeys.users_status_inactive)}
									</Badge>
								</TableCell>
								<TableCell className="whitespace-nowrap">
									{user.lastLoginAt
										? dayjs(user.lastLoginAt).format("DD/MM/YYYY HH:mm")
										: "-"}
								</TableCell>
								<TableCell className="whitespace-nowrap">
									{dayjs(user.createdAt).format("DD/MM/YYYY HH:mm")}
								</TableCell>
							</TableRow>
						))}
				{!isLoading && (!users || users.length === 0) && (
					<TableRow>
						<TableCell colSpan={6}>
							<Empty>{t(LocaleKeys.users_empty)}</Empty>
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
}
