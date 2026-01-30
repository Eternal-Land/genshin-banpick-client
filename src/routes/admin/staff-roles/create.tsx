import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { staffRolesApi } from "@/apis/staff-roles";
import {
  createStaffRoleSchema,
  type CreateStaffRoleInput,
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

export const Route = createFileRoute("/admin/staff-roles/create")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  type CreateStaffRoleFormInput = z.input<typeof createStaffRoleSchema>;
  const form = useForm<CreateStaffRoleFormInput>({
    resolver: zodResolver(createStaffRoleSchema),
    defaultValues: {
      name: "",
      permissionIds: [],
    },
  });

  const createMutation = useMutation<
    BaseApiResponse,
    AxiosError<BaseApiResponse>,
    CreateStaffRoleInput
  >({
    mutationFn: staffRolesApi.createStaffRole,
    onSuccess: () => {
      toast.success(t(LocaleKeys.staff_roles_create_success));
      navigate({ to: "/admin/staff-roles" });
    },
  });

  const handleSubmit = (values: StaffRoleFormValues) => {
    createMutation.mutate({
      name: values.name,
      permissionIds: values.permissionIds ?? [],
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(LocaleKeys.staff_roles_create_title)}</CardTitle>
        <CardDescription className="space-y-1">
          <span>{t(LocaleKeys.staff_roles_create_description)}</span>
          {createMutation.isError && (
            <span className="text-destructive">
              {createMutation.error.response?.data.message ||
                t(LocaleKeys.staff_roles_create_error)}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <StaffRoleForm
          formId="staff-role-create-form"
          form={form}
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
          form="staff-role-create-form"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending
            ? t(LocaleKeys.staff_roles_create_pending)
            : t(LocaleKeys.staff_roles_create_submit)}
        </Button>
      </CardFooter>
    </Card>
  );
}
