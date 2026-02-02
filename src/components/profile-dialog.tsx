import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AxiosError, type AxiosProgressEvent } from "axios";
import { toast } from "sonner";
import { selfApi } from "@/apis/self";
import { filesApi } from "@/apis/files";
import {
  updateProfileSchema,
  type ProfileResponse,
  type UpdateProfileInput,
} from "@/apis/self/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { LocaleKeys } from "@/lib/constants";
import { useAppDispatch } from "@/hooks/use-app-dispatch";
import { setProfile } from "@/lib/redux/auth.slice";
import type { BaseApiResponse } from "@/lib/types";

export interface ProfileDialogProps {
  profile: ProfileResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileDialog({
  profile,
  open,
  onOpenChange,
}: ProfileDialogProps) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [fileNeedUpload, setFileNeedUpload] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      displayName: "",
      ingameUuid: "",
      avatar: undefined,
    },
  });

  useEffect(() => {
    form.reset({
      displayName: profile.displayName ?? "",
      ingameUuid: profile.ingameUuid ?? "",
      avatar: profile.avatar ?? undefined,
    });
  }, [form, profile.avatar, profile.displayName, profile.ingameUuid]);

  const handleUploadProgress = (event: AxiosProgressEvent) => {
    setProgress((event.progress ?? 0) * 100);
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
    onSuccess: async () => {
      toast.success(t(LocaleKeys.profile_update_success));
      setErrorMsg(null);
      setFileNeedUpload(null);
      setProgress(0);
      onOpenChange(false);
      const response = await selfApi.getSelf();
      dispatch(setProfile(response.data ?? null));
    },
    onError: (error) => {
      setErrorMsg(
        error.response?.data.message || t(LocaleKeys.profile_update_error),
      );
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black text-white">
        <DialogHeader>
          <DialogTitle>{t(LocaleKeys.profile_update_title)}</DialogTitle>
          <DialogDescription className="text-white/70">
            {t(LocaleKeys.profile_description)}
          </DialogDescription>
        </DialogHeader>
        <form
          id="profile-dialog-form"
          onSubmit={form.handleSubmit((values) =>
            updateMutation.mutate(values),
          )}
        >
          <FieldGroup className="grid gap-6">
            <Controller
              name="avatar"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    {t(LocaleKeys.profile_avatar_label)}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="hidden"
                    disabled={updateMutation.isPending}
                  />
                  <Input
                    type="file"
                    accept="image/*"
                    className="text-muted-foreground file:border-input file:text-foreground p-0 pr-3 italic file:mr-3 file:h-full file:border-0 file:border-r file:border-solid file:bg-transparent file:px-3 file:text-sm file:font-medium file:not-italic"
                    onChange={(event) =>
                      handleOnFilesChange(event.target.files)
                    }
                    disabled={updateMutation.isPending}
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
                    {t(LocaleKeys.profile_display_name_label)}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder={t(LocaleKeys.profile_display_name_placeholder)}
                    disabled={updateMutation.isPending}
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
                    {t(LocaleKeys.profile_ingame_uid_label)}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder={t(LocaleKeys.profile_ingame_uid_placeholder)}
                    inputMode="numeric"
                    disabled={updateMutation.isPending}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Field>
              <FieldLabel>{t(LocaleKeys.profile_email_label)}</FieldLabel>
              <Input value={profile.email ?? ""} disabled />
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter className="items-center">
          {updateMutation.isError && errorMsg ? (
            <span className="text-sm text-destructive">{errorMsg}</span>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/30 text-white hover:bg-white/10"
          >
            {t(LocaleKeys.profile_dialog_close)}
          </Button>
          <Button
            type="submit"
            form="profile-dialog-form"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending
              ? t(LocaleKeys.profile_saving)
              : t(LocaleKeys.profile_save_changes)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
