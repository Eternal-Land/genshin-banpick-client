import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { createFileRoute, Link } from "@tanstack/react-router";
import { staffsApi } from "@/apis/staffs";
import type { StaffResponse } from "@/apis/staffs/types";
import type { BaseApiResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { RefreshCcwIcon, SearchIcon, UserPlusIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshSpinner } from "@/components/ui/spinner";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useTranslation } from "react-i18next";
import { LocaleKeys } from "@/lib/constants";
import { StaffsTable, StaffToggleDialog } from "@/components/staffs";

export const Route = createFileRoute("/admin/staffs/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<StaffResponse | null>(
    null,
  );

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
            <StaffsTable
              isLoading={isLoading}
              staffs={filteredStaffs}
              isTogglePending={toggleMutation.isPending}
              onToggleStatus={setConfirmTarget}
            />
          </div>
        </CardContent>
      </Card>

      <StaffToggleDialog
        staff={confirmTarget}
        isPending={toggleMutation.isPending}
        onConfirm={handleConfirmToggle}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
