import { useTranslation } from "react-i18next";
import type { PermissionResponse } from "@/apis/permissions/types";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { LocaleKeys } from "@/lib/constants";

export interface PermissionsCheckboxListProps {
  permissions: PermissionResponse[];
  selectedIds: number[];
  isLoading?: boolean;
  onChange: (ids: number[]) => void;
}

export default function PermissionsCheckboxList({
  permissions,
  selectedIds,
  isLoading,
  onChange,
}: PermissionsCheckboxListProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
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
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {permissions.map((permission) => {
        const checked = selectedIds.includes(permission.id);
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
                  onChange([...selectedIds, permission.id]);
                } else {
                  onChange(selectedIds.filter((id) => id !== permission.id));
                }
              }}
            />
            <FieldLabel
              htmlFor={`permission-${permission.id}`}
              className="flex flex-col items-start gap-1"
            >
              <span className="text-sm font-medium">{permission.code}</span>
              <span className="text-muted-foreground text-xs">
                {permission.description ||
                  t(LocaleKeys.staff_roles_permission_no_description)}
              </span>
              {permission.deprecated ? (
                <Badge variant="destructive">
                  {t(LocaleKeys.staff_roles_permission_deprecated)}
                </Badge>
              ) : null}
            </FieldLabel>
          </Field>
        );
      })}
    </div>
  );
}
