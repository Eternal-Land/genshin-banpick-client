import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/apis/auth/types";
import { authApi } from "@/apis/auth";
import { useMutation } from "@tanstack/react-query";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { AxiosError, type AxiosProgressEvent } from "axios";
import { toast } from "sonner";
import { useState } from "react";
import { filesApi } from "@/apis/files";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/auth/register")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [fileNeedUpload, setFileNeedUpload] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      ingameUuid: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerMutation = useMutation<void, any, RegisterInput>({
    mutationFn: async (input: RegisterInput) => {
      if (fileNeedUpload) {
        const uploadResult = await filesApi.uploadFile(
          fileNeedUpload,
          handleUploadProgress,
        );
        input.avatar = uploadResult.secure_url;
      }

      await authApi.register(input);
    },
    onSuccess: () => {
      toast.success(t("register_success"));
      navigate({ to: "/auth/login" });
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.data?.message) {
          setErrorMsg(error.response?.data?.message);
        } else {
          setErrorMsg(error.message);
        }
      } else {
        setErrorMsg(t("register_error_unknown"));
      }
    },
  });

  const handleUploadProgress = (e: AxiosProgressEvent) => {
    setProgress((e.progress ?? 0) * 100);
  };

  const handleOnFilesChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files.item(0)!;
    setFileNeedUpload(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("register_title")}</CardTitle>
        {registerMutation.isError && (
          <CardDescription className="text-destructive">
            {errorMsg}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        <form
          id="register-form"
          onSubmit={form.handleSubmit((values) =>
            registerMutation.mutate(values),
          )}
        >
          <FieldGroup>
            <Controller
              name="avatar"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    {t("register_avatar_label")}
                  </FieldLabel>
                  <Input {...field} id={field.name} type="hidden" />
                  <Input
                    type="file"
                    onChange={(e) => handleOnFilesChange(e.target.files)}
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
                    {t("register_display_name_label")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder={t("register_display_name_placeholder")}
                    autoComplete="nickname"
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
                    {t("register_ingame_uid_label")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder={t("register_ingame_uid_placeholder")}
                    autoComplete="off"
                    inputMode="numeric"
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
                    {t("register_email_label")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="email"
                    aria-invalid={fieldState.invalid}
                    placeholder={t("register_email_placeholder")}
                    autoComplete="email"
                  />
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
                    {t("register_password_label")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="password"
                    aria-invalid={fieldState.invalid}
                    placeholder={t("register_password_placeholder")}
                    autoComplete="new-password"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    {t("register_confirm_password_label")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="password"
                    aria-invalid={fieldState.invalid}
                    placeholder={t("register_confirm_password_placeholder")}
                    autoComplete="new-password"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t("register_have_account")}
          </span>
          <Link
            to="/auth/login"
            className="text-primary font-medium hover:underline"
          >
            {t("register_sign_in")}
          </Link>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button
          type="submit"
          className="w-full"
          form="register-form"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending
            ? t("register_creating_account")
            : t("register_create_account")}
        </Button>
        <p className="text-muted-foreground text-xs text-center">
          {t("register_terms_notice")}
        </p>
      </CardFooter>
    </Card>
  );
}
