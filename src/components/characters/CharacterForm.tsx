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
import { LocaleKeys, CharacterElement, WeaponType } from "@/lib/constants";
import { useElementOptions } from "@/hooks/use-element-label";
import { useWeaponTypeOptions } from "@/hooks/use-weapon-type-label";

export interface CharacterFormValues {
  key: string;
  name: string;
  element: (typeof CharacterElement)[keyof typeof CharacterElement];
  weaponType: (typeof WeaponType)[keyof typeof WeaponType];
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
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const elementOptions = useElementOptions();
  const weaponTypeOptions = useWeaponTypeOptions();

  const handleUploadProgress = (e: AxiosProgressEvent) => {
    setProgress((e.progress ?? 0) * 100);
  };

  const handleOnFilesChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files.item(0)!;

    setIsUploading(true);
    try {
      const result = await filesApi.uploadFile(file, handleUploadProgress);
      form.setValue("iconUrl", result.secure_url);
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
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
              {isLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Input
                  {...field}
                  id={field.name}
                  type="number"
                  min={1}
                  max={5}
                  aria-invalid={fieldState.invalid}
                  placeholder={t(LocaleKeys.characters_rarity_placeholder)}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              )}
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
              <FieldLabel htmlFor="character-icon-input">
                {t(LocaleKeys.characters_icon_label)}
              </FieldLabel>
              {isLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <div className="space-y-2">
                  <Input
                    id="character-icon-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleOnFilesChange(e.target.files)}
                    disabled={isUploading}
                  />
                  {isUploading && <Progress value={progress} />}
                  {field.value && (
                    <div className="text-muted-foreground text-xs truncate">
                      {field.value}
                    </div>
                  )}
                </div>
              )}
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
}
