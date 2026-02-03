import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Controller, type UseFormReturn } from "react-hook-form";
import type { AxiosProgressEvent } from "axios";
import { filesApi } from "@/apis/files";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LocaleKeys,
  UploadFolder,
  type CharacterElementEnum,
  type WeaponTypeEnum,
} from "@/lib/constants";
import { useElementOptions } from "@/hooks/use-element-label";
import { useWeaponTypeOptions } from "@/hooks/use-weapon-type-label";

export interface CharacterFormValues {
  key: string;
  name: string;
  element: CharacterElementEnum;
  weaponType: WeaponTypeEnum;
  rarity: number;
  iconUrl?: string;
}

export interface CharacterFormProps {
  formId: string;
  form: UseFormReturn<CharacterFormValues>;
  isLoading?: boolean;
  onSubmit: (values: CharacterFormValues) => void;
}

export default function CharacterForm({
  formId,
  form,
  isLoading,
  onSubmit,
}: CharacterFormProps) {
  const { t } = useTranslation();
  const [fileNeedUpload, setFileNeedUpload] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const elementOptions = useElementOptions();
  const weaponTypeOptions = useWeaponTypeOptions();

  const handleOnFilesChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files.item(0)!;
    setFileNeedUpload(file);
    setProgress(0);
  };

  const handleFormSubmit = async (values: CharacterFormValues) => {
    let iconUrl = values.iconUrl;

    if (fileNeedUpload) {
      const handleUploadProgress = (e: AxiosProgressEvent) => {
        setProgress((e.progress ?? 0) * 100);
      };
      const uploadResult = await filesApi.uploadFile(
        UploadFolder.CHARACTERS,
        fileNeedUpload,
        handleUploadProgress,
      );
      iconUrl = uploadResult.secure_url;
    }

    onSubmit({ ...values, iconUrl });
  };

  return (
    <form id={formId} onSubmit={form.handleSubmit(handleFormSubmit)}>
      <FieldGroup>
        <Controller
          name="key"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                {t(LocaleKeys.characters_key_label)}
              </FieldLabel>
              {isLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder={t(LocaleKeys.characters_key_placeholder)}
                />
              )}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
              {isLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder={t(LocaleKeys.characters_name_placeholder)}
                />
              )}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
              {isLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
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
                      placeholder={t(LocaleKeys.characters_element_placeholder)}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {elementOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
              {isLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
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
                      placeholder={t(LocaleKeys.characters_weapon_placeholder)}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {weaponTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="rarity"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="character-rarity-select">
                {t(LocaleKeys.characters_rarity_label)}
              </FieldLabel>
              {isLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Select
                  name={field.name}
                  value={field.value != undefined ? String(field.value) : ""}
                  onValueChange={(value) => field.onChange(Number(value))}
                >
                  <SelectTrigger
                    id="character-rarity-select"
                    className="w-full"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue
                      placeholder={t(LocaleKeys.characters_rarity_placeholder)}
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {[4, 5].map((rarity) => (
                      <SelectItem key={rarity} value={String(rarity)}>
                        {rarity}★
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="iconUrl"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="character-icon-input">
                {t(LocaleKeys.characters_icon_label)}
              </FieldLabel>
              {isLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <>
                  <Input {...field} id={field.name} type="hidden" />
                  <Input
                    id="character-icon-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleOnFilesChange(e.target.files)}
                  />
                  {progress ? <Progress value={progress} /> : null}
                </>
              )}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
}
