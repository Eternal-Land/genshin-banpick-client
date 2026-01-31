import { useEffect } from "react";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { staffRolesApi } from "@/apis/staff-roles";
import {
  updateStaffRoleSchema,
  type UpdateStaffRoleInput,
} from "@/apis/staff-roles/types";
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
import {
  StaffRoleForm,
  type StaffRoleFormValues,
} from "@/components/staff-roles";

export const Route = createFileRoute("/admin/staff-roles/$staffRoleId")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { staffRoleId } = Route.useParams();
  const roleId = Number(staffRoleId);

  type UpdateStaffRoleFormInput = z.input<typeof updateStaffRoleSchema>;
  const form = useForm<UpdateStaffRoleFormInput>({
    resolver: zodResolver(updateStaffRoleSchema),
    defaultValues: {
      name: "",
      permissionIds: [],
    },
  });

  const {
    data: staffRoleResponse,
    isLoading: isRoleLoading,
    error: roleError,
  } = useQuery({
    queryKey: ["staff-role", roleId],
    queryFn: () => staffRolesApi.getStaffRole(roleId),
    enabled: Number.isFinite(roleId) && roleId > 0,
  });

  useEffect(() => {
    const staffRole = staffRoleResponse?.data;
    if (!staffRole) return;

    form.reset({
      name: staffRole.name,
      permissionIds: staffRole.permissions.map((permission) => permission.id),
    });
  }, [form, staffRoleResponse]);

  const updateMutation = useMutation<
    BaseApiResponse,
    AxiosError<BaseApiResponse>,
    UpdateStaffRoleInput
  >({
    mutationFn: (values) => staffRolesApi.updateStaffRole(roleId, values),
    onSuccess: () => {
      toast.success(t(LocaleKeys.staff_roles_edit_success));
      navigate({ to: "/admin/staff-roles" });
    },
  });

  const handleSubmit = (values: StaffRoleFormValues) => {
    updateMutation.mutate({
      name: values.name,
      permissionIds: values.permissionIds ?? [],
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(LocaleKeys.staff_roles_edit_title)}</CardTitle>
        <CardDescription className="space-y-1">
          <span>{t(LocaleKeys.staff_roles_edit_description)}</span>
          {roleError ? (
            <span className="text-destructive">
              {t(LocaleKeys.staff_roles_edit_load_error)}
            </span>
          ) : null}
          {updateMutation.isError && (
            <span className="text-destructive">
              {updateMutation.error.response?.data.message ||
                t(LocaleKeys.staff_roles_edit_error)}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <StaffRoleForm
          formId="staff-role-update-form"
          form={form}
          isNameLoading={isRoleLoading}
          onSubmit={handleSubmit}
        />
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: "/admin/staff-roles" })}
        >
          {t(LocaleKeys.staff_roles_cancel)}
        </Button>
        <Button
          type="submit"
          form="staff-role-update-form"
          disabled={updateMutation.isPending || isRoleLoading}
        >
          {updateMutation.isPending
            ? t(LocaleKeys.staff_roles_edit_pending)
            : t(LocaleKeys.staff_roles_edit_submit)}
        </Button>
      </CardFooter>
    </Card>
  );
}
