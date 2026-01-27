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

export const Route = createFileRoute("/admin/staffs/")({
  component: RouteComponent,
});

function RouteComponent() {
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
      toast.success("Staff status updated.");
      refetch();
      setConfirmTarget(null);
    },
    onError: (mutationError) => {
      toast.error(
        mutationError.response?.data.message || "Unable to update status.",
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
          <CardTitle>Staffs</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            <span>
              {staffs.length} staff{staffs.length === 1 ? "" : "s"}
            </span>
            {error ? (
              <span className="text-destructive">Failed to load staffs.</span>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 sm:flex-row sm:items-center sm:justify-between">
            <InputGroup>
              <InputGroupInput
                placeholder="Search by name, email, or role"
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
                    <Link to="/admin/staffs/create">
                      <UserPlusIcon className="size-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Create new staff</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="w-full max-w-full overflow-x-auto">
            <Table className="w-full table-auto">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead>Created at</TableHead>
                  <TableHead>Action</TableHead>
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
                            <Badge variant="secondary">Active</Badge>
                          ) : (
                            <Badge variant="destructive">Inactive</Badge>
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
                              <TooltipContent>Edit Staff</TooltipContent>
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
                                  ? "Deactivate Staff"
                                  : "Activate Staff"}
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
                      No staffs found.
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
              {confirmTarget?.isActive ? "Deactivate staff" : "Activate staff"}
            </DialogTitle>
            <DialogDescription>
              {confirmTarget?.isActive
                ? `Are you sure you want to deactivate ${confirmTarget.displayName}?`
                : `Are you sure you want to activate ${confirmTarget?.displayName}?`}
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
