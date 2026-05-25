import { authApi } from "@/apis/auth";
import {
    forgotPasswordSchema,
    type ForgotPasswordInput,
} from "@/apis/auth/types";
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
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AxiosError } from "axios";
import type { BaseApiResponse } from "@/lib/types";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getTranslationToken } from "@/i18n/namespaces";
import { authLocaleKeys } from "@/i18n/keys";

export const Route = createFileRoute("/auth/forgot-password")({
    component: RouteComponent,
});

function RouteComponent() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const form = useForm<ForgotPasswordInput>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            ingameUuid: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const forgotPasswordMutation = useMutation<
        BaseApiResponse,
        AxiosError<BaseApiResponse>,
        ForgotPasswordInput
    >({
        mutationFn: authApi.forgotPassword,
        onSuccess: (response) => {
            setErrorMessage(null);
            toast.success(
                response.message ||
                t(getTranslationToken("auth", authLocaleKeys.forgot_password_success)),
            );
            navigate({ to: "/auth/login" });
        },
        onError: (error) => {
            const message =
                error.response?.data?.message ||
                t(
                    getTranslationToken(
                        "auth",
                        authLocaleKeys.login_error_generic,
                    ),
                );

            setErrorMessage(message);
            toast.error(message);
        },
    });

    return (
        <Card className="bg-transparent bg-linear-45 from-white/5 to-white/10 backdrop-blur-md">
            <CardHeader>
                <CardTitle>
                    {t(getTranslationToken("auth", authLocaleKeys.forgot_password_title))}
                </CardTitle>
                <CardDescription>
                    {errorMessage && forgotPasswordMutation.isError
                        ? errorMessage
                        : t(
                            getTranslationToken(
                                "auth",
                                authLocaleKeys.forgot_password_description,
                            ),
                        )}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                <form
                    id="forgot-password-form"
                    onSubmit={form.handleSubmit((values) =>
                        forgotPasswordMutation.mutate(values),
                    )}
                >
                    <FieldGroup className="space-y-4">
                        <Controller
                            name="ingameUuid"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        {t(
                                            getTranslationToken(
                                                "auth",
                                                authLocaleKeys.forgot_password_ingame_uid_label,
                                            ),
                                        )}
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id={field.name}
                                        aria-invalid={fieldState.invalid}
                                        placeholder={t(
                                            getTranslationToken(
                                                "auth",
                                                authLocaleKeys.forgot_password_ingame_uid_placeholder,
                                            ),
                                        )}
                                        inputMode="numeric"
                                        disabled={forgotPasswordMutation.isPending}
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
                                        {t(
                                            getTranslationToken(
                                                "auth",
                                                authLocaleKeys.forgot_password_email_label,
                                            ),
                                        )}
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id={field.name}
                                        type="email"
                                        aria-invalid={fieldState.invalid}
                                        placeholder={t(
                                            getTranslationToken(
                                                "auth",
                                                authLocaleKeys.forgot_password_email_placeholder,
                                            ),
                                        )}
                                        autoComplete="email"
                                        disabled={forgotPasswordMutation.isPending}
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
                                        {t(
                                            getTranslationToken(
                                                "auth",
                                                authLocaleKeys.forgot_password_password_label,
                                            ),
                                        )}
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id={field.name}
                                        type="password"
                                        aria-invalid={fieldState.invalid}
                                        placeholder={t(
                                            getTranslationToken(
                                                "auth",
                                                authLocaleKeys.forgot_password_password_placeholder,
                                            ),
                                        )}
                                        autoComplete="new-password"
                                        disabled={forgotPasswordMutation.isPending}
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
                                        {t(
                                            getTranslationToken(
                                                "auth",
                                                authLocaleKeys.forgot_password_confirm_password_label,
                                            ),
                                        )}
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id={field.name}
                                        type="password"
                                        aria-invalid={fieldState.invalid}
                                        placeholder={t(
                                            getTranslationToken(
                                                "auth",
                                                authLocaleKeys.forgot_password_confirm_password_placeholder,
                                            ),
                                        )}
                                        autoComplete="new-password"
                                        disabled={forgotPasswordMutation.isPending}
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
                    <Link
                        to="/auth/login"
                        className="text-primary font-medium hover:underline"
                    >
                        {t(
                            getTranslationToken(
                                "auth",
                                authLocaleKeys.forgot_password_back_to_login,
                            ),
                        )}
                    </Link>

                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-6">
                <Button
                    type="submit"
                    className="w-full"
                    form="forgot-password-form"
                    disabled={forgotPasswordMutation.isPending}
                >
                    {forgotPasswordMutation.isPending
                        ? t(
                            getTranslationToken(
                                "auth",
                                authLocaleKeys.forgot_password_submitting,
                            ),
                        )
                        : t(
                            getTranslationToken(
                                "auth",
                                authLocaleKeys.forgot_password_submit,
                            ),
                        )}
                </Button>
                <div className="flex items-center justify-between w-full">
                    <span className="text-muted-foreground">
                        {t(
                            getTranslationToken(
                                "auth",
                                authLocaleKeys.forgot_password_need_account,
                            ),
                        )}
                    </span>
                    <Link
                        to="/auth/register"
                        className="text-primary font-medium hover:underline"
                    >
                        {t(
                            getTranslationToken(
                                "auth",
                                authLocaleKeys.forgot_password_create_account,
                            ),
                        )}
                    </Link>
                </div>
            </CardFooter>
        </Card>
    );
}