import { useMemo } from "react";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { permissionsApi } from "@/apis/permissions";
import { staffRolesApi } from "@/apis/staff-roles";
import {
  createStaffRoleSchema,
  type CreateStaffRoleInput,
} from "@/apis/staff-roles/types";
import type { PermissionResponse } from "@/apis/permissions/types";
import type { BaseApiResponse } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

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

  const { data: permissionsResponse, isLoading: isPermissionsLoading } =
    useQuery<BaseApiResponse<PermissionResponse[]>>({
      queryKey: ["permissions"],
      queryFn: permissionsApi.listPermissions,
    });

  const permissions = permissionsResponse?.data ?? [];

  const createMutation = useMutation<
    BaseApiResponse,
    AxiosError<BaseApiResponse>,
    CreateStaffRoleInput
  >({
    mutationFn: staffRolesApi.createStaffRole,
    onSuccess: () => {
      toast.success(t("staff_roles_create_success"));
      navigate({ to: "/admin/staff-roles" });
    },
  });

  const permissionCount = useMemo(() => permissions.length, [permissions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("staff_roles_create_title")}</CardTitle>
        <CardDescription className="space-y-1">
          <span>{t("staff_roles_create_description")}</span>
          <span className="text-xs">
            {t("staff_roles_permission_count", { count: permissionCount })}
          </span>
          {createMutation.isError && (
            <span className="text-destructive">
              {createMutation.error.response?.data.message ||
                t("staff_roles_create_error")}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          id="staff-role-create-form"
          onSubmit={form.handleSubmit((values) =>
            createMutation.mutate({
              name: values.name,
              permissionIds: values.permissionIds ?? [],
            }),
          )}
        >
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    {t("staff_roles_name_label")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder={t("staff_roles_name_placeholder")}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="permissionIds"
              control={form.control}
              render={({ field, fieldState }) => (
                <FieldSet>
                  <FieldLegend>
                    {t("staff_roles_permissions_label")}
                  </FieldLegend>
                  <FieldDescription>
                    {t("staff_roles_permissions_description")}
                  </FieldDescription>
                  {isPermissionsLoading ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div
                          key={`permission-skeleton-${index}`}
                          className="flex items-start gap-3"
                        >
                          <Skeleton className="mt-1 h-4 w-4" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {permissions.map((permission) => {
                        const checked = field.value?.includes(permission.id);
                        return (
                          <Field
                            key={permission.id}
                            orientation="horizontal"
                            className="items-start"
                          >
                            <Checkbox
                              id={`permission-${permission.id}`}
                              checked={checked}
                              onCheckedChange={(value) => {
                                if (value === true) {
                                  field.onChange([
                                    ...(field.value ?? []),
                                    permission.id,
                                  ]);
                                } else {
                                  field.onChange(
                                    (field.value ?? []).filter(
                                      (id) => id !== permission.id,
                                    ),
                                  );
                                }
                              }}
                            />
                            <FieldLabel
                              htmlFor={`permission-${permission.id}`}
                              className="flex flex-col items-start gap-1"
                            >
                              <span className="text-sm font-medium">
                                {permission.code}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {permission.description ||
                                  t("staff_roles_permission_no_description")}
                              </span>
                              {permission.deprecated ? (
                                <Badge variant="destructive">
                                  {t("staff_roles_permission_deprecated")}
                                </Badge>
                              ) : null}
                            </FieldLabel>
                          </Field>
                        );
                      })}
                    </div>
                  )}
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </FieldSet>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: "/admin/staff-roles" })}
        >
          {t("staff_roles_cancel")}
        </Button>
        <Button
          type="submit"
          form="staff-role-create-form"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending
            ? t("staff_roles_create_pending")
            : t("staff_roles_create_submit")}
        </Button>
      </CardFooter>
    </Card>
  );
}
