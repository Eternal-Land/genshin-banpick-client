import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Controller, type UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import type { AxiosProgressEvent } from "axios";
import { staffRolesApi } from "@/apis/staff-roles";
import { filesApi } from "@/apis/files";
import type { StaffRoleResonse } from "@/apis/staff-roles/types";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocaleKeys } from "@/lib/constants";

export interface StaffFormValues {
  avatar?: string;
  displayName: string;
  email: string;
  ingameUuid?: string;
  staffRoleId?: number;
  password?: string;
}

export interface StaffFormProps {
  formId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  isLoading?: boolean;
  showPassword?: boolean;
  onSubmit: (values: StaffFormValues) => void;
}

export default function StaffForm({
  formId,
  form,
  isLoading,
  showPassword = false,
  onSubmit,
}: StaffFormProps) {
  const { t } = useTranslation();
  const [fileNeedUpload, setFileNeedUpload] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const { data: staffRolesResponse, isLoading: isRolesLoading } = useQuery({
    queryKey: ["staff-roles"],
    queryFn: staffRolesApi.listStaffRoles,
  });

  const staffRoles = staffRolesResponse?.data ?? [];
  const staffRoleCount = useMemo(() => staffRoles.length, [staffRoles]);

  const handleOnFilesChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files.item(0)!;
    setFileNeedUpload(file);
    setProgress(0);
  };

  const handleFormSubmit = async (values: StaffFormValues) => {
    let avatarUrl = values.avatar;

    if (fileNeedUpload) {
      const handleUploadProgress = (e: AxiosProgressEvent) => {
        setProgress((e.progress ?? 0) * 100);
      };
      const uploadResult = await filesApi.uploadFile(
        fileNeedUpload,
        handleUploadProgress,
      );
      avatarUrl = uploadResult.secure_url;
    }

    onSubmit({ ...values, avatar: avatarUrl });
  };

  return (
    <>
      <span className="text-muted-foreground text-xs">
        {t(LocaleKeys.staffs_role_count, { count: staffRoleCount })}
      </span>
      <form id={formId} onSubmit={form.handleSubmit(handleFormSubmit)}>
        <FieldGroup>
          <Controller
            name="avatar"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  {t(LocaleKeys.staffs_avatar_label)}
                </FieldLabel>
                {isLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <>
                    <Input {...field} id={field.name} type="hidden" />
                    <Input
                      type="file"
                      onChange={(event) =>
                        handleOnFilesChange(event.target.files)
                      }
                    />
                    {progress ? <Progress value={progress} /> : null}
                  </>
                )}
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="displayName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  {t(LocaleKeys.staffs_display_name_label)}
                </FieldLabel>
                {isLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder={t(LocaleKeys.staffs_display_name_placeholder)}
                  />
                )}
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  {t(LocaleKeys.staffs_email_label)}
                </FieldLabel>
                {isLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder={t(LocaleKeys.staffs_email_placeholder)}
                    type="email"
                  />
                )}
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="ingameUuid"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  {t(LocaleKeys.staffs_ingame_uid_label)}
                </FieldLabel>
                {isLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder={t(LocaleKeys.staffs_ingame_uid_placeholder)}
                  />
                )}
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="staffRoleId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="staff-role-select">
                  {t(LocaleKeys.staffs_staff_role_label)}
                </FieldLabel>
                <FieldDescription>
                  {t(LocaleKeys.staffs_staff_role_description)}
                </FieldDescription>
                {isRolesLoading || isLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <Select
                    name={field.name}
                    value={field.value != undefined ? String(field.value) : ""}
                    onValueChange={(values) =>
                      field.onChange(values ? Number(values) : undefined)
                    }
                  >
                    <SelectTrigger
                      id="staff-role-select"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue
                        placeholder={t(
                          LocaleKeys.staffs_staff_role_placeholder,
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {staffRoles.map((role: StaffRoleResonse) => (
                        <SelectItem key={role.id} value={String(role.id)}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          {showPassword && (
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    {t(LocaleKeys.staffs_password_label)}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    type="password"
                    placeholder={t(LocaleKeys.staffs_password_placeholder)}
                  />
                  <FieldDescription>
                    {t(LocaleKeys.staffs_password_description)}
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          )}
        </FieldGroup>
      </form>
    </>
  );
}
