import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { createFileRoute, Link } from "@tanstack/react-router";
import { staffsApi } from "@/apis/staffs";
import type { StaffResponse } from "@/apis/staffs/types";
import type { BaseApiResponse } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { toast } from "sonner";
import {
  RefreshCcwIcon,
  SearchIcon,
  UserCheckIcon,
  UserPenIcon,
  UserPlusIcon,
  UserXIcon,
} from "lucide-react";
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
import { RefreshSpinner } from "@/components/ui/spinner";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { LocaleKeys } from "@/lib/constants";

export const Route = createFileRoute("/admin/staffs/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<StaffResponse | null>(
    null,
  );

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");

  const {
    data: staffsResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["staffs"],
    queryFn: staffsApi.listStaffs,
  });

  const toggleMutation = useMutation<
    BaseApiResponse,
    AxiosError<BaseApiResponse>,
    string
  >({
    mutationFn: (id) => staffsApi.toggleStaffActiveStatus(id),
    onSuccess: () => {
      toast.success(t(LocaleKeys.staffs_status_updated));
      refetch();
      setConfirmTarget(null);
    },
    onError: (mutationError) => {
      toast.error(
        mutationError.response?.data.message ||
          t(LocaleKeys.staffs_status_update_error),
      );
    },
  });

  const staffs = staffsResponse?.data ?? [];

  const filteredStaffs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return staffs;

    return staffs.filter((staff) =>
      [staff.displayName, staff.email, staff.staffRoleName]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [query, staffs]);

  const handleConfirmToggle = () => {
    if (!confirmTarget) return;
    toggleMutation.mutate(confirmTarget.id);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t(LocaleKeys.staffs_title)}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            <span>{t(LocaleKeys.staffs_count, { count: staffs.length })}</span>
            {error ? (
              <span className="text-destructive">
                {t(LocaleKeys.staffs_load_error)}
              </span>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 sm:flex-row sm:items-center sm:justify-between">
            <InputGroup>
              <InputGroupInput
                placeholder={t(LocaleKeys.staffs_search_placeholder)}
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
                <TooltipContent>{t(LocaleKeys.staffs_refresh)}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild size="icon">
                    <Link to="/admin/staffs/create">
                      <UserPlusIcon className="size-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t(LocaleKeys.staffs_create_new)}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="w-full max-w-full overflow-x-auto">
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
                  : filteredStaffs.map((staff: StaffResponse) => (
                      <TableRow key={staff.id}>
                        <TableCell className="font-medium break-words">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9">
                              <AvatarImage
                                src={staff.avatar}
                                alt={staff.displayName}
                              />
                              <AvatarFallback>
                                {getInitials(staff.displayName)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{staff.displayName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="break-words">
                          {staff.email}
                        </TableCell>
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
                            ? dayjs(staff.lastLoginAt).format(
                                "DD/MM/YYYY HH:mm",
                              )
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
                                <Button
                                  asChild
                                  variant="outline"
                                  size="icon-sm"
                                >
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
                                  variant={
                                    staff.isActive ? "destructive" : "secondary"
                                  }
                                  size="icon-sm"
                                  disabled={toggleMutation.isPending}
                                  onClick={() => setConfirmTarget(staff)}
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

                {!isLoading && filteredStaffs.length === 0 ? (
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
          </div>
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
                ? t(LocaleKeys.staffs_confirm_deactivate_title)
                : t(LocaleKeys.staffs_confirm_activate_title)}
            </DialogTitle>
            <DialogDescription>
              {confirmTarget?.isActive
                ? t(LocaleKeys.staffs_confirm_deactivate_desc, {
                    name: confirmTarget.displayName,
                  })
                : t(LocaleKeys.staffs_confirm_activate_desc, {
                    name: confirmTarget?.displayName,
                  })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmTarget(null)}
            >
              {t(LocaleKeys.staffs_cancel)}
            </Button>
            <Button
              type="button"
              variant={confirmTarget?.isActive ? "destructive" : "secondary"}
              onClick={handleConfirmToggle}
              disabled={toggleMutation.isPending}
            >
              {toggleMutation.isPending
                ? t(LocaleKeys.staffs_update_pending)
                : confirmTarget?.isActive
                  ? t(LocaleKeys.staffs_deactivate)
                  : t(LocaleKeys.staffs_activate)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
