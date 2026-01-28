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
import { RefreshCcwIcon, SearchIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/admin/permissions/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
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
          <CardTitle>{t("permissions_title")}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            <span>
              {t("permissions_total", { count: permissions?.length ?? 0 })}
            </span>
            <Badge variant="secondary">
              {t("permissions_deprecated_count", { count: deprecatedCount })}
            </Badge>
            {error ? (
              <span className="text-destructive">
                {t("permissions_load_error")}
              </span>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <InputGroup>
              <InputGroupInput
                placeholder={t("permissions_search_placeholder")}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <SearchIcon className="size-4" />
              </InputGroupAddon>
            </InputGroup>
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
              <TooltipContent>{t("permissions_refresh")}</TooltipContent>
            </Tooltip>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">
                  {t("permissions_table_id")}
                </TableHead>
                <TableHead>{t("permissions_table_code")}</TableHead>
                <TableHead>{t("permissions_table_description")}</TableHead>
                <TableHead className="w-[140px]">
                  {t("permissions_table_status")}
                </TableHead>
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
                        {permission.description || t("permissions_no_desc")}
                      </TableCell>
                      <TableCell>
                        {permission.deprecated ? (
                          <Badge variant="destructive">
                            {t("permissions_status_deprecated")}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {t("permissions_status_active")}
                          </Badge>
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
                    {t("permissions_empty")}
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
