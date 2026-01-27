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

export const Route = createFileRoute("/admin/staff-roles/")({
  component: RouteComponent,
});

function RouteComponent() {
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
      toast.success("Staff role status updated.");
      refetch();
      setConfirmTarget(null);
    },
    onError: (mutationError) => {
      toast.error(
        mutationError.response?.data.message ||
          "Unable to update staff role status.",
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
          <CardTitle>Staff roles</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            <span>
              {staffRoles.length} role{staffRoles.length === 1 ? "" : "s"}
            </span>
            {error ? (
              <span className="text-destructive">
                Failed to load staff roles.
              </span>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <InputGroup>
              <InputGroupInput
                placeholder="Search by role name"
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
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild size="icon">
                    <Link to="/admin/staff-roles/create">
                      <PlusIcon className="size-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Create new staff role</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-30">Status</TableHead>
                <TableHead className="w-35">Permissions</TableHead>
                <TableHead>Updated by</TableHead>
                <TableHead className="w-50">Updated at</TableHead>
                <TableHead className="w-30">Action</TableHead>
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
                          <Badge variant="secondary">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Inactive</Badge>
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
                            <TooltipContent>Edit staff role</TooltipContent>
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
                                ? "Deactivate staff role"
                                : "Activate staff role"}
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
                    No staff roles found.
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
                ? "Deactivate staff role"
                : "Activate staff role"}
            </DialogTitle>
            <DialogDescription>
              {confirmTarget?.isActive
                ? `Are you sure you want to deactivate ${confirmTarget.name}?`
                : `Are you sure you want to activate ${confirmTarget?.name}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={confirmTarget?.isActive ? "destructive" : "secondary"}
              onClick={handleConfirmToggle}
              disabled={toggleMutation.isPending}
            >
              {toggleMutation.isPending
                ? "Updating..."
                : confirmTarget?.isActive
                  ? "Deactivate"
                  : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
