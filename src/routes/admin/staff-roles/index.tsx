import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { createFileRoute, Link } from "@tanstack/react-router";
import { staffRolesApi } from "@/apis/staff-roles";
import type { StaffRoleResonse } from "@/apis/staff-roles/types";
import type { BaseApiResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { PlusIcon, RefreshCcwIcon, SearchIcon } from "lucide-react";
import { RefreshSpinner } from "@/components/ui/spinner";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useTranslation } from "react-i18next";
import { LocaleKeys } from "@/lib/constants";
import {
  StaffRolesTable,
  StaffRoleToggleDialog,
} from "@/components/staff-roles";

export const Route = createFileRoute("/admin/staff-roles/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<StaffRoleResonse | null>(
    null,
  );

  const listStaffRolesQuery = useQuery({
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
      listStaffRolesQuery.refetch();
      setConfirmTarget(null);
    },
    onError: (mutationError) => {
      toast.error(
        mutationError.response?.data.message ||
          t(LocaleKeys.staff_roles_status_update_error),
      );
    },
  });

  const staffRoles = listStaffRolesQuery.data?.data ?? [];

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

  const isLoading = listStaffRolesQuery.isLoading || toggleMutation.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t(LocaleKeys.staff_roles_title)}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            <span>
              {t(LocaleKeys.staff_roles_count, { count: staffRoles.length })}
            </span>
            {listStaffRolesQuery.error ? (
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
                    onClick={() => listStaffRolesQuery.refetch()}
                    disabled={listStaffRolesQuery.isLoading}
                    size="icon"
                  >
                    {listStaffRolesQuery.isLoading ? (
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

          <StaffRolesTable
            isLoading={isLoading}
            staffRoles={filteredRoles}
            onActivateDeactivate={(staffRole) => setConfirmTarget(staffRole)}
          />
        </CardContent>
      </Card>

      <StaffRoleToggleDialog
        staffRole={confirmTarget}
        isPending={toggleMutation.isPending}
        onConfirm={handleConfirmToggle}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
