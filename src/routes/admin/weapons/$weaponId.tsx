import { useEffect, useState } from "react";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { weaponApis } from "@/apis/weapons";
import {
	updateWeaponSchema,
	type UpdateWeaponInput,
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

export const Route = createFileRoute("/admin/weapons/$weaponId")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { weaponId } = Route.useParams();
	const [isFormReady, setIsFormReady] = useState(false);

	type UpdateWeaponFormInput = z.input<typeof updateWeaponSchema>;
	const form = useForm<UpdateWeaponFormInput>({
		resolver: zodResolver(updateWeaponSchema),
		defaultValues: {
			key: "",
			name: "",
			type: undefined,
			rarity: WeaponRarity.WEAPON_SS,
			iconUrl: undefined,
		},
	});

	const {
		data: weaponResponse,
		isLoading: isWeaponLoading,
		error: weaponError,
	} = useQuery({
		queryKey: ["weapon", weaponId],
		queryFn: () => weaponApis.getWeapon(weaponId),
		enabled: Boolean(weaponId),
	});

	useEffect(() => {
		const weapon = weaponResponse?.data;
		if (!weapon) return;

		form.reset({
			key: weapon.key,
			name: weapon.name,
			type: weapon.type,
			rarity: weapon.rarity,
			iconUrl: weapon.iconUrl ?? undefined,
		});
		setIsFormReady(true);
	}, [form, weaponResponse]);

	const updateMutation = useMutation<
		BaseApiResponse,
		AxiosError<BaseApiResponse>,
		UpdateWeaponInput
	>({
		mutationFn: (input: UpdateWeaponInput) =>
			weaponApis.updateWeapon(weaponId, input),
		onSuccess: () => {
			toast.success(t(LocaleKeys.weapons_edit_success));
			navigate({ to: "/admin/weapons", search: { page: 1, take: 10 } });
		},
		onError: (mutationError) => {
			toast.error(
				mutationError.response?.data.message ||
					t(LocaleKeys.weapons_edit_error),
			);
		},
	});

	const handleSubmit = (values: WeaponFormValues) => {
		updateMutation.mutate({
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
				<CardTitle>{t(LocaleKeys.weapons_edit_title)}</CardTitle>
				<CardDescription className="space-y-1">
					<span>{t(LocaleKeys.weapons_edit_description)}</span>
					{weaponError ? (
						<span className="text-destructive">
							{t(LocaleKeys.weapons_edit_load_error)}
						</span>
					) : null}
					{updateMutation.isError && (
						<span className="text-destructive">
							{updateMutation.error.response?.data.message ||
								t(LocaleKeys.weapons_edit_error)}
						</span>
					)}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<WeaponForm
					formId="weapon-update-form"
					form={form}
					isLoading={isWeaponLoading || !isFormReady}
					onSubmit={handleSubmit}
				/>
			</CardContent>
			<CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
				<Button
					type="button"
					variant="outline"
					onClick={() =>
						navigate({ to: "/admin/weapons", search: { page: 1, take: 10 } })
					}
				>
					{t(LocaleKeys.weapons_cancel)}
				</Button>
				<Button
					type="submit"
					form="weapon-update-form"
					disabled={updateMutation.isPending || !isFormReady}
				>
					{updateMutation.isPending
						? t(LocaleKeys.weapons_edit_pending)
						: t(LocaleKeys.weapons_edit_submit)}
				</Button>
			</CardFooter>
		</Card>
	);
}
