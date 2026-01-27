import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { permissionsApi } from "@/apis/permissions";
import type { PermissionResponse } from "@/apis/permissions/types";
import { Badge } from "@/components/ui/badge";
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
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshSpinner } from "@/components/ui/spinner";
import { RefreshCcwIcon } from "lucide-react";

export const Route = createFileRoute("/admin/permissions/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [query, setQuery] = useState("");

  const {
    data: permissions,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["listPermissions"],
    queryFn: async () => {
      const response = await permissionsApi.listPermissions();
      return response.data;
    },
  });

  const filteredPermissions = useMemo(() => {
    const list = permissions ?? [];
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return list;

    return list.filter((permission) =>
      [permission.code, permission.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [permissions, query]);

  const deprecatedCount = useMemo(() => {
    const list = permissions ?? [];
    return list.filter((permission) => permission.deprecated).length;
  }, [permissions]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            <span>
              {permissions?.length ?? 0} total permission
              {(permissions?.length ?? 0) === 1 ? "" : "s"}
            </span>
            <Badge variant="secondary">{deprecatedCount} deprecated</Badge>
            {error ? (
              <span className="text-destructive">
                Failed to load permissions.
              </span>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <Input
                placeholder="Search by code or description"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
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
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[140px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={`permission-skeleton-${index}`}>
                      <TableCell>
                        <Skeleton className="h-4 w-10" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    </TableRow>
                  ))
                : filteredPermissions.map((permission: PermissionResponse) => (
                    <TableRow key={permission.id}>
                      <TableCell>{permission.id}</TableCell>
                      <TableCell className="font-medium">
                        {permission.code}
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        {permission.description || "-"}
                      </TableCell>
                      <TableCell>
                        {permission.deprecated ? (
                          <Badge variant="destructive">Deprecated</Badge>
                        ) : (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}

              {!isLoading && filteredPermissions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground text-center"
                  >
                    No permissions found.
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
