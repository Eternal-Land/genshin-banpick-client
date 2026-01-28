import { useEffect } from "react";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { charactersApi } from "@/apis/characters";
import {
  updateCharacterSchema,
  type UpdateCharacterInput,
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { LocaleKeys } from "@/lib/constants";
import { useWeaponTypeOptions } from "@/hooks/use-weapon-type-label";
import { useElementOptions } from "@/hooks/use-element-label";

export const Route = createFileRoute("/admin/characters/$characterId")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { characterId } = Route.useParams();
  const id = Number(characterId);
  type UpdateCharacterFormInput = z.input<typeof updateCharacterSchema>;

  const form = useForm<UpdateCharacterFormInput>({
    resolver: zodResolver(updateCharacterSchema),
    defaultValues: {
      key: "",
      name: "",
      element: undefined,
      weaponType: undefined,
      iconUrl: "",
      rarity: undefined,
      isActive: undefined,
    },
  });

  const {
    data: characterResponse,
    isLoading: isCharacterLoading,
    error: characterError,
  } = useQuery({
    queryKey: ["character", id],
    queryFn: () => charactersApi.getCharacter(id),
    enabled: Number.isFinite(id) && id > 0,
  });

  useEffect(() => {
    const character = characterResponse?.data;
    if (!character) return;

    form.reset({
      key: character.key,
      name: character.name,
      element: character.element,
      weaponType: character.weaponType,
      iconUrl: character.iconUrl,
      rarity: character.rarity,
      isActive: character.isActive,
    });
  }, [characterResponse, form]);

  const elementOptions = useElementOptions();
  const weaponOptions = useWeaponTypeOptions();

  const updateMutation = useMutation<
    BaseApiResponse,
    AxiosError<BaseApiResponse>,
    UpdateCharacterInput
  >({
    mutationFn: (values) => charactersApi.updateCharacter(id, values),
    onSuccess: () => {
      toast.success(t(LocaleKeys.characters_edit_success));
      navigate({ to: "/admin/characters" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(LocaleKeys.characters_edit_title)}</CardTitle>
        <CardDescription className="space-y-1">
          <span>{t(LocaleKeys.characters_edit_description)}</span>
          {characterError ? (
            <span className="text-destructive">
              {t(LocaleKeys.characters_edit_load_error)}
            </span>
          ) : null}
          {updateMutation.isError && (
            <span className="text-destructive">
              {updateMutation.error.response?.data.message ||
                t(LocaleKeys.characters_edit_error)}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          id="character-update-form"
          onSubmit={form.handleSubmit((values) =>
            updateMutation.mutate({
              key: values.key,
              name: values.name,
              element: values.element,
              weaponType: values.weaponType,
              iconUrl: values.iconUrl,
              rarity: values.rarity,
              isActive: values.isActive,
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
                  {isCharacterLoading ? (
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
                  {isCharacterLoading ? (
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
                  {isCharacterLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Select
                      name={field.name}
                      value={
                        field.value != undefined ? String(field.value) : ""
                      }
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
                  {isCharacterLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Select
                      name={field.name}
                      value={
                        field.value != undefined ? String(field.value) : ""
                      }
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
                  <FieldLabel htmlFor={field.name}>
                    {t(LocaleKeys.characters_icon_label)}
                  </FieldLabel>
                  {isCharacterLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder={t(LocaleKeys.characters_icon_placeholder)}
                    />
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
                  {isCharacterLoading ? (
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
                      value={field.value ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        field.onChange(value ? Number(value) : undefined);
                      }}
                    />
                  )}
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
                  {isCharacterLoading ? (
                    <Skeleton className="h-4 w-20" />
                  ) : (
                    <>
                      <Checkbox
                        id="character-active"
                        checked={field.value ?? false}
                        onCheckedChange={(value) =>
                          field.onChange(value === true)
                        }
                      />
                      <FieldLabel htmlFor="character-active">
                        {t(LocaleKeys.characters_is_active_label)}
                      </FieldLabel>
                    </>
                  )}
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
          form="character-update-form"
          disabled={updateMutation.isPending || isCharacterLoading}
        >
          {updateMutation.isPending
            ? t(LocaleKeys.characters_edit_pending)
            : t(LocaleKeys.characters_edit_submit)}
        </Button>
      </CardFooter>
    </Card>
  );
}
