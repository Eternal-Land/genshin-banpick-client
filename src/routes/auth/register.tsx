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
import { CheckIcon, EyeIcon, EyeOffIcon, XIcon } from "lucide-react";
import { filesApi } from "@/apis/files";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import { LocaleKeys } from "@/lib/constants";
import { cn } from "@/lib/utils";

const passwordRequirements = [
  {
    regex: /^.{6,30}$/,
    textKey: LocaleKeys.register_password_requirement_length,
  },
  {
    regex: /[a-z]/,
    textKey: LocaleKeys.register_password_requirement_lowercase,
  },
  {
    regex: /[A-Z]/,
    textKey: LocaleKeys.register_password_requirement_uppercase,
  },
  {
    regex: /[0-9]/,
    textKey: LocaleKeys.register_password_requirement_number,
  },
  {
    regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/,
    textKey: LocaleKeys.register_password_requirement_special,
  },
];

export const Route = createFileRoute("/auth/register")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [fileNeedUpload, setFileNeedUpload] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
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
      toast.success(t(LocaleKeys.register_success));
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
        setErrorMsg(t(LocaleKeys.register_error_unknown));
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

  const passwordValue = form.watch("password");
  const passwordStrength = passwordRequirements.map((requirement) => ({
    met: requirement.regex.test(passwordValue ?? ""),
    text: t(requirement.textKey),
  }));
  const strengthScore = passwordStrength.filter((item) => item.met).length;

  const getStrengthColor = (score: number) => {
    if (score === 0) return "bg-border";
    if (score <= 1) return "bg-destructive";
    if (score <= 2) return "bg-orange-500";
    if (score <= 3) return "bg-amber-500";
    if (score === 4) return "bg-yellow-400";
    return "bg-green-500";
  };

  const getStrengthText = (score: number) => {
    if (score === 0) return t(LocaleKeys.register_password_strength_empty);
    if (score <= 2) return t(LocaleKeys.register_password_strength_weak);
    if (score <= 3) return t(LocaleKeys.register_password_strength_medium);
    if (score === 4) return t(LocaleKeys.register_password_strength_strong);
    return t(LocaleKeys.register_password_strength_very_strong);
  };

  return (
    <Card className="bg-transparent bg-linear-45 from-white/5 to-white/10 backdrop-blur-md">
      <CardHeader>
        <CardTitle>{t(LocaleKeys.register_title)}</CardTitle>
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
                    {t(LocaleKeys.register_avatar_label)}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="hidden"
                    disabled={registerMutation.isPending}
                  />
                  <Input
                    type="file"
                    className="text-muted-foreground file:border-input file:text-foreground p-0 pr-3 italic file:mr-3 file:h-full file:border-0 file:border-r file:border-solid file:bg-transparent file:px-3 file:text-sm file:font-medium file:not-italic"
                    onChange={(e) => handleOnFilesChange(e.target.files)}
                    disabled={registerMutation.isPending}
                  />
                  {progress ? <Progress value={progress} /> : null}
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="displayName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      {t(LocaleKeys.register_display_name_label)}
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder={t(
                        LocaleKeys.register_display_name_placeholder,
                      )}
                      autoComplete="nickname"
                      disabled={registerMutation.isPending}
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
                      {t(LocaleKeys.register_ingame_uid_label)}
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder={t(LocaleKeys.register_ingame_uid_placeholder)}
                      autoComplete="off"
                      inputMode="numeric"
                      disabled={registerMutation.isPending}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    {t(LocaleKeys.register_email_label)}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="email"
                    aria-invalid={fieldState.invalid}
                    placeholder={t(LocaleKeys.register_email_placeholder)}
                    autoComplete="email"
                    disabled={registerMutation.isPending}
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
                    {t(LocaleKeys.register_password_label)}
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      {...field}
                      id={field.name}
                      type={isPasswordVisible ? "text" : "password"}
                      aria-invalid={fieldState.invalid}
                      placeholder={t(LocaleKeys.register_password_placeholder)}
                      autoComplete="new-password"
                      className="pr-9"
                        disabled={registerMutation.isPending}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsPasswordVisible((prev) => !prev)}
                      className="text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent"
                        disabled={registerMutation.isPending}
                    >
                      {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                      <span className="sr-only">
                        {isPasswordVisible
                          ? t(LocaleKeys.register_password_toggle_hide)
                          : t(LocaleKeys.register_password_toggle_show)}
                      </span>
                    </Button>
                  </div>
                  <div className="mb-2 mt-3 flex h-1 w-full gap-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span
                        key={index}
                        className={cn(
                          "h-full flex-1 rounded-full transition-all duration-500 ease-out",
                          index < strengthScore
                            ? getStrengthColor(strengthScore)
                            : "bg-border",
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-foreground text-xs font-medium">
                    {getStrengthText(strengthScore)}. {t(LocaleKeys.register_password_strength_hint)}
                  </p>
                  <ul className="mb-2 mt-2 space-y-1.5">
                    {passwordStrength.map((requirement, index) => (
                      <li key={index} className="flex items-center gap-2">
                        {requirement.met ? (
                          <CheckIcon className="size-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <XIcon className="text-muted-foreground size-4" />
                        )}
                        <span
                          className={cn(
                            "text-xs",
                            requirement.met
                              ? "text-green-600 dark:text-green-400"
                              : "text-muted-foreground",
                          )}
                        >
                          {requirement.text}
                          <span className="sr-only">
                            {requirement.met
                              ? t(LocaleKeys.register_password_requirement_met)
                              : t(LocaleKeys.register_password_requirement_unmet)}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
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
                    {t(LocaleKeys.register_confirm_password_label)}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="password"
                    aria-invalid={fieldState.invalid}
                    placeholder={t(
                      LocaleKeys.register_confirm_password_placeholder,
                    )}
                    autoComplete="new-password"
                    disabled={registerMutation.isPending}
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
            {t(LocaleKeys.register_have_account)}
          </span>
          <Link
            to="/auth/login"
            className="text-primary font-medium hover:underline"
          >
            {t(LocaleKeys.register_sign_in)}
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
            ? t(LocaleKeys.register_creating_account)
            : t(LocaleKeys.register_create_account)}
        </Button>
        <p className="text-muted-foreground text-xs text-center">
          {t(LocaleKeys.register_terms_notice)}
        </p>
      </CardFooter>
    </Card>
  );
}
