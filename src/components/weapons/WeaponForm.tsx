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
  type WeaponRarityEnum,
  type WeaponTypeEnum,
} from "@/lib/constants";
import { useWeaponTypeOptions } from "@/hooks/use-weapon-type-label";
import { useWeaponRarityOptions } from "@/hooks/use-weapon-rarity-label";

export interface WeaponFormValues {
  key: string;
  name: string;
  type: WeaponTypeEnum;
  rarity: WeaponRarityEnum;
  iconUrl?: string;
}

export interface WeaponFormProps {
  formId: string;
  form: UseFormReturn<WeaponFormValues>;
  isLoading?: boolean;
  onSubmit: (values: WeaponFormValues) => void;
}

export default function WeaponForm({
  formId,
  form,
  isLoading,
  onSubmit,
}: WeaponFormProps) {
  const { t } = useTranslation();
  const [fileNeedUpload, setFileNeedUpload] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const weaponTypeOptions = useWeaponTypeOptions();
  const weaponRarityOptions = useWeaponRarityOptions();

  const handleOnFilesChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files.item(0)!;
    setFileNeedUpload(file);
    setProgress(0);
  };

  const handleFormSubmit = async (values: WeaponFormValues) => {
    let iconUrl = values.iconUrl;

    if (fileNeedUpload) {
      const handleUploadProgress = (e: AxiosProgressEvent) => {
        setProgress((e.progress ?? 0) * 100);
      };
      const uploadResult = await filesApi.uploadFile(
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
                {t(LocaleKeys.weapons_key_label)}
              </FieldLabel>
              {isLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder={t(LocaleKeys.weapons_key_placeholder)}
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
                {t(LocaleKeys.weapons_name_label)}
              </FieldLabel>
              {isLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder={t(LocaleKeys.weapons_name_placeholder)}
                />
              )}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="type"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="weapon-type-select">
                {t(LocaleKeys.weapons_type_label)}
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
                    id="weapon-type-select"
                    className="w-full"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue
                      placeholder={t(LocaleKeys.weapons_type_placeholder)}
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
              <FieldLabel htmlFor="weapon-rarity-select">
                {t(LocaleKeys.weapons_rarity_label)}
              </FieldLabel>
              {isLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Select
                  name={field.name}
                  value={
                    field.value != undefined ? String(field.value) : undefined
                  }
                  onValueChange={(value) =>
                    field.onChange(value ? Number(value) : undefined)
                  }
                >
                  <SelectTrigger
                    id="weapon-rarity-select"
                    className="w-full"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue
                      placeholder={t(LocaleKeys.weapons_rarity_placeholder)}
                    />

                    <SelectContent>
                      {weaponRarityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectTrigger>
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
              <FieldLabel htmlFor="weapon-icon-input">
                {t(LocaleKeys.weapons_icon_label)}
              </FieldLabel>
              {isLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <>
                  <Input {...field} id={field.name} type="hidden" />
                  <Input
                    id="weapon-icon-input"
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
