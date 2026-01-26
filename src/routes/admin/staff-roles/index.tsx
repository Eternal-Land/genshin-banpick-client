import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { staffRolesApi } from "@/apis/staff-roles";
import type { StaffRoleResonse } from "@/apis/staff-roles/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin/staff-roles/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [query, setQuery] = useState("");

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

  const staffRoles = staffRolesResponse?.data ?? [];

  const filteredRoles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return staffRoles;

    return staffRoles.filter((role) =>
      role.name.toLowerCase().includes(normalizedQuery),
    );
  }, [query, staffRoles]);

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
            <Input
              placeholder="Search by role name"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="sm:max-w-sm"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                {isFetching ? "Refreshing..." : "Refresh"}
              </Button>
              <Button asChild>
                <Link to="/admin/staff-roles/create">Create role</Link>
              </Button>
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
                          ? new Date(role.updatedAt).toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="outline" size="sm">
                          <Link
                            to="/admin/staff-roles/$staffRoleId"
                            params={{ staffRoleId: role.id.toString() }}
                          >
                            Edit
                          </Link>
                        </Button>
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
    </div>
  );
}
