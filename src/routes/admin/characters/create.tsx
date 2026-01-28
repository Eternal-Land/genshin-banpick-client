import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AxiosError, type AxiosProgressEvent } from "axios";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { charactersApi } from "@/apis/characters";
import {
  createCharacterSchema,
  type CreateCharacterInput,
} from "@/apis/characters/types";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useState } from "react";
import { filesApi } from "@/apis/files";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import { LocaleKeys } from "@/lib/constants";
import { useElementOptions } from "@/hooks/use-element-label";
import { useWeaponTypeOptions } from "@/hooks/use-weapon-type-label";

export const Route = createFileRoute("/admin/characters/create")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [fileNeedUpload, setFileNeedUpload] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  type CreateCharacterFormInput = z.input<typeof createCharacterSchema>;

  const form = useForm<CreateCharacterFormInput>({
    resolver: zodResolver(createCharacterSchema),
    defaultValues: {
      key: "",
      name: "",
      element: undefined,
      weaponType: undefined,
      iconUrl: "",
      rarity: 5,
      isActive: true,
    },
  });

  const elementOptions = useElementOptions();
  const weaponOptions = useWeaponTypeOptions();

  const createMutation = useMutation<
    BaseApiResponse,
    AxiosError<BaseApiResponse>,
    CreateCharacterInput
  >({
    mutationFn: async (input: CreateCharacterInput) => {
      if (fileNeedUpload) {
        const uploadResult = await filesApi.uploadFile(
          fileNeedUpload,
          handleUploadProgress,
        );
        input.iconUrl = uploadResult.secure_url;
      }

      return charactersApi.createCharacter(input);
    },
    onSuccess: () => {
      toast.success(t(LocaleKeys.characters_create_success));
      navigate({ to: "/admin/characters" });
    },
    onError: (mutationError) => {
      toast.error(
        mutationError.response?.data.message ||
          t(LocaleKeys.characters_create_error),
      );
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
        <CardTitle>{t(LocaleKeys.characters_create_title)}</CardTitle>
        <CardDescription className="space-y-1">
          <span>{t(LocaleKeys.characters_create_description)}</span>
          {createMutation.isError && (
            <span className="text-destructive">
              {createMutation.error.response?.data.message ||
                t(LocaleKeys.characters_create_error)}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          id="character-create-form"
          onSubmit={form.handleSubmit((values) =>
            createMutation.mutate({
              key: values.key,
              name: values.name,
              element: values.element,
              weaponType: values.weaponType,
              iconUrl: values.iconUrl,
              rarity: values.rarity,
              isActive: values.isActive ?? true,
            }),
          )}
        >
          <FieldGroup>
            <Controller
              name="key"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    {t(LocaleKeys.characters_key_label)}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder={t(LocaleKeys.characters_key_placeholder)}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    {t(LocaleKeys.characters_name_label)}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder={t(LocaleKeys.characters_name_placeholder)}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="element"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="character-element-select">
                    {t(LocaleKeys.characters_element_label)}
                  </FieldLabel>
                  <Select
                    name={field.name}
                    value={field.value != undefined ? String(field.value) : ""}
                    onValueChange={(value) =>
                      field.onChange(value ? Number(value) : undefined)
                    }
                  >
                    <SelectTrigger
                      id="character-element-select"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue
                        placeholder={t(
                          LocaleKeys.characters_element_placeholder,
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {elementOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={String(option.value)}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="weaponType"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="character-weapon-select">
                    {t(LocaleKeys.characters_weapon_label)}
                  </FieldLabel>
                  <Select
                    name={field.name}
                    value={field.value != undefined ? String(field.value) : ""}
                    onValueChange={(value) =>
                      field.onChange(value ? Number(value) : undefined)
                    }
                  >
                    <SelectTrigger
                      id="character-weapon-select"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue
                        placeholder={t(
                          LocaleKeys.characters_weapon_placeholder,
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {weaponOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={String(option.value)}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="iconUrl"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    {t(LocaleKeys.characters_icon_label)}
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
              name="rarity"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    {t(LocaleKeys.characters_rarity_label)}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="number"
                    min={1}
                    max={5}
                    aria-invalid={fieldState.invalid}
                    placeholder={t(LocaleKeys.characters_rarity_placeholder)}
                    value={field.value ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      field.onChange(value ? Number(value) : undefined);
                    }}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="isActive"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal" className="items-center">
                  <Checkbox
                    id="character-active"
                    checked={field.value ?? false}
                    onCheckedChange={(value) => field.onChange(value === true)}
                  />
                  <FieldLabel htmlFor="character-active">
                    {t(LocaleKeys.characters_is_active_label)}
                  </FieldLabel>
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
          onClick={() => navigate({ to: "/admin/characters" })}
        >
          {t(LocaleKeys.characters_cancel)}
        </Button>
        <Button
          type="submit"
          form="character-create-form"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending
            ? t(LocaleKeys.characters_create_pending)
            : t(LocaleKeys.characters_create_submit)}
        </Button>
      </CardFooter>
    </Card>
  );
}
