import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { staffsApi } from "@/apis/staffs";
import { updateStaffSchema, type UpdateStaffInput } from "@/apis/staffs/types";
import type { BaseApiResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { LocaleKeys } from "@/lib/constants";
import { StaffForm, type StaffFormValues } from "@/components/staffs";

export const Route = createFileRoute("/admin/staffs/$staffId")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { staffId } = Route.useParams();

  const form = useForm({
    resolver: zodResolver(updateStaffSchema),
    defaultValues: {
      email: "",
      displayName: "",
      ingameUuid: "",
      staffRoleId: undefined as number | undefined,
      avatar: undefined as string | undefined,
    },
  });

  const {
    data: staffResponse,
    isLoading: isStaffLoading,
    error: staffError,
  } = useQuery({
    queryKey: ["staff", staffId],
    queryFn: () => staffsApi.getStaff(staffId),
    enabled: Boolean(staffId),
  });

  useEffect(() => {
    const staff = staffResponse?.data;
    if (!staff) return;

    form.reset({
      email: staff.email,
      displayName: staff.displayName,
      ingameUuid: staff.ingameUuid ?? "",
      staffRoleId: staff.staffRoleId,
      avatar: staff.avatar ?? undefined,
    });
  }, [form, staffResponse]);

  const updateMutation = useMutation<
    BaseApiResponse,
    AxiosError<BaseApiResponse>,
    UpdateStaffInput
  >({
    mutationFn: (payload) => staffsApi.updateStaff(staffId, payload),
    onSuccess: () => {
      toast.success(t(LocaleKeys.staffs_edit_success));
      navigate({ to: "/admin/staffs" });
    },
  });

  const handleSubmit = (values: StaffFormValues) => {
    const payload: UpdateStaffInput = {
      email: values.email,
      displayName: values.displayName,
      ingameUuid: values.ingameUuid || undefined,
      staffRoleId: values.staffRoleId!,
      avatar: values.avatar || undefined,
    };

    updateMutation.mutate(payload);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(LocaleKeys.staffs_edit_title)}</CardTitle>
        <CardDescription className="space-y-1">
          <span>{t(LocaleKeys.staffs_edit_description)}</span>
          {staffError ? (
            <span className="text-destructive">
              {t(LocaleKeys.staffs_edit_load_error)}
            </span>
          ) : null}
          {updateMutation.isError && (
            <span className="text-destructive">
              {updateMutation.error.response?.data.message ||
                t(LocaleKeys.staffs_edit_error)}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <StaffForm
          formId="staff-update-form"
          form={form}
          isLoading={isStaffLoading}
          onSubmit={handleSubmit}
        />
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: "/admin/staffs" })}
        >
          {t(LocaleKeys.staffs_cancel)}
        </Button>
        <Button
          type="submit"
          form="staff-update-form"
          disabled={updateMutation.isPending || isStaffLoading}
        >
          {updateMutation.isPending
            ? t(LocaleKeys.staffs_edit_pending)
            : t(LocaleKeys.staffs_edit_submit)}
        </Button>
      </CardFooter>
    </Card>
  );
}
