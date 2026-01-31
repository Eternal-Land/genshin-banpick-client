import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { LocaleKeys } from "@/lib/constants";
import type { StaffRoleResonse } from "@/apis/staff-roles/types";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import dayjs from "dayjs";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";
import { Link } from "@tanstack/react-router";
import { BanIcon, PenIcon, SquareCheckIcon } from "lucide-react";

export interface StaffRolesTableProps {
  isLoading?: boolean;
  staffRoles?: StaffRoleResonse[];
  onActivateDeactivate?: (staffRole: StaffRoleResonse) => void;
}

export default function StaffRolesTable({
  isLoading,
  staffRoles,
  onActivateDeactivate,
}: StaffRolesTableProps) {
  const { t } = useTranslation();

  return (
    <Table className="w-full table-auto">
      <TableHeader>
        <TableRow>
          <TableHead>{t(LocaleKeys.staff_roles_table_name)}</TableHead>
          <TableHead className="w-30">
            {t(LocaleKeys.staff_roles_table_status)}
          </TableHead>
          <TableHead className="w-35">
            {t(LocaleKeys.staff_roles_table_permissions)}
          </TableHead>
          <TableHead>{t(LocaleKeys.staff_roles_table_updated_by)}</TableHead>
          <TableHead className="w-50">
            {t(LocaleKeys.staff_roles_table_updated_at)}
          </TableHead>
          <TableHead className="w-30">
            {t(LocaleKeys.staff_roles_table_action)}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`staff-role-skeleton-${index}`}>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-14" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-36" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
              </TableRow>
            ))
          : staffRoles?.map((staffRole) => (
              <TableRow key={staffRole.id}>
                <TableCell className="font-medium">{staffRole.name}</TableCell>
                <TableCell>
                  {staffRole.isActive ? (
                    <Badge variant="secondary">
                      {t(LocaleKeys.staff_roles_status_active)}
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      {t(LocaleKeys.staff_roles_status_inactive)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{staffRole.permissions.length}</TableCell>
                <TableCell>{staffRole.updatedBy?.displayName || "-"}</TableCell>
                <TableCell>
                  {staffRole.updatedAt
                    ? dayjs(staffRole.updatedAt).format("DD/MM/YYYY HH:mm")
                    : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button asChild variant="outline" size="icon-sm">
                          <Link
                            to="/admin/staff-roles/$staffRoleId"
                            params={{ staffRoleId: staffRole.id.toString() }}
                          >
                            <PenIcon className="size-3" />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t(LocaleKeys.staff_roles_edit_tooltip)}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant={
                            staffRole.isActive ? "destructive" : "secondary"
                          }
                          size="icon-sm"
                          disabled={isLoading}
                          onClick={() =>
                            onActivateDeactivate &&
                            onActivateDeactivate(staffRole)
                          }
                          className="cursor-pointer"
                        >
                          {staffRole.isActive ? (
                            <BanIcon className="size-3" />
                          ) : (
                            <SquareCheckIcon className="size-3" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {staffRole.isActive
                          ? t(LocaleKeys.staff_roles_deactivate_tooltip)
                          : t(LocaleKeys.staff_roles_activate_tooltip)}
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
