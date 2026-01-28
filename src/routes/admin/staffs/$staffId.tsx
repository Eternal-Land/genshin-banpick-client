import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AxiosError, type AxiosProgressEvent } from "axios";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { staffsApi } from "@/apis/staffs";
import { staffRolesApi } from "@/apis/staff-roles";
import { updateStaffSchema, type UpdateStaffInput } from "@/apis/staffs/types";
import { filesApi } from "@/apis/files";
import type { StaffRoleResonse } from "@/apis/staff-roles/types";
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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { LocaleKeys } from "@/lib/constants";

export const Route = createFileRoute("/admin/staffs/$staffId")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { staffId } = Route.useParams();
  const [fileNeedUpload, setFileNeedUpload] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);

  type UpdateStaffFormInput = z.input<typeof updateStaffSchema>;
  const form = useForm<UpdateStaffFormInput>({
    resolver: zodResolver(updateStaffSchema),
    defaultValues: {
      email: "",
      displayName: "",
      ingameUuid: "",
      staffRoleId: undefined,
      avatar: undefined,
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

  const { data: staffRolesResponse, isLoading: isRolesLoading } = useQuery({
    queryKey: ["staff-roles"],
    queryFn: staffRolesApi.listStaffRoles,
  });

  const staffRoles = staffRolesResponse?.data ?? [];

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

    form.setValue("staffRoleId", staff.staffRoleId);
  }, [form, staffResponse, staffRolesResponse]);

  const updateMutation = useMutation<
    BaseApiResponse,
    AxiosError<BaseApiResponse>,
    UpdateStaffFormInput
  >({
    mutationFn: async (values) => {
      let avatarUrl = values.avatar;

      if (fileNeedUpload) {
        const uploadResult = await filesApi.uploadFile(
          fileNeedUpload,
          handleUploadProgress,
        );
        avatarUrl = uploadResult.secure_url;
      }

      const payload: UpdateStaffInput = {
        email: values.email,
        displayName: values.displayName,
        ingameUuid: values.ingameUuid || undefined,
        staffRoleId: values.staffRoleId,
        avatar: avatarUrl || undefined,
      };

      return staffsApi.updateStaff(staffId, payload);
    },
    onSuccess: () => {
      toast.success(t(LocaleKeys.staffs_edit_success));
      navigate({ to: "/admin/staffs" });
    },
  });

  const handleUploadProgress = (e: AxiosProgressEvent) => {
    setProgress((e.progress ?? 0) * 100);
  };

  const handleOnFilesChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files.item(0)!;
    setFileNeedUpload(file);
    setProgress(0);
  };

  const staffRoleCount = useMemo(() => staffRoles.length, [staffRoles]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(LocaleKeys.staffs_edit_title)}</CardTitle>
        <CardDescription className="space-y-1">
          <span>{t(LocaleKeys.staffs_edit_description)}</span>
          <span className="text-xs">
            {t(LocaleKeys.staffs_role_count, { count: staffRoleCount })}
          </span>
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
        <form
          id="staff-update-form"
          onSubmit={form.handleSubmit((values) =>
            updateMutation.mutate(values),
          )}
        >
          <FieldGroup>
            <Controller
              name="avatar"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    {t(LocaleKeys.staffs_avatar_label)}
                  </FieldLabel>
                  {isStaffLoading ? (
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
                  {isStaffLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder={t(
                        LocaleKeys.staffs_display_name_placeholder,
                      )}
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
                  {isStaffLoading ? (
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
                  {isStaffLoading ? (
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
                  {isRolesLoading || isStaffLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Select
                      name={field.name}
                      value={
                        field.value != undefined ? String(field.value) : ""
                      }
                      onValueChange={(values) =>
                        field.onChange(values ? Number(values) : field.value)
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
          </FieldGroup>
        </form>
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
