import { useMemo, useState } from "react";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AxiosError, type AxiosProgressEvent } from "axios";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { staffsApi } from "@/apis/staffs";
import { staffRolesApi } from "@/apis/staff-roles";
import { createStaffSchema, type CreateStaffInput } from "@/apis/staffs/types";
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

export const Route = createFileRoute("/admin/staffs/create")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [fileNeedUpload, setFileNeedUpload] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  type CreateStaffFormInput = z.input<typeof createStaffSchema>;
  const form = useForm<CreateStaffFormInput>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      email: "",
      displayName: "",
      ingameUuid: "",
      staffRoleId: undefined,
      password: "",
    },
  });

  const { data: staffRolesResponse, isLoading: isRolesLoading } = useQuery({
    queryKey: ["staff-roles"],
    queryFn: staffRolesApi.listStaffRoles,
  });

  const staffRoles = staffRolesResponse?.data ?? [];

  const createMutation = useMutation<
    BaseApiResponse,
    AxiosError<BaseApiResponse>,
    CreateStaffFormInput
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

      const payload: CreateStaffInput = {
        email: values.email,
        displayName: values.displayName,
        ingameUuid: values.ingameUuid || undefined,
        staffRoleId: values.staffRoleId,
        password: values.password,
        avatar: avatarUrl || undefined,
      };

      return staffsApi.createStaff(payload);
    },
    onSuccess: () => {
      toast.success(t("staffs_create_success"));
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
        <CardTitle>{t("staffs_create_title")}</CardTitle>
        <CardDescription className="space-y-1">
          <span>{t("staffs_create_description")}</span>
          <span className="text-xs">
            {t("staffs_role_count", { count: staffRoleCount })}
          </span>
          {createMutation.isError && (
            <span className="text-destructive">
              {createMutation.error.response?.data.message ||
                t("staffs_create_error")}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          id="staff-create-form"
          onSubmit={form.handleSubmit((values) =>
            createMutation.mutate(values),
          )}
        >
          <FieldGroup>
            <Controller
              name="avatar"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    {t("staffs_avatar_label")}
                  </FieldLabel>
                  <Input {...field} id={field.name} type="hidden" />
                  <Input
                    type="file"
                    onChange={(event) =>
                      handleOnFilesChange(event.target.files)
                    }
                  />
                  {progress ? <Progress value={progress} /> : null}
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
                    {t("staffs_display_name_label")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder={t("staffs_display_name_placeholder")}
                  />
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
                    {t("staffs_email_label")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder={t("staffs_email_placeholder")}
                    type="email"
                  />
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
                    {t("staffs_ingame_uid_label")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder={t("staffs_ingame_uid_placeholder")}
                  />
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
                    {t("staffs_staff_role_label")}
                  </FieldLabel>
                  <FieldDescription>
                    {t("staffs_staff_role_description")}
                  </FieldDescription>
                  {isRolesLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Select
                      name={field.name}
                      value={
                        field.value != undefined ? String(field.value) : ""
                      }
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
                          placeholder={t("staffs_staff_role_placeholder")}
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
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    {t("staffs_password_label")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    type="password"
                    placeholder={t("staffs_password_placeholder")}
                  />
                  <FieldDescription>
                    {t("staffs_password_description")}
                  </FieldDescription>
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
          {t("staffs_cancel")}
        </Button>
        <Button
          type="submit"
          form="staff-create-form"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending
            ? t("staffs_create_pending")
            : t("staffs_create_submit")}
        </Button>
      </CardFooter>
    </Card>
  );
}
