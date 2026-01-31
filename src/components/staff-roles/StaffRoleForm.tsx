import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Controller, type UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { permissionsApi } from "@/apis/permissions";
import type { PermissionResponse } from "@/apis/permissions/types";
import type { BaseApiResponse } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { LocaleKeys } from "@/lib/constants";
import PermissionsCheckboxList from "./PermissionsCheckboxList";

export interface StaffRoleFormValues {
  name: string;
  permissionIds?: number[];
}

export interface StaffRoleFormProps {
  formId: string;
  form: UseFormReturn<StaffRoleFormValues>;
  isNameLoading?: boolean;
  onSubmit: (values: StaffRoleFormValues) => void;
}

export default function StaffRoleForm({
  formId,
  form,
  isNameLoading,
  onSubmit,
}: StaffRoleFormProps) {
  const { t } = useTranslation();

  const { data: permissionsResponse, isLoading: isPermissionsLoading } =
    useQuery<BaseApiResponse<PermissionResponse[]>>({
      queryKey: ["permissions"],
      queryFn: permissionsApi.listPermissions,
    });

  const permissions = permissionsResponse?.data ?? [];

  const permissionCount = useMemo(() => permissions.length, [permissions]);

  return (
    <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                {t(LocaleKeys.staff_roles_name_label)}
              </FieldLabel>
              {isNameLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder={t(LocaleKeys.staff_roles_name_placeholder)}
                />
              )}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="permissionIds"
          control={form.control}
          render={({ field, fieldState }) => (
            <FieldSet>
              <FieldLegend>
                {t(LocaleKeys.staff_roles_permissions_label)}
              </FieldLegend>
              <FieldDescription>
                {t(LocaleKeys.staff_roles_permissions_description)}
              </FieldDescription>
              <span className="text-muted-foreground text-xs">
                {t(LocaleKeys.staff_roles_permission_count, {
                  count: permissionCount,
                })}
              </span>
              <PermissionsCheckboxList
                permissions={permissions}
                selectedIds={field.value ?? []}
                isLoading={isPermissionsLoading || isNameLoading}
                onChange={field.onChange}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </FieldSet>
          )}
        />
      </FieldGroup>
    </form>
  );
}
