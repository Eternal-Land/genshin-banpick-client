import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { PenIcon, PlusIcon, TrashIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Empty } from "../ui/empty";
import { Skeleton } from "../ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
import { costMilestonesApi } from "@/apis/cost-milestones";
import type {
    CostMilestoneResponse,
    CreateCostMilestoneInput,
    UpdateCostMilestoneInput,
} from "@/apis/cost-milestones/types";
import type { BaseApiResponse } from "@/lib/types";
import { LocaleKeys } from "@/lib/constants";
import CostMilestoneDialogForm, {
    type CostMilestoneFormValues,
} from "./CostMilestoneDialogForm";
import CostMilestoneDeleteDialog from "./CostMilestoneDeleteDialog";

export default function CostMilestonesTab() {
    const { t } = useTranslation();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState<
        CostMilestoneResponse | null
    >(null);
    const [deleteTarget, setDeleteTarget] = useState<
        CostMilestoneResponse | null
    >(null);

    const listCostMilestonesQuery = useQuery({
		queryKey: ["listCostMilestones"],
		queryFn: costMilestonesApi.listCostMilestones,
	});

    const createMutation = useMutation<
        BaseApiResponse<CostMilestoneResponse>,
        AxiosError<BaseApiResponse>,
        CreateCostMilestoneInput
    >({
        mutationFn: (input) => costMilestonesApi.createCostMilestone(input),
        onSuccess: () => {
            toast.success(t(LocaleKeys.cost_milestones_create_success));
            listCostMilestonesQuery.refetch();
            setIsDialogOpen(false);
        },
        onError: (error) => {
            toast.error(
                error.response?.data.message ||
                    t(LocaleKeys.cost_milestones_create_error),
            );
        },
    });

    const updateMutation = useMutation<
        BaseApiResponse<CostMilestoneResponse>,
        AxiosError<BaseApiResponse>,
        { id: number; input: UpdateCostMilestoneInput }
    >({
        mutationFn: ({ id, input }) =>
            costMilestonesApi.updateCostMilestone(id, input),
        onSuccess: () => {
            toast.success(t(LocaleKeys.cost_milestones_edit_success));
            listCostMilestonesQuery.refetch();
            setIsDialogOpen(false);
            setEditingMilestone(null);
        },
        onError: (error) => {
            toast.error(
                error.response?.data.message ||
                    t(LocaleKeys.cost_milestones_edit_error),
            );
        },
    });

    const deleteMutation = useMutation<
        BaseApiResponse,
        AxiosError<BaseApiResponse>,
        number
    >({
        mutationFn: (id) => costMilestonesApi.deleteCostMilestone(id),
        onSuccess: () => {
            toast.success(t(LocaleKeys.cost_milestones_delete_success));
            listCostMilestonesQuery.refetch();
        },
        onError: (error) => {
            toast.error(
                error.response?.data.message ||
                    t(LocaleKeys.cost_milestones_delete_error),
            );
        },
    });

    const milestones = listCostMilestonesQuery.data?.data ?? [];
    const isSaving = createMutation.isPending || updateMutation.isPending;

    const editingValues = useMemo<CostMilestoneFormValues | undefined>(() => {
        if (!editingMilestone) return undefined;
        return {
            costFrom: editingMilestone.costFrom,
            costTo: editingMilestone.costTo,
            costValuePerSec: editingMilestone.costValuePerSec,
        };
    }, [editingMilestone]);

    const handleOpenCreate = () => {
        setEditingMilestone(null);
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (milestone: CostMilestoneResponse) => {
        setEditingMilestone(milestone);
        setIsDialogOpen(true);
    };

    const handleDialogChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            setEditingMilestone(null);
        }
    };

    const handleSubmit = (values: CostMilestoneFormValues) => {
        if (editingMilestone) {
            updateMutation.mutate({ id: editingMilestone.id, input: values });
        } else {
            createMutation.mutate(values);
        }
    };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    return (
        <div className="ms-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
                <h1>{t(LocaleKeys.cost_milestones_title)}</h1>
                <Button size="icon" variant="ghost" onClick={handleOpenCreate}>
                    <PlusIcon className="size-4" />
                </Button>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-center">
                            {t(LocaleKeys.cost_milestones_table_index)}
                        </TableHead>
                        <TableHead className="text-center">
                            {t(LocaleKeys.cost_milestones_table_range)}
                        </TableHead>
                        <TableHead className="text-center">
                            {t(LocaleKeys.cost_milestones_table_value)}
                        </TableHead>
                        <TableHead className="text-center">
                            {t(LocaleKeys.cost_milestones_table_action)}
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {listCostMilestonesQuery.isLoading
                        ? Array.from({ length: 6 }).map((_, index) => (
                                <TableRow key={`cost-milestone-skeleton-${index}`}>
                                    <TableCell className="text-center">
                                        <Skeleton className="mx-auto h-4 w-6" />
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Skeleton className="mx-auto h-4 w-28" />
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Skeleton className="mx-auto h-4 w-16" />
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center gap-1">
                                            <Skeleton className="h-8 w-8" />
                                            <Skeleton className="h-8 w-8" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        : milestones.map((milestone, index) => (
                                <TableRow key={milestone.id}>
                                    <TableCell className="text-center">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {milestone.costFrom}
                                        {milestone.costTo != undefined
                                            ? " - " + milestone.costTo
                                            : "+"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {milestone.costValuePerSec}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center gap-1">
                                            <Button
                                                size="icon-sm"
                                                onClick={() => handleOpenEdit(milestone)}
                                                disabled={isSaving}
                                                aria-label={t(
                                                    LocaleKeys.cost_milestones_edit_action,
                                                )}
                                            >
                                                <PenIcon className="size-3" />
                                            </Button>
                                            <Button
                                                size="icon-sm"
                                                variant="destructive"
                                                onClick={() => setDeleteTarget(milestone)}
                                                disabled={deleteMutation.isPending}
                                                aria-label={t(
                                                    LocaleKeys.cost_milestones_delete_action,
                                                )}
                                            >
                                                <TrashIcon className="size-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                    {!listCostMilestonesQuery.isLoading && milestones.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4}>
                                <Empty>{t(LocaleKeys.cost_milestones_empty)}</Empty>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <CostMilestoneDialogForm
                open={isDialogOpen}
                onOpenChange={handleDialogChange}
                values={editingValues}
                isLoading={isSaving}
                onSubmit={handleSubmit}
            />
            <CostMilestoneDeleteDialog
                milestone={deleteTarget}
                isPending={deleteMutation.isPending}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    )
}