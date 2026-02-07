import { useCallback } from "react";
import { characterCostsApi } from "@/apis/character-costs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import CharacterCostRow from "./CharacterCostRow";
import { useTranslation } from "react-i18next";
import { LocaleKeys } from "@/lib/constants";

export default function CharacterCostsTab() {
    const { t } = useTranslation();
    const updateCostMutation = useMutation({
        mutationFn: ({ costId, cost }: { costId: number; cost: number }) =>
            characterCostsApi.updateCharacterCost(costId, { cost }),
    });

    const handleCommit = useCallback(
        (costId: number, value: number) => {
            updateCostMutation.mutate({ costId, cost: value });
        },
        [updateCostMutation],
    );

    const listCharacterCostsQuery = useQuery({
        queryKey: ["listCharacterCosts"],
        queryFn: async () => {
            const data = [];
            let next = undefined;
            do {
                const res = await characterCostsApi.listCharacterCosts({ startId: next, showInactive: false })
                data.push(...(res.data || []));
                next = res.next;
            } while (next);
            return data;
        }
    });

    const syncMutation = useMutation({
        mutationFn: () => characterCostsApi.syncCharacterCostsWithCharacters(),
        onSuccess: () => {
            listCharacterCostsQuery.refetch();
        },
    });

    return <div className="me-4">
        <div className="flex justify-between items-center">
            <h1>{t(LocaleKeys.character_costs_title)}</h1>
            <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>{t(LocaleKeys.character_costs_sync)}</Button>
        </div>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t(LocaleKeys.character_costs_table_character)}</TableHead>
                    {Array.from({ length: 7 }).map((_, index) => (
                        <TableHead key={index} className="text-center w-15">C{index}</TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {listCharacterCostsQuery.data?.map((character) => (
                    <CharacterCostRow
                        key={character.id}
                        character={character}
                        onCommit={handleCommit}
                    />
                ))}
            </TableBody>
        </Table>
    </div>
}