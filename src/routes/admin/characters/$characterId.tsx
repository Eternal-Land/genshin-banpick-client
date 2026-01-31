import { useEffect, useState } from "react";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { charactersApi } from "@/apis/characters";
import {
  createCharacterSchema,
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
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { LocaleKeys } from "@/lib/constants";
import { CharacterForm, type CharacterFormValues } from "@/components/characters";

export const Route = createFileRoute("/admin/characters/$characterId")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { characterId } = Route.useParams();
  const [isFormReady, setIsFormReady] = useState(false);

  type CharacterFormInput = z.input<typeof createCharacterSchema>;
  const form = useForm<CharacterFormInput>({
    resolver: zodResolver(createCharacterSchema),
    defaultValues: {
      key: "",
      name: "",
      element: undefined,
      weaponType: undefined,
      rarity: 5,
      iconUrl: undefined,
    },
  });

  const {
    data: characterResponse,
    isLoading: isCharacterLoading,
    error: characterError,
  } = useQuery({
    queryKey: ["character", characterId],
    queryFn: () => charactersApi.getCharacter(Number(characterId)),
    enabled: Boolean(characterId),
  });

  useEffect(() => {
    const character = characterResponse?.data;
    if (!character) return;

    form.reset({
      key: character.key,
      name: character.name,
      element: character.element,
      weaponType: character.weaponType,
      rarity: character.rarity,
      iconUrl: character.iconUrl ?? undefined,
    });
    setIsFormReady(true);
  }, [form, characterResponse]);

  const updateMutation = useMutation<
    BaseApiResponse,
    AxiosError<BaseApiResponse>,
    UpdateCharacterInput
  >({
    mutationFn: (input: UpdateCharacterInput) =>
      charactersApi.updateCharacter(Number(characterId), input),
    onSuccess: () => {
      toast.success(t(LocaleKeys.characters_edit_success));
      navigate({ to: "/admin/characters" });
    },
    onError: (mutationError) => {
      toast.error(
        mutationError.response?.data.message ||
          t(LocaleKeys.characters_edit_error),
      );
    },
  });

  const handleSubmit = (values: CharacterFormValues) => {
    updateMutation.mutate({
      key: values.key,
      name: values.name,
      element: values.element!,
      weaponType: values.weaponType!,
      rarity: values.rarity,
      iconUrl: values.iconUrl,
    });
  };

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
      <CardContent>
        <CharacterForm
          formId="character-update-form"
          form={form}
          isLoading={isCharacterLoading || !isFormReady}
          onSubmit={handleSubmit}
        />
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
          disabled={updateMutation.isPending || !isFormReady}
        >
          {updateMutation.isPending
            ? t(LocaleKeys.characters_edit_pending)
            : t(LocaleKeys.characters_edit_submit)}
        </Button>
      </CardFooter>
    </Card>
  );
}
