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
import { AxiosError } from "axios";
import type { BaseApiResponse } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/register")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
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

  const registerMutation = useMutation<
    any,
    AxiosError<BaseApiResponse>,
    RegisterInput
  >({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast.success("Account created successfully. You can now log in.");
      navigate({ to: "/auth/login" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        {registerMutation.isError && (
          <CardDescription className="text-destructive">
            {registerMutation.error.response?.data.message ||
              "An error occurred during registration."}
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
              name="displayName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Display name</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="Your in-game name"
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
                  <FieldLabel htmlFor={field.name}>In-game UID</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="e.g. 800123456"
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
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="email"
                    aria-invalid={fieldState.invalid}
                    placeholder="you@example.com"
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
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="password"
                    aria-invalid={fieldState.invalid}
                    placeholder="Create a secure password"
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
                  <FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="password"
                    aria-invalid={fieldState.invalid}
                    placeholder="Re-enter your password"
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
            Already have an account?
          </span>
          <Link
            to="/auth/login"
            className="text-primary font-medium hover:underline"
          >
            Sign in
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
            ? "Creating account..."
            : "Create account"}
        </Button>
        <p className="text-muted-foreground text-xs text-center">
          By registering, you accept the team&apos;s conduct and privacy terms.
        </p>
      </CardFooter>
    </Card>
  );
}
