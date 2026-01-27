import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError, type AxiosProgressEvent } from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { selfApi } from "@/apis/self";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/apis/self/types";
import type { BaseApiResponse } from "@/lib/types";
import { filesApi } from "@/apis/files";
import { ACCOUNT_ROLES } from "@/lib/constants/account-role";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/self/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [fileNeedUpload, setFileNeedUpload] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const {
    data: profileResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["self"],
    queryFn: selfApi.getSelf,
  });

  const profile = profileResponse?.data;

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      displayName: "",
      ingameUuid: "",
      avatar: undefined,
    },
  });

  useEffect(() => {
    if (!profile) return;
    form.reset({
      displayName: profile.displayName ?? "",
      ingameUuid: profile.ingameUuid ?? "",
      avatar: profile.avatar ?? undefined,
    });
  }, [profile, form]);

  const handleUploadProgress = (e: AxiosProgressEvent) => {
    setProgress((e.progress ?? 0) * 100);
  };

  const handleOnFilesChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files.item(0)!;
    setFileNeedUpload(file);
  };

  const updateMutation = useMutation<
    BaseApiResponse,
    AxiosError<BaseApiResponse>,
    UpdateProfileInput
  >({
    mutationFn: async (input) => {
      if (fileNeedUpload) {
        const uploadResult = await filesApi.uploadFile(
          fileNeedUpload,
          handleUploadProgress,
        );
        input.avatar = uploadResult.secure_url;
      }

      return selfApi.updateProfile(input);
    },
    onSuccess: () => {
      toast.success("Profile updated.");
      setErrorMsg(null);
      setFileNeedUpload(null);
      setProgress(0);
      refetch();
    },
    onError: (error) => {
      setErrorMsg(error.response?.data.message || "Unable to update profile.");
    },
  });

  const initials = useMemo(() => {
    if (!profile?.displayName) return "?";
    return profile.displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [profile?.displayName]);

  const roleLabel = useMemo(() => {
    if (!profile) return "";
    if (profile.role === ACCOUNT_ROLES.ADMIN) return "Admin";
    if (profile.role === ACCOUNT_ROLES.STAFF) return "Staff";
    return "User";
  }, [profile]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Manage your profile details and update your public info.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={profile?.avatar} alt={profile?.displayName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-lg font-semibold">
                {profile?.displayName || "Loading..."}
              </p>
              <p className="text-muted-foreground text-sm">
                {profile?.email || ""}
              </p>
            </div>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading profile...</p>
          ) : isError ? (
            <p className="text-destructive text-sm">
              Unable to load profile. Please refresh.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{roleLabel}</Badge>
              {profile?.staffRolename ? (
                <Badge variant="outline">{profile.staffRolename}</Badge>
              ) : null}
            </div>
          )}

          {profile?.permissions?.length ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Permissions</p>
              <div className="flex flex-wrap gap-2">
                {profile.permissions.map((permission) => (
                  <Badge key={permission} variant="outline">
                    {permission}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Update profile</CardTitle>
          {updateMutation.isError && errorMsg ? (
            <CardDescription className="text-destructive">
              {errorMsg}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-5">
          <form
            id="profile-form"
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
                    <FieldLabel htmlFor={field.name}>Avatar</FieldLabel>
                    <Input {...field} id={field.name} type="hidden" />
                    <Input
                      type="file"
                      accept="image/*"
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
                    <FieldLabel htmlFor={field.name}>Display name</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="Your in-game name"
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
                      inputMode="numeric"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input value={profile?.email ?? ""} disabled />
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading || updateMutation.isPending}
          >
            Refresh
          </Button>
          <Button
            type="submit"
            form="profile-form"
            disabled={isLoading || updateMutation.isPending}
          >
            {updateMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
