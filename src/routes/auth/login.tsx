import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardDescription,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { basicLoginSchema, type BasicLoginInput } from "@/apis/auth/types";
import { authApi } from "@/apis/auth";
import { useMutation } from "@tanstack/react-query";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { AxiosError } from "axios";
import type { BaseApiResponse } from "@/lib/types";
import { toast } from "sonner";
import { AccountRole } from "@/lib/constants";
import { getTranslationToken } from "@/i18n/namespaces";
import { authLocaleKeys } from "@/i18n/keys";
import { useAppDispatch } from "@/hooks/use-app-dispatch";
import { setProfile } from "@/lib/redux/auth.slice";
import { selfApi } from "@/apis/self";
import { useTranslation } from "react-i18next";
import { socket } from "@/lib/socket";

export const Route = createFileRoute("/auth/login")({
	component: RouteComponent,
});

function RouteComponent() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const form = useForm<BasicLoginInput>({
		resolver: zodResolver(basicLoginSchema),
		defaultValues: {
			ingameUuidOrEmail: "",
			password: "",
		},
	});

	const handlePostLogin = async () => {
		socket.disconnect().connect();
		const response = await selfApi.getSelf();
		const profile = response.data;
		dispatch(setProfile(profile!));
		if (profile?.role === AccountRole.USER) {
			navigate({
				to: "/match",
				search: {
					page: 1,
					take: 10,
				},
			})
		} else {
			navigate({ to: "/admin" });
		}
	}

	const loginMutation = useMutation<
		BaseApiResponse<{ accessToken: string }>,
		AxiosError<BaseApiResponse>,
		BasicLoginInput
	>({
		mutationFn: authApi.basicLogin,
		onSuccess: (response) => {
			const token = response.data?.accessToken;
			if (token) {
				localStorage.setItem("token", token);
				toast.success("Logged in successfully.");
				handlePostLogin();
			}
		},
	});

	return (
		<Card className="bg-transparent bg-linear-45 from-white/5 to-white/10 backdrop-blur-md">
			<CardHeader>
				<CardTitle>
					{t(getTranslationToken("auth", authLocaleKeys.login_welcome))}
				</CardTitle>
				{loginMutation.isError && (
					<CardDescription className="text-destructive">
						{loginMutation.error.response?.data.message ||
							t(
								getTranslationToken("auth", authLocaleKeys.login_error_generic),
							)}
					</CardDescription>
				)}
			</CardHeader>
			<CardContent className="space-y-5">
				<form
					id="login-form"
					onSubmit={form.handleSubmit((values) => loginMutation.mutate(values))}
				>
					<FieldGroup className="space-y-4">
						<Controller
							name="ingameUuidOrEmail"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor={field.name}>
										{t(
											getTranslationToken(
												"auth",
												authLocaleKeys.login_uid_or_email_label,
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
												authLocaleKeys.login_uid_or_email_placeholder,
											),
										)}
										autoComplete="username"
										disabled={loginMutation.isPending}
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
												authLocaleKeys.login_password_label,
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
												authLocaleKeys.login_password_placeholder,
											),
										)}
										autoComplete="current-password"
										disabled={loginMutation.isPending}
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
						{t(getTranslationToken("auth", authLocaleKeys.login_need_account))}
					</span>
					<Link
						to="/auth/register"
						className="text-primary font-medium hover:underline"
					>
						{t(getTranslationToken("auth", authLocaleKeys.login_create_one))}
					</Link>
				</div>
			</CardContent>
			<CardFooter className="flex flex-col gap-3">
				<Button
					type="submit"
					className="w-full"
					form="login-form"
					disabled={loginMutation.isPending}
				>
					{loginMutation.isPending
						? t(getTranslationToken("auth", authLocaleKeys.login_signing_in))
						: t(getTranslationToken("auth", authLocaleKeys.login_sign_in))}
				</Button>
			</CardFooter>
		</Card>
	)
}
