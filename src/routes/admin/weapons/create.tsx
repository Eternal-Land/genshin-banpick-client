import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { weaponApis } from "@/apis/weapons";
import {
  createWeaponSchema,
  type CreateWeaponInput,
} from "@/apis/weapons/types";
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
import { LocaleKeys, WeaponRarity } from "@/lib/constants";
import { WeaponForm, type WeaponFormValues } from "@/components/weapons";

export const Route = createFileRoute("/admin/weapons/create")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  type CreateWeaponFormInput = z.input<typeof createWeaponSchema>;
  const form = useForm<CreateWeaponFormInput>({
    resolver: zodResolver(createWeaponSchema),
    defaultValues: {
      key: "",
      name: "",
      type: undefined,
      rarity: WeaponRarity.WEAPON_SS,
      iconUrl: undefined,
    },
  });

  const createMutation = useMutation<
    BaseApiResponse,
    AxiosError<BaseApiResponse>,
    CreateWeaponInput
  >({
    mutationFn: (input: CreateWeaponInput) => weaponApis.createWeapon(input),
    onSuccess: () => {
      toast.success(t(LocaleKeys.weapons_create_success));
      navigate({ to: "/admin/weapons" });
    },
    onError: (mutationError) => {
      toast.error(
        mutationError.response?.data.message ||
          t(LocaleKeys.weapons_create_error),
      );
    },
  });

  const handleSubmit = (values: WeaponFormValues) => {
    createMutation.mutate({
      key: values.key,
      name: values.name,
      type: values.type!,
      rarity: values.rarity,
      iconUrl: values.iconUrl,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(LocaleKeys.weapons_create_title)}</CardTitle>
        <CardDescription className="space-y-1">
          <span>{t(LocaleKeys.weapons_create_description)}</span>
          {createMutation.isError && (
            <span className="text-destructive">
              {createMutation.error.response?.data.message ||
                t(LocaleKeys.weapons_create_error)}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <WeaponForm
          formId="weapon-create-form"
          form={form}
          onSubmit={handleSubmit}
        />
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: "/admin/weapons" })}
        >
          {t(LocaleKeys.weapons_cancel)}
        </Button>
        <Button
          type="submit"
          form="weapon-create-form"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending
            ? t(LocaleKeys.weapons_create_pending)
            : t(LocaleKeys.weapons_create_submit)}
        </Button>
      </CardFooter>
    </Card>
  );
}
