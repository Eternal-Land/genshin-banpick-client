import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";
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
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { LocaleKeys } from "@/lib/constants";
import { CharacterForm, type CharacterFormValues } from "@/components/characters";

export const Route = createFileRoute("/admin/characters/create")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  type CreateCharacterFormInput = z.input<typeof createCharacterSchema>;
  const form = useForm<CreateCharacterFormInput>({
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

  const createMutation = useMutation<
    BaseApiResponse,
    AxiosError<BaseApiResponse>,
    CreateCharacterInput
  >({
    mutationFn: (input: CreateCharacterInput) => charactersApi.createCharacter(input),
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

  const handleSubmit = (values: CharacterFormValues) => {
    createMutation.mutate({
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
      <CardContent>
        <CharacterForm
          formId="character-create-form"
          form={form}
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
