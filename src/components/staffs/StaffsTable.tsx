import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import dayjs from "dayjs";
import { UserCheckIcon, UserPenIcon, UserXIcon } from "lucide-react";
import type { StaffResponse } from "@/apis/staffs/types";
import { LocaleKeys } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface StaffsTableProps {
  isLoading?: boolean;
  staffs?: StaffResponse[];
  isTogglePending?: boolean;
  onToggleStatus?: (staff: StaffResponse) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function StaffsTable({
  isLoading,
  staffs,
  isTogglePending,
  onToggleStatus,
}: StaffsTableProps) {
  const { t } = useTranslation();

  return (
    <Table className="w-full table-auto">
      <TableHeader>
        <TableRow>
          <TableHead>{t(LocaleKeys.staffs_table_name)}</TableHead>
          <TableHead>{t(LocaleKeys.staffs_table_email)}</TableHead>
          <TableHead>{t(LocaleKeys.staffs_table_role)}</TableHead>
          <TableHead>{t(LocaleKeys.staffs_table_status)}</TableHead>
          <TableHead>{t(LocaleKeys.staffs_table_last_login)}</TableHead>
          <TableHead>{t(LocaleKeys.staffs_table_created_at)}</TableHead>
          <TableHead>{t(LocaleKeys.staffs_table_action)}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`staff-skeleton-${index}`}>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
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
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
              </TableRow>
            ))
          : staffs?.map((staff) => (
              <TableRow key={staff.id}>
                <TableCell className="font-medium break-words">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9">
                      <AvatarImage src={staff.avatar} alt={staff.displayName} />
                      <AvatarFallback>
                        {getInitials(staff.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{staff.displayName}</span>
                  </div>
                </TableCell>
                <TableCell className="break-words">{staff.email}</TableCell>
                <TableCell className="break-words">
                  {staff.staffRoleName}
                </TableCell>
                <TableCell>
                  {staff.isActive ? (
                    <Badge variant="secondary">
                      {t(LocaleKeys.staffs_status_active)}
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      {t(LocaleKeys.staffs_status_inactive)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {staff.lastLoginAt
                    ? dayjs(staff.lastLoginAt).format("DD/MM/YYYY HH:mm")
                    : "-"}
                </TableCell>
                <TableCell>
                  {staff.createdAt
                    ? dayjs(staff.createdAt).format("DD/MM/YYYY HH:mm")
                    : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button asChild variant="outline" size="icon-sm">
                          <Link
                            to="/admin/staffs/$staffId"
                            params={{ staffId: staff.id }}
                          >
                            <UserPenIcon className="size-3" />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t(LocaleKeys.staffs_edit_tooltip)}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant={staff.isActive ? "destructive" : "secondary"}
                          size="icon-sm"
                          disabled={isTogglePending}
                          onClick={() => onToggleStatus?.(staff)}
                          className="cursor-pointer"
                        >
                          {staff.isActive ? (
                            <UserXIcon className="size-3" />
                          ) : (
                            <UserCheckIcon className="size-3" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {staff.isActive
                          ? t(LocaleKeys.staffs_deactivate_tooltip)
                          : t(LocaleKeys.staffs_activate_tooltip)}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}

        {!isLoading && (!staffs || staffs.length === 0) ? (
          <TableRow>
            <TableCell
              colSpan={7}
              className="text-muted-foreground text-center"
            >
              {t(LocaleKeys.staffs_empty)}
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}
