import { useEffect, useMemo } from "react";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { permissionsApi } from "@/apis/permissions";
import { staffRolesApi } from "@/apis/staff-roles";
import {
  updateStaffRoleSchema,
  type UpdateStaffRoleInput,
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

export const Route = createFileRoute("/admin/staff-roles/$staffRoleId")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { staffRoleId } = Route.useParams();
  const roleId = Number(staffRoleId);

  type UpdateStaffRoleFormInput = z.input<typeof updateStaffRoleSchema>;
  const form = useForm<UpdateStaffRoleFormInput>({
    resolver: zodResolver(updateStaffRoleSchema),
    defaultValues: {
      name: "",
      isActive: true,
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

  const { data: permissionsResponse, isLoading: isPermissionsLoading } =
    useQuery<BaseApiResponse<PermissionResponse[]>>({
      queryKey: ["permissions"],
      queryFn: permissionsApi.listPermissions,
    });

  const permissions = permissionsResponse?.data ?? [];

  useEffect(() => {
    const staffRole = staffRoleResponse?.data;
    if (!staffRole) return;

    form.reset({
      name: staffRole.name,
      isActive: staffRole.isActive,
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
      toast.success("Staff role updated successfully.");
      navigate({ to: "/admin/staff-roles" });
    },
  });

  const permissionCount = useMemo(() => permissions.length, [permissions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit staff role</CardTitle>
        <CardDescription className="space-y-1">
          <span>Update role name, status, and permissions.</span>
          <span className="text-xs">
            {permissionCount} permission{permissionCount === 1 ? "" : "s"}{" "}
            available
          </span>
          {roleError ? (
            <span className="text-destructive">
              Failed to load staff role details.
            </span>
          ) : null}
          {updateMutation.isError && (
            <span className="text-destructive">
              {updateMutation.error.response?.data.message ||
                "Unable to update staff role."}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          id="staff-role-update-form"
          onSubmit={form.handleSubmit((values) =>
            updateMutation.mutate({
              name: values.name,
              isActive: values.isActive ?? true,
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
                  <FieldLabel htmlFor={field.name}>Role name</FieldLabel>
                  {isRoleLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="e.g. Match Moderator"
                    />
                  )}
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="isActive"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="staff-role-active"
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                  />
                  <FieldLabel htmlFor="staff-role-active">
                    Active role
                  </FieldLabel>
                </Field>
              )}
            />
            <Controller
              name="permissionIds"
              control={form.control}
              render={({ field, fieldState }) => (
                <FieldSet>
                  <FieldLegend>Permissions</FieldLegend>
                  <FieldDescription>
                    Select permissions granted to this role.
                  </FieldDescription>
                  {isPermissionsLoading || isRoleLoading ? (
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
                                {permission.description || "No description"}
                              </span>
                              {permission.deprecated ? (
                                <Badge variant="destructive">Deprecated</Badge>
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
          Cancel
        </Button>
        <Button
          type="submit"
          form="staff-role-update-form"
          disabled={updateMutation.isPending || isRoleLoading}
        >
          {updateMutation.isPending ? "Saving..." : "Save changes"}
        </Button>
      </CardFooter>
    </Card>
  );
}
