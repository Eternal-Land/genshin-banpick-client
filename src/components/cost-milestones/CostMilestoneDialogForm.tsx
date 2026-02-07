import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { LocaleKeys } from "@/lib/constants";

const costMilestoneFormSchema = z.object({
    costFrom: z.number().min(0, LocaleKeys.cost_milestones_cost_from_min),
    costTo: z
        .number()
        .min(0, LocaleKeys.cost_milestones_cost_to_min)
        .nullable()
        .optional(),
    costValuePerSec: z.number().min(0, LocaleKeys.cost_milestones_cost_value_per_sec_min),
});

export type CostMilestoneFormValues = z.infer<typeof costMilestoneFormSchema>;

export interface CostMilestoneDialogFormProps {
    values?: CostMilestoneFormValues;
    isLoading?: boolean;
    onSubmit: (values: CostMilestoneFormValues) => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function CostMilestoneDialogForm({
    values,
    isLoading,
    onSubmit,
    open,
    onOpenChange,
}: CostMilestoneDialogFormProps) {
    const { t } = useTranslation();
    const isEditMode = Boolean(values);

    const form = useForm<CostMilestoneFormValues>({
        resolver: zodResolver(costMilestoneFormSchema),
        defaultValues: {
            costFrom: values?.costFrom ?? 0,
            costTo: values?.costTo ?? null,
            costValuePerSec: values?.costValuePerSec ?? 0,
        },
    });

    useEffect(() => {
        form.reset({
            costFrom: values?.costFrom ?? 0,
            costTo: values?.costTo ?? null,
            costValuePerSec: values?.costValuePerSec ?? 0,
        });
    }, [form, values?.costFrom, values?.costTo, values?.costValuePerSec]);

    const parseNumberValue = (value: string, fallback?: number | null) => {
        if (value === "") return fallback ?? null;
        const parsed = Number(value);
        return Number.isNaN(parsed) ? fallback ?? null : parsed;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isEditMode
                            ? t(LocaleKeys.cost_milestones_title_edit)
                            : t(LocaleKeys.cost_milestones_title_create)}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditMode
                            ? t(LocaleKeys.cost_milestones_description_edit)
                            : t(LocaleKeys.cost_milestones_description_create)}
                    </DialogDescription>
                </DialogHeader>
                <form
                    id="cost-milestone-dialog-form"
                    onSubmit={form.handleSubmit(onSubmit)}
                >
                    <FieldGroup>
                        <Controller
                            name="costFrom"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        {t(LocaleKeys.cost_milestones_cost_from_label)}
                                    </FieldLabel>
                                    {isLoading ? (
                                        <Skeleton className="h-9 w-full" />
                                    ) : (
                                        <Input
                                            {...field}
                                            id={field.name}
                                            type="number"
                                            min={0}
                                            step="0.5"
                                            inputMode="decimal"
                                            placeholder={t(
                                                LocaleKeys.cost_milestones_cost_from_placeholder,
                                            )}
                                            value={field.value ?? 0}
                                            onChange={(event) =>
                                                field.onChange(
                                                    parseNumberValue(event.target.value, 0),
                                                )
                                            }
                                            aria-invalid={fieldState.invalid}
                                            disabled={isLoading}
                                        />
                                    )}
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />
                        <Controller
                            name="costTo"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        {t(LocaleKeys.cost_milestones_cost_to_label)}
                                    </FieldLabel>
                                    {isLoading ? (
                                        <Skeleton className="h-9 w-full" />
                                    ) : (
                                        <Input
                                            {...field}
                                            id={field.name}
                                            type="number"
                                            min={0}
                                            step="0.5"
                                            inputMode="decimal"
                                            placeholder={t(
                                                LocaleKeys.cost_milestones_cost_to_placeholder,
                                            )}
                                            value={field.value ?? ""}
                                            onChange={(event) =>
                                                field.onChange(
                                                    parseNumberValue(event.target.value, null),
                                                )
                                            }
                                            aria-invalid={fieldState.invalid}
                                            disabled={isLoading}
                                        />
                                    )}
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />
                        <Controller
                            name="costValuePerSec"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        {t(
                                            LocaleKeys.cost_milestones_cost_value_per_sec_label,
                                        )}
                                    </FieldLabel>
                                    {isLoading ? (
                                        <Skeleton className="h-9 w-full" />
                                    ) : (
                                        <Input
                                            {...field}
                                            id={field.name}
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            inputMode="decimal"
                                            placeholder={t(
                                                LocaleKeys.cost_milestones_cost_value_per_sec_placeholder,
                                            )}
                                            value={field.value ?? 0}
                                            onChange={(event) =>
                                                field.onChange(
                                                    parseNumberValue(event.target.value, 0),
                                                )
                                            }
                                            aria-invalid={fieldState.invalid}
                                            disabled={isLoading}
                                        />
                                    )}
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />
                    </FieldGroup>
                </form>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange?.(false)}
                        disabled={isLoading}
                    >
                        {t(LocaleKeys.cost_milestones_cancel)}
                    </Button>
                    <Button
                        type="submit"
                        form="cost-milestone-dialog-form"
                        disabled={isLoading}
                    >
                        {isEditMode
                            ? t(LocaleKeys.cost_milestones_submit_edit)
                            : t(LocaleKeys.cost_milestones_submit_create)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}