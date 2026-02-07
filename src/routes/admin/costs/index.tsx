import CharacterCostsTab from "@/components/character-costs";
import CostMilestonesTab from "@/components/cost-milestones";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LocaleKeys } from "@/lib/constants";
import { createFileRoute } from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { useTranslation } from "react-i18next";
import z from "zod";

const costsSearchSchema = z.object({
	tab: fallback(z.enum(["character-costs", "cost-milestones"]), "character-costs"),
});

export const Route = createFileRoute("/admin/costs/")({
	component: RouteComponent,
	validateSearch: zodValidator(costsSearchSchema)
});

function RouteComponent() {
    const { t } = useTranslation();
	const { tab } = Route.useSearch();
	const navigate = Route.useNavigate();

	return (
		<Tabs value={tab} onValueChange={(v) => navigate({ search: { tab: v } })} className="w-full">
			<TabsList>
				<TabsTrigger value="character-costs">
					{t(LocaleKeys.costs_tab_character_costs)}
				</TabsTrigger>
				<TabsTrigger value="cost-milestones">
					{t(LocaleKeys.costs_tab_cost_milestones)}
				</TabsTrigger>
			</TabsList>
			<TabsContent value="character-costs">
				<CharacterCostsTab />
			</TabsContent>
			<TabsContent value="cost-milestones">
				<CostMilestonesTab />
			</TabsContent>
		</Tabs>
	);
}
