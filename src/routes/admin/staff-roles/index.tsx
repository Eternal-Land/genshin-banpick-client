import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { createFileRoute, Link } from "@tanstack/react-router";
import { staffRolesApi } from "@/apis/staff-roles";
import type { StaffRoleResonse } from "@/apis/staff-roles/types";
import type { BaseApiResponse } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  BanIcon,
  PenIcon,
  PlusIcon,
  RefreshCcwIcon,
  SearchIcon,
  SquareCheckIcon,
} from "lucide-react";
import { RefreshSpinner } from "@/components/ui/spinner";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { LocaleKeys } from "@/lib/constants";

export const Route = createFileRoute("/admin/staff-roles/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<StaffRoleResonse | null>(
    null,
  );

  const {
    data: staffRolesResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["staff-roles"],
    queryFn: staffRolesApi.listStaffRoles,
  });

  const toggleMutation = useMutation<
    BaseApiResponse,
    AxiosError<BaseApiResponse>,
    number
  >({
    mutationFn: (id) => staffRolesApi.toggleStaffRoleActiveStatus(id),
    onSuccess: () => {
      toast.success(t(LocaleKeys.staff_roles_status_updated));
      refetch();
      setConfirmTarget(null);
    },
    onError: (mutationError) => {
      toast.error(
        mutationError.response?.data.message ||
          t(LocaleKeys.staff_roles_status_update_error),
      );
    },
  });

  const staffRoles = staffRolesResponse?.data ?? [];

  const filteredRoles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return staffRoles;

    return staffRoles.filter((role) =>
      role.name.toLowerCase().includes(normalizedQuery),
    );
  }, [query, staffRoles]);

  const handleConfirmToggle = () => {
    if (!confirmTarget) return;
    toggleMutation.mutate(confirmTarget.id);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t(LocaleKeys.staff_roles_title)}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            <span>
              {t(LocaleKeys.staff_roles_count, { count: staffRoles.length })}
            </span>
            {error ? (
              <span className="text-destructive">
                {t(LocaleKeys.staff_roles_load_error)}
              </span>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <InputGroup>
              <InputGroupInput
                placeholder={t(LocaleKeys.staff_roles_search_placeholder)}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
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
                  {t(LocaleKeys.staff_roles_refresh)}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild size="icon">
                    <Link to="/admin/staff-roles/create">
                      <PlusIcon className="size-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t(LocaleKeys.staff_roles_create_new)}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t(LocaleKeys.staff_roles_table_name)}</TableHead>
                <TableHead className="w-30">
                  {t(LocaleKeys.staff_roles_table_status)}
                </TableHead>
                <TableHead className="w-35">
                  {t(LocaleKeys.staff_roles_table_permissions)}
                </TableHead>
                <TableHead>
                  {t(LocaleKeys.staff_roles_table_updated_by)}
                </TableHead>
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
                : filteredRoles.map((role: StaffRoleResonse) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>
                        {role.isActive ? (
                          <Badge variant="secondary">
                            {t(LocaleKeys.staff_roles_status_active)}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            {t(LocaleKeys.staff_roles_status_inactive)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{role.permissions.length}</TableCell>
                      <TableCell>
                        {role.updatedBy?.displayName || "-"}
                      </TableCell>
                      <TableCell>
                        {role.updatedAt
                          ? dayjs(role.updatedAt).format("DD/MM/YYYY HH:mm")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button asChild variant="outline" size="icon-sm">
                                <Link
                                  to="/admin/staff-roles/$staffRoleId"
                                  params={{ staffRoleId: role.id.toString() }}
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
                                  role.isActive ? "destructive" : "secondary"
                                }
                                size="icon-sm"
                                disabled={toggleMutation.isPending}
                                onClick={() => setConfirmTarget(role)}
                                className="cursor-pointer"
                              >
                                {role.isActive ? (
                                  <BanIcon className="size-3" />
                                ) : (
                                  <SquareCheckIcon className="size-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {role.isActive
                                ? t(LocaleKeys.staff_roles_deactivate_tooltip)
                                : t(LocaleKeys.staff_roles_activate_tooltip)}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

              {!isLoading && filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground text-center"
                  >
                    {t(LocaleKeys.staff_roles_empty)}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog
        open={Boolean(confirmTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmTarget(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmTarget?.isActive
                ? t(LocaleKeys.staff_roles_confirm_deactivate_title)
                : t(LocaleKeys.staff_roles_confirm_activate_title)}
            </DialogTitle>
            <DialogDescription>
              {confirmTarget?.isActive
                ? t(LocaleKeys.staff_roles_confirm_deactivate_desc, {
                    name: confirmTarget.name,
                  })
                : t(LocaleKeys.staff_roles_confirm_activate_desc, {
                    name: confirmTarget?.name,
                  })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmTarget(null)}
            >
              {t(LocaleKeys.staff_roles_cancel)}
            </Button>
            <Button
              type="button"
              variant={confirmTarget?.isActive ? "destructive" : "secondary"}
              onClick={handleConfirmToggle}
              disabled={toggleMutation.isPending}
            >
              {toggleMutation.isPending
                ? t(LocaleKeys.staff_roles_update_pending)
                : confirmTarget?.isActive
                  ? t(LocaleKeys.staff_roles_deactivate)
                  : t(LocaleKeys.staff_roles_activate)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
