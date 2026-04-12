import { userCharacterCostsApi } from "@/apis/user-character-costs";
import { userCharactersApi } from "@/apis/user-characters";
import { userWeaponCostsApi } from "@/apis/user-weapon-costs";
import { userWeaponApis } from "@/apis/user-weapons";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
	SelectInput,
	SelectInputContent,
	SelectInputOption,
} from "@/components/select-input";
import { useElementLabel } from "@/hooks/use-element-label";
import { useWeaponRarityLabel } from "@/hooks/use-weapon-rarity-label";
import { useWeaponTypeLabel } from "@/hooks/use-weapon-type-label";
import {
	characterCostsLocaleKeys,
	charactersLocaleKeys,
	commonLocaleKeys,
	weaponsLocaleKeys,
	weaponCostsLocaleKeys,
} from "@/i18n/keys";
import { getTranslationToken } from "@/i18n/namespaces";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	CharacterElementDetail,
	CharacterElement,
	IconAssets,
	WeaponCostUnit,
	WeaponType,
	WeaponTypeDetail,
	type WeaponRarityEnum,
} from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_userLayout/_userProtectedLayout/cost")({
	component: RouteComponent,
});

function RouteComponent() {
	const { t } = useTranslation();
	const elementLabels = useElementLabel();
	const weaponTypeLabels = useWeaponTypeLabel();
	const weaponRarityLabels = useWeaponRarityLabel();

	const charactersQuery = useQuery({
		queryKey: ["user", "characters"],
		queryFn: userCharactersApi.listCharacters,
	});
	const weaponsQuery = useQuery({
		queryKey: ["user", "weapons"],
		queryFn: userWeaponApis.listUserWeapons,
	});
	const characterCostsQuery = useQuery({
		queryKey: ["user", "character-costs"],
		queryFn: userCharacterCostsApi.listCharacterCosts,
	});
	const weaponCostsQuery = useQuery({
		queryKey: ["user", "weapon-costs"],
		queryFn: userWeaponCostsApi.listWeaponCosts,
	});

	const isLoading =
		charactersQuery.isLoading ||
		weaponsQuery.isLoading ||
		characterCostsQuery.isLoading ||
		weaponCostsQuery.isLoading;

	const hasError =
		charactersQuery.isError ||
		weaponsQuery.isError ||
		characterCostsQuery.isError ||
		weaponCostsQuery.isError;

	const characters = charactersQuery.data?.data ?? [];
	const weapons = weaponsQuery.data?.data ?? [];
	const characterCosts = characterCostsQuery.data?.data ?? [];
	const weaponCosts = weaponCostsQuery.data?.data ?? [];

	const characterMeta = useMemo(() => {
		return new Map(characters.map((character) => [character.id, character]));
	}, [characters]);
	const [characterSearch, setCharacterSearch] = useState("");
	const [elementFilter, setElementFilter] = useState("all");
	const [weaponFilter, setWeaponFilter] = useState("all");
	const [rarityFilter, setRarityFilter] = useState("all");
	const [sortBy, setSortBy] = useState("name-asc");
	const [weaponSearch, setWeaponSearch] = useState("");
	const [weaponTypeTableFilter, setWeaponTypeTableFilter] = useState("all");
	const [weaponRarityTableFilter, setWeaponRarityTableFilter] = useState("all");
	const [weaponTableSortBy, setWeaponTableSortBy] = useState("name-asc");

	const weaponRarityKeys = useMemo(
		() =>
			Object.keys(weaponRarityLabels).map(
				(key) => Number(key) as WeaponRarityEnum,
			),
		[weaponRarityLabels],
	);

	const characterCostRange = useMemo(() => {
		const values = characterCosts.flatMap((character) =>
			(character.characterCosts ?? []).map((item) => item.cost),
		);
		if (values.length === 0) {
			return { min: 0, max: 0 };
		}
		return {
			min: Math.min(...values),
			max: Math.max(...values),
		};
	}, [characterCosts]);

	const getInitials = (name: string) => {
		const parts = name.trim().split(/\s+/);
		return parts
			.map((part) => part.charAt(0))
			.join("")
			.slice(0, 2)
			.toUpperCase();
	};

	const getRarityStarColor = (rarity: number) => {
		if (rarity === 5) {
			return "text-orange-400";
		}
		return "text-purple-600";
	};

	const getUnitLabel = (unit: number) => {
		if (unit === WeaponCostUnit.SECONDS) {
			return t(
				getTranslationToken(
					"weapon-costs",
					weaponCostsLocaleKeys.weapon_costs_unit_seconds,
				),
			);
		}
		return t(
			getTranslationToken(
				"weapon-costs",
				weaponCostsLocaleKeys.weapon_costs_unit_cost,
			),
		);
	};

	const getCharacterCostCellStyle = (cost: number) => {
		if (cost === 0) {
			return undefined;
		}

		const { min, max } = characterCostRange;
		if (max <= min) {
			return {
				backgroundColor: "hsla(60, 95%, 55%, 0.55)",
			};
		}

		const ratio = (cost - min) / (max - min);
		const hue = 120 * (1 - ratio);

		return {
			backgroundColor: `hsla(${hue}, 95%, 55%, 0.55)`,
		};
	};

	const elementFilterLabel =
		elementFilter === "all"
			? "All Elements"
			: elementLabels[Number(elementFilter) as keyof typeof elementLabels];

	const weaponFilterLabel =
		weaponFilter === "all"
			? "All Weapon Types"
			: weaponTypeLabels[Number(weaponFilter) as keyof typeof weaponTypeLabels];

	const rarityFilterLabel =
		rarityFilter === "all" ? "All Rarities" : `${rarityFilter}★`;

	const sortByLabelMap: Record<string, string> = {
		"name-asc": "Name A-Z",
		"name-desc": "Name Z-A",
		"cost-asc": "Total Cost Low-High",
		"cost-desc": "Total Cost High-Low",
	};

	const weaponTableTypeLabel =
		weaponTypeTableFilter === "all"
			? "All Weapon Types"
			: weaponTypeLabels[
					Number(weaponTypeTableFilter) as keyof typeof weaponTypeLabels
				];

	const weaponTableRarityLabel =
		weaponRarityTableFilter === "all"
			? "All Rarities"
			: weaponRarityLabels[
					Number(weaponRarityTableFilter) as keyof typeof weaponRarityLabels
				];

	const weaponTableSortByLabelMap: Record<string, string> = {
		"name-asc": "Name A-Z",
		"name-desc": "Name Z-A",
		"rarity-asc": "Rarity Low-High",
		"rarity-desc": "Rarity High-Low",
	};

	const filteredCharacterRows = useMemo(() => {
		const normalizedSearch = characterSearch.trim().toLowerCase();

		const rows = characterCosts
			.map((characterCost) => {
				const metadata = characterMeta.get(characterCost.id);
				const costByConstellation = new Map(
					(characterCost.characterCosts ?? []).map((item) => [
						item.constellation,
						item.cost,
					]),
				);
				const totalCost = (characterCost.characterCosts ?? []).reduce(
					(sum, item) => sum + item.cost,
					0,
				);

				return {
					characterCost,
					metadata,
					costByConstellation,
					totalCost,
				};
			})
			.filter(({ characterCost, metadata }) => {
				if (normalizedSearch) {
					const key = metadata?.key?.toLowerCase() ?? "";
					const name = characterCost.name.toLowerCase();
					if (!name.includes(normalizedSearch) && !key.includes(normalizedSearch)) {
						return false;
					}
				}

				if (elementFilter !== "all") {
					if (!metadata || String(metadata.element) !== elementFilter) {
						return false;
					}
				}

				if (weaponFilter !== "all") {
					if (!metadata || String(metadata.weaponType) !== weaponFilter) {
						return false;
					}
				}

				if (rarityFilter !== "all") {
					if (String(characterCost.rarity) !== rarityFilter) {
						return false;
					}
				}

				return true;
			});

		rows.sort((a, b) => {
			switch (sortBy) {
				case "name-desc":
					return b.characterCost.name.localeCompare(a.characterCost.name);
				case "cost-asc":
					return a.totalCost - b.totalCost;
				case "cost-desc":
					return b.totalCost - a.totalCost;
				case "name-asc":
				default:
					return a.characterCost.name.localeCompare(b.characterCost.name);
			}
		});

		return rows;
	}, [
		characterSearch,
		characterCosts,
		characterMeta,
		elementFilter,
		rarityFilter,
		sortBy,
		weaponFilter,
	]);

	const filteredWeapons = useMemo(() => {
		const normalizedSearch = weaponSearch.trim().toLowerCase();

		const rows = weapons.filter((weapon) => {
			if (normalizedSearch) {
				const name = weapon.name.toLowerCase();
				const key = weapon.key.toLowerCase();
				if (!name.includes(normalizedSearch) && !key.includes(normalizedSearch)) {
					return false;
				}
			}

			if (
				weaponTypeTableFilter !== "all" &&
				String(weapon.type) !== weaponTypeTableFilter
			) {
				return false;
			}

			if (
				weaponRarityTableFilter !== "all" &&
				String(weapon.rarity) !== weaponRarityTableFilter
			) {
				return false;
			}

			return true;
		});

		rows.sort((a, b) => {
			switch (weaponTableSortBy) {
				case "name-desc":
					return b.name.localeCompare(a.name);
				case "rarity-asc":
					return a.rarity - b.rarity;
				case "rarity-desc":
					return b.rarity - a.rarity;
				case "name-asc":
				default:
					return a.name.localeCompare(b.name);
			}
		});

		return rows;
	}, [
		weaponRarityTableFilter,
		weaponSearch,
		weaponTableSortBy,
		weaponTypeTableFilter,
		weapons,
	]);

	if (isLoading) {
		return <p className="text-white/80">Loading cost data...</p>;
	}

	if (hasError) {
		return <p className="text-red-300">Failed to load cost data.</p>;
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
				<SummaryCard
					label={t(
						getTranslationToken("characters", charactersLocaleKeys.characters_title),
					)}
					value={characters.length}
				/>
				<SummaryCard
					label={t(
						getTranslationToken("weapons", weaponsLocaleKeys.weapons_title),
					)}
					value={weapons.length}
				/>
			</div>

			<Tabs defaultValue="character-costs" className="w-full">
				<TabsList>
					<TabsTrigger value="character-costs">
						{t(
							getTranslationToken(
								"character-costs",
								characterCostsLocaleKeys.character_costs_title,
							),
						)}
					</TabsTrigger>
					<TabsTrigger value="weapon-costs">
						{t(getTranslationToken("weapons", weaponsLocaleKeys.weapons_title))}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="character-costs">
					<section className="rounded-xl border border-white/10 bg-black/30 p-4 backdrop-blur">
						<div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
							<Input
								placeholder={t(
									getTranslationToken(
										"common",
										commonLocaleKeys.search_placeholder,
									),
								)}
								value={characterSearch}
								onChange={(event) => setCharacterSearch(event.target.value)}
							/>

							<SelectInput
								value={elementFilterLabel}
								readOnly
								wrapperClassName="w-full"
							>
								<SelectInputContent>
									<SelectInputOption onSelect={() => setElementFilter("all")}>
										All Elements
									</SelectInputOption>
									<SelectInputOption
										onSelect={() =>
											setElementFilter(String(CharacterElement.ANEMO))
										}
									>
										{elementLabels[CharacterElement.ANEMO]}
									</SelectInputOption>
									<SelectInputOption onSelect={() => setElementFilter(String(CharacterElement.GEO))}>
										{elementLabels[CharacterElement.GEO]}
									</SelectInputOption>
									<SelectInputOption
										onSelect={() =>
											setElementFilter(String(CharacterElement.ELECTRO))
										}
									>
										{elementLabels[CharacterElement.ELECTRO]}
									</SelectInputOption>
									<SelectInputOption
										onSelect={() =>
											setElementFilter(String(CharacterElement.DENDRO))
										}
									>
										{elementLabels[CharacterElement.DENDRO]}
									</SelectInputOption>
									<SelectInputOption
										onSelect={() =>
											setElementFilter(String(CharacterElement.HYDRO))
										}
									>
										{elementLabels[CharacterElement.HYDRO]}
									</SelectInputOption>
									<SelectInputOption onSelect={() => setElementFilter(String(CharacterElement.PYRO))}>
										{elementLabels[CharacterElement.PYRO]}
									</SelectInputOption>
									<SelectInputOption onSelect={() => setElementFilter(String(CharacterElement.CRYO))}>
										{elementLabels[CharacterElement.CRYO]}
									</SelectInputOption>
								</SelectInputContent>
							</SelectInput>

							<SelectInput
								value={weaponFilterLabel}
								readOnly
								wrapperClassName="w-full"
							>
								<SelectInputContent>
									<SelectInputOption onSelect={() => setWeaponFilter("all")}>
										All Weapon Types
									</SelectInputOption>
									<SelectInputOption onSelect={() => setWeaponFilter(String(WeaponType.SWORD))}>
										{weaponTypeLabels[WeaponType.SWORD]}
									</SelectInputOption>
									<SelectInputOption onSelect={() => setWeaponFilter(String(WeaponType.CLAYMORE))}>
										{weaponTypeLabels[WeaponType.CLAYMORE]}
									</SelectInputOption>
									<SelectInputOption onSelect={() => setWeaponFilter(String(WeaponType.POLEARM))}>
										{weaponTypeLabels[WeaponType.POLEARM]}
									</SelectInputOption>
									<SelectInputOption onSelect={() => setWeaponFilter(String(WeaponType.BOW))}>
										{weaponTypeLabels[WeaponType.BOW]}
									</SelectInputOption>
									<SelectInputOption onSelect={() => setWeaponFilter(String(WeaponType.CATALYST))}>
										{weaponTypeLabels[WeaponType.CATALYST]}
									</SelectInputOption>
								</SelectInputContent>
							</SelectInput>

							<SelectInput
								value={rarityFilterLabel}
								readOnly
								wrapperClassName="w-full"
							>
								<SelectInputContent>
									<SelectInputOption onSelect={() => setRarityFilter("all")}>
										All Rarities
									</SelectInputOption>
									<SelectInputOption onSelect={() => setRarityFilter("5")}>
										5★
									</SelectInputOption>
									<SelectInputOption onSelect={() => setRarityFilter("4")}>
										4★
									</SelectInputOption>
								</SelectInputContent>
							</SelectInput>

							<SelectInput
								value={sortByLabelMap[sortBy] ?? "Sort"}
								readOnly
								wrapperClassName="w-full"
							>
								<SelectInputContent>
									<SelectInputOption onSelect={() => setSortBy("name-asc")}>
										Name A-Z
									</SelectInputOption>
									<SelectInputOption onSelect={() => setSortBy("name-desc")}>
										Name Z-A
									</SelectInputOption>
									<SelectInputOption onSelect={() => setSortBy("cost-asc")}>
										Total Cost Low-High
									</SelectInputOption>
									<SelectInputOption onSelect={() => setSortBy("cost-desc")}>
										Total Cost High-Low
									</SelectInputOption>
								</SelectInputContent>
							</SelectInput>
						</div>

						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>
										{t(
											getTranslationToken(
												"characters",
												charactersLocaleKeys.characters_table_name,
											),
										)}
									</TableHead>
									<TableHead>
										{t(
											getTranslationToken(
												"characters",
												charactersLocaleKeys.characters_table_element,
											),
										)}
									</TableHead>
									<TableHead>
										{t(
											getTranslationToken(
												"characters",
												charactersLocaleKeys.characters_table_weapon,
											),
										)}
									</TableHead>
									<TableHead>
										{t(
											getTranslationToken(
												"characters",
												charactersLocaleKeys.characters_table_rarity,
											),
										)}
									</TableHead>
									{Array.from({ length: 7 }).map((_, index) => (
										<TableHead key={index}>C{index}</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredCharacterRows.map(({ characterCost, metadata, costByConstellation }) => {
									const elementDetail = metadata
										? CharacterElementDetail[metadata.element]
										: undefined;

									return (
										<TableRow key={characterCost.id}>
											<TableCell>
												<div className="flex items-center gap-2">
													<Avatar className="size-8 rounded-md border border-white/10">
														<AvatarImage
															src={metadata?.iconUrl || IconAssets.EMPTY_CHARACTER_ICON}
															alt={characterCost.name}
														/>
														<AvatarFallback className="rounded-md bg-white/10 text-xs text-white">
															{getInitials(characterCost.name)}
														</AvatarFallback>
													</Avatar>
													<span>{characterCost.name}</span>
												</div>
											</TableCell>
											<TableCell>
												{metadata ? (
													<div className="flex items-center gap-2">
														<img
															src={elementDetail?.iconUrl}
															alt={elementDetail?.name}
															className="size-4"
														/>
														<span>{elementLabels[metadata.element]}</span>
													</div>
												) : (
													"-"
												)}
											</TableCell>
											<TableCell>
												{metadata ? (
													<div className="flex items-center gap-2">
														{WeaponTypeDetail[metadata.weaponType]?.iconUrl ? (
															<img
																src={WeaponTypeDetail[metadata.weaponType].iconUrl}
																alt={WeaponTypeDetail[metadata.weaponType].name}
																className="size-4"
															/>
														) : (
															<span className="text-white/60">-</span>
														)}
														<span>{weaponTypeLabels[metadata.weaponType]}</span>
													</div>
												) : (
													"-"
												)}
											</TableCell>
											<TableCell>
												<span className={getRarityStarColor(characterCost.rarity)}>
													{characterCost.rarity}★
												</span>
											</TableCell>
											{Array.from({ length: 7 }).map((_, index) => {
												const costValue = costByConstellation.get(index);
												return (
													<TableCell
														key={`${characterCost.id}-${index}`}
														style={
															costValue != undefined
																? getCharacterCostCellStyle(costValue)
																: undefined
														}
													>
														{costValue ?? "-"}
													</TableCell>
												);
											})}
										</TableRow>
									);
								})}
								{filteredCharacterRows.length === 0 && (
									<TableRow>
										<TableCell colSpan={11} className="text-center text-white/70">
											No characters match current filters
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</section>
				</TabsContent>

				<TabsContent value="weapon-costs">
					<section className="rounded-xl border border-white/10 bg-black/30 p-4 backdrop-blur">
						<h2 className="mb-4 text-lg font-semibold text-white">
							{t(getTranslationToken("weapons", weaponsLocaleKeys.weapons_title))}
						</h2>
						<div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
							<Input
								placeholder={t(
									getTranslationToken(
										"common",
										commonLocaleKeys.search_placeholder,
									),
								)}
								value={weaponSearch}
								onChange={(event) => setWeaponSearch(event.target.value)}
							/>

							<SelectInput
								value={weaponTableTypeLabel}
								readOnly
								wrapperClassName="w-full"
							>
								<SelectInputContent>
									<SelectInputOption onSelect={() => setWeaponTypeTableFilter("all")}>
										All Weapon Types
									</SelectInputOption>
									<SelectInputOption onSelect={() => setWeaponTypeTableFilter(String(WeaponType.SWORD))}>
										{weaponTypeLabels[WeaponType.SWORD]}
									</SelectInputOption>
									<SelectInputOption onSelect={() => setWeaponTypeTableFilter(String(WeaponType.CLAYMORE))}>
										{weaponTypeLabels[WeaponType.CLAYMORE]}
									</SelectInputOption>
									<SelectInputOption onSelect={() => setWeaponTypeTableFilter(String(WeaponType.POLEARM))}>
										{weaponTypeLabels[WeaponType.POLEARM]}
									</SelectInputOption>
									<SelectInputOption onSelect={() => setWeaponTypeTableFilter(String(WeaponType.BOW))}>
										{weaponTypeLabels[WeaponType.BOW]}
									</SelectInputOption>
									<SelectInputOption onSelect={() => setWeaponTypeTableFilter(String(WeaponType.CATALYST))}>
										{weaponTypeLabels[WeaponType.CATALYST]}
									</SelectInputOption>
								</SelectInputContent>
							</SelectInput>

							<SelectInput
								value={weaponTableRarityLabel}
								readOnly
								wrapperClassName="w-full"
							>
								<SelectInputContent>
									<SelectInputOption onSelect={() => setWeaponRarityTableFilter("all")}>
										All Rarities
									</SelectInputOption>
									{weaponRarityKeys.map((rarity) => (
										<SelectInputOption
											key={`weapon-rarity-${rarity}`}
											onSelect={() => setWeaponRarityTableFilter(String(rarity))}
										>
											{weaponRarityLabels[rarity]}
										</SelectInputOption>
									))}
								</SelectInputContent>
							</SelectInput>

							<SelectInput
								value={weaponTableSortByLabelMap[weaponTableSortBy] ?? "Sort"}
								readOnly
								wrapperClassName="w-full"
							>
								<SelectInputContent>
									<SelectInputOption onSelect={() => setWeaponTableSortBy("name-asc")}>
										Name A-Z
									</SelectInputOption>
									<SelectInputOption onSelect={() => setWeaponTableSortBy("name-desc")}>
										Name Z-A
									</SelectInputOption>
									<SelectInputOption onSelect={() => setWeaponTableSortBy("rarity-asc")}>
										Rarity Low-High
									</SelectInputOption>
									<SelectInputOption onSelect={() => setWeaponTableSortBy("rarity-desc")}>
										Rarity High-Low
									</SelectInputOption>
								</SelectInputContent>
							</SelectInput>
						</div>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>
										{t(
											getTranslationToken(
												"weapons",
												weaponsLocaleKeys.weapons_table_icon,
											),
										)}
									</TableHead>
									<TableHead>
										{t(
											getTranslationToken(
												"weapons",
												weaponsLocaleKeys.weapons_table_name,
											),
										)}
									</TableHead>
									<TableHead>
										{t(
											getTranslationToken(
												"weapons",
												weaponsLocaleKeys.weapons_table_type,
											),
										)}
									</TableHead>
									<TableHead>
										{t(
											getTranslationToken(
												"weapons",
												weaponsLocaleKeys.weapons_table_rarity,
											),
										)}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredWeapons.map((weapon) => (
									<TableRow key={weapon.id}>
										<TableCell>
											<Avatar className="size-8 rounded-md border border-white/10">
												<AvatarImage
													src={weapon.iconUrl || IconAssets.EMPTY_CHARACTER_ICON}
													alt={weapon.name}
												/>
												<AvatarFallback className="rounded-md bg-white/10 text-xs text-white">
													{getInitials(weapon.name)}
												</AvatarFallback>
											</Avatar>
										</TableCell>
										<TableCell>{weapon.name}</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												{WeaponTypeDetail[weapon.type]?.iconUrl ? (
													<img
														src={WeaponTypeDetail[weapon.type].iconUrl}
														alt={WeaponTypeDetail[weapon.type].name}
														className="size-4"
													/>
												) : (
													<span className="text-white/60">-</span>
												)}
												<span>{weaponTypeLabels[weapon.type]}</span>
											</div>
										</TableCell>
										<TableCell>{weaponRarityLabels[weapon.rarity]}</TableCell>
									</TableRow>
								))}
								{filteredWeapons.length === 0 && (
									<TableRow>
										<TableCell colSpan={4} className="text-center text-white/70">
											No weapons match current filters
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</section>

					<section className="rounded-xl border border-white/10 bg-black/30 p-4 backdrop-blur mt-6">
						<h2 className="mb-4 text-lg font-semibold text-white">
							{t(
								getTranslationToken(
									"weapon-costs",
									weaponCostsLocaleKeys.weapon_costs_upgrade_level,
								),
							)}
						</h2>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>
										{t(
											getTranslationToken(
												"weapon-costs",
												weaponCostsLocaleKeys.weapon_costs_upgrade_level,
											),
										)}
									</TableHead>
									{weaponRarityKeys.map((rarity) => (
										<TableHead key={rarity}>{weaponRarityLabels[rarity]}</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{weaponCosts.map((costRow) => {
									const itemMap = new Map(
										costRow.items.map((item) => [item.rarity, item]),
									);
									return (
										<TableRow key={costRow.upgradeLevel}>
											<TableCell>{costRow.upgradeLevel}</TableCell>
											{weaponRarityKeys.map((rarity) => {
												const item = itemMap.get(rarity);
												if (!item) {
													return <TableCell key={`${costRow.upgradeLevel}-${rarity}`}>-</TableCell>;
												}
												return (
													<TableCell key={`${costRow.upgradeLevel}-${rarity}`}>
														{item.value} {getUnitLabel(item.unit)}
													</TableCell>
												);
											})}
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</section>
				</TabsContent>
			</Tabs>
		</div>
	);
}

type SummaryCardProps = {
	label: string;
	value: number;
};

function SummaryCard({ label, value }: SummaryCardProps) {
	return (
		<div className="rounded-xl border border-white/10 bg-black/30 p-4 backdrop-blur">
			<p className="text-sm text-white/70">{label}</p>
			<p className="text-2xl font-semibold text-white">{value}</p>
		</div>
	);
}
