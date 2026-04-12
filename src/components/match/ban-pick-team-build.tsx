import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconAssets } from "@/lib/constants/icon-assets";
import type { BanPickCharacter } from "@/components/match/ban-pick.types";
import { useEffect, useMemo, useState } from "react";
import type { UserWeaponResponse } from "@/apis/user-weapons/types";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { matchLocaleKeys } from "@/i18n/keys";
import { useTranslation } from "react-i18next";

interface WeaponPickerState {
	characterId: string;
	weaponType: BanPickCharacter["weaponType"];
}

interface WeaponRefinementPickerState {
	character: BanPickCharacter;
	weapon: UserWeaponResponse;
	refinement: number;
}

export interface BanPickTeamBuildProps {
	picks: BanPickCharacter[];
	weapons: UserWeaponResponse[];
	titleClassName: string;
	slotClassName: string;
	canReorder?: boolean;
	canPickWeapon?: boolean;
	selectedWeaponByCharacterId?: Record<string, number | undefined>;
	selectedWeaponRefinementByCharacterId?: Record<string, number | undefined>;
	onPickWeapon?: (
		character: BanPickCharacter,
		weaponId: number,
		refinement: number,
	) => Promise<void> | void;
}

function toFixedTeamSlots(members: BanPickCharacter[]) {
	return Array.from({ length: 8 }).map((_, index) => members[index] ?? null);
}

export default function BanPickTeamBuild({
	picks,
	weapons,
	titleClassName,
	slotClassName,
	canReorder = true,
	canPickWeapon = true,
	selectedWeaponByCharacterId,
	selectedWeaponRefinementByCharacterId,
	onPickWeapon,
}: BanPickTeamBuildProps) {
	const { t } = useTranslation("match");
	const [orderedSlots, setOrderedSlots] = useState<
		Array<BanPickCharacter | null>
	>(() => toFixedTeamSlots(picks));
	const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
	const [
		selectedWeaponByCharacterIdState,
		setSelectedWeaponByCharacterIdState,
	] = useState<Record<string, number | undefined>>(
		selectedWeaponByCharacterId ?? {},
	);
	const [weaponPicker, setWeaponPicker] = useState<WeaponPickerState | null>(
		null,
	);
	const [weaponRefinementPicker, setWeaponRefinementPicker] =
		useState<WeaponRefinementPickerState | null>(null);
	const [isSubmittingWeapon, setIsSubmittingWeapon] = useState(false);
	const [selectedWeaponRefinementByCharacterIdState, setSelectedWeaponRefinementByCharacterIdState] =
		useState<Record<string, number | undefined>>(
			selectedWeaponRefinementByCharacterId ?? {},
		);

	const firstHalfOrder = useMemo(
		() => orderedSlots.slice(0, 4),
		[orderedSlots],
	);
	const secondHalfOrder = useMemo(
		() => orderedSlots.slice(4, 8),
		[orderedSlots],
	);

	useEffect(() => {
		setOrderedSlots(toFixedTeamSlots(picks));
	}, [picks]);

	useEffect(() => {
		setSelectedWeaponByCharacterIdState((prev) => {
			const next: Record<string, number | undefined> = {};
			picks.forEach((character) => {
				if (selectedWeaponByCharacterId) {
					// In controlled mode, trust server-synced mapping to avoid stale duplicates.
					next[character.id] = selectedWeaponByCharacterId[character.id];
					return;
				}

				next[character.id] = prev[character.id];
			});
			return next;
		});
	}, [picks, selectedWeaponByCharacterId]);

	useEffect(() => {
		setSelectedWeaponRefinementByCharacterIdState((prev) => {
			const next: Record<string, number | undefined> = {};
			picks.forEach((character) => {
				if (selectedWeaponRefinementByCharacterId) {
					next[character.id] =
						selectedWeaponRefinementByCharacterId[character.id];
					return;
				}

				next[character.id] = prev[character.id];
			});
			return next;
		});
	}, [picks, selectedWeaponRefinementByCharacterId]);

	const onSelectWeapon = async (
		character: BanPickCharacter,
		weaponId: number,
		refinement: number,
	) => {
		setIsSubmittingWeapon(true);
		try {
			if (onPickWeapon) {
				await onPickWeapon(character, weaponId, refinement);
			}
		} catch {
			return;
		} finally {
			setIsSubmittingWeapon(false);
		}

		setSelectedWeaponByCharacterIdState((prev) => ({
			...prev,
			[character.id]: weaponId,
		}));
		setSelectedWeaponRefinementByCharacterIdState((prev) => ({
			...prev,
			[character.id]: refinement,
		}));
		setWeaponRefinementPicker(null);
		setWeaponPicker(null);
	};

	const onUnequipWeapon = async (character: BanPickCharacter) => {
		setIsSubmittingWeapon(true);
		try {
			if (onPickWeapon) {
				await onPickWeapon(character, 0, 0);
			}
		} catch {
			return;
		} finally {
			setIsSubmittingWeapon(false);
		}

		setSelectedWeaponByCharacterIdState((prev) => ({
			...prev,
			[character.id]: undefined,
		}));
		setSelectedWeaponRefinementByCharacterIdState((prev) => ({
			...prev,
			[character.id]: undefined,
		}));
		setWeaponRefinementPicker(null);
		setWeaponPicker(null);
	};

	const weaponPickerOptions = useMemo(() => {
		if (!weaponPicker) {
			return [] as UserWeaponResponse[];
		}

		return weapons.filter((weapon) => weapon.type === weaponPicker.weaponType);
	}, [weaponPicker, weapons]);

	const weaponPickerCharacter = useMemo(() => {
		if (!weaponPicker) {
			return null;
		}

		return picks.find((member) => member.id === weaponPicker.characterId) ?? null;
	}, [weaponPicker, picks]);

	const renderConstellationBadge = (member: BanPickCharacter | null) => {
		if (!member) {
			return null;
		}

		return (
			<span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
				C{member.constellation}
			</span>
		);
	};

	const renderWeaponSlot = (member: BanPickCharacter | null) => {
		if (!member) {
			return <Plus className="h-6 w-6 text-white/80" />;
		}

		const selectedWeaponId = selectedWeaponByCharacterIdState[member.id];
		const selectedWeaponRefinement =
			selectedWeaponRefinementByCharacterIdState[member.id];
		const selectedWeapon = weapons.find(
			(weapon) => weapon.id === selectedWeaponId,
		);

		return (
			<button
				type="button"
				onClick={() =>
					setWeaponPicker({
						characterId: member.id,
						weaponType: member.weaponType,
					})
				}
				disabled={!canPickWeapon}
				className="relative flex h-full w-full items-center justify-center overflow-hidden rounded border border-white/20 bg-white/5 p-1"
			>
				{selectedWeapon?.iconUrl ? (
					<img
						src={selectedWeapon.iconUrl}
						alt={selectedWeapon.name}
						className="h-full w-full object-contain"
					/>
				) : (
					<Plus className="h-6 w-6 text-white/80" />
				)}
				{selectedWeapon && canPickWeapon ? (
					<button
						type="button"
						onClick={(event) => {
							event.preventDefault();
							event.stopPropagation();
							void onUnequipWeapon(member);
						}}
						disabled={!canPickWeapon || isSubmittingWeapon}
						className="absolute left-1 bottom-1 rounded bg-red-600/70 p-1 text-white hover:bg-black/90 disabled:opacity-60"
					>
						<X className="h-3 w-3" />
					</button>
				) : null}
				{selectedWeapon && selectedWeaponRefinement ? (
						<span className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
							R{selectedWeaponRefinement}
						</span>
					) : null}
			</button>
		);
	};

	const onDropToSlot = (targetIndex: number) => {
		if (!canReorder || draggingIndex === null) {
			return;
		}

		if (draggingIndex === targetIndex) {
			setDraggingIndex(null);
			return;
		}

		setOrderedSlots((prev) => {
			const next = [...prev];
			const sourceMember = next[draggingIndex];
			next[draggingIndex] = next[targetIndex];
			next[targetIndex] = sourceMember;
			return next;
		});

		setDraggingIndex(null);
	};

	return (
		<div className="flex flex-col gap-4 h-full">
			<div className="grid grid-cols-2 gap-4">
				<div className="rounded-lg border border-white/20 bg-white/5 p-4">
					<h3
						className={cn(
							"mb-3 text-sm font-semibold col-span-3 text-center",
							titleClassName,
						)}
					>
						{t(matchLocaleKeys.ban_pick_first_half)}
					</h3>
					<div className="flex items-center grid grid-cols-4 gap-4">
						{firstHalfOrder.map((member, index) => {
							const globalIndex = index;

							return (
								<div
									key={`first-half-member-${index}`}
									className="flex flex-col gap-2"
								>
									<div
										className={cn(
											"relative w-full h-28 flex items-center justify-center border border-2 overflow-hidden rounded-md",
											member && canReorder && "cursor-move",
											slotClassName,
										)}
										draggable={Boolean(member) && canReorder}
										onDragStart={() => {
											if (!member || !canReorder) {
												return;
											}

											setDraggingIndex(globalIndex);
										}}
										onDragEnd={() => setDraggingIndex(null)}
										onDragOver={(event) => {
											if (!canReorder) {
												return;
											}
											event.preventDefault();
										}}
										onDrop={() => onDropToSlot(globalIndex)}
									>
										{member ? (
											<>
												<img
													src={member.imageUrl}
													alt={member.name}
													className="w-full h-full object-cover"
												/>
												{renderConstellationBadge(member)}
											</>
										) : (
											<img
												src={IconAssets.EMPTY_CHARACTER_ICON}
												alt={t(matchLocaleKeys.ban_pick_empty_team_slot_alt)}
												className="w-12 h-12 object-contain"
											/>
										)}
									</div>
									<div className="flex flex-col items-center justify-center aspect-square">
										{renderWeaponSlot(member)}
									</div>
								</div>
							);
						})}
					</div>
				</div>

				<div className="rounded-lg border border-white/20 bg-white/5 p-4">
					<h3
						className={cn(
							"mb-3 text-sm font-semibold col-span-3 text-center",
							titleClassName,
						)}
					>
						{t(matchLocaleKeys.ban_pick_second_half)}
					</h3>
					<div className="flex items-center grid grid-cols-4 gap-4">
						{secondHalfOrder.map((member, index) => {
							const globalIndex = index + 4;

							return (
								<div
									key={`second-half-member-${index}`}
									className="flex flex-col gap-2"
								>
									<div
										className={cn(
											"relative w-full h-28 flex items-center justify-center border border-2 overflow-hidden rounded-md",
											member && canReorder && "cursor-move",
											slotClassName,
										)}
										draggable={Boolean(member) && canReorder}
										onDragStart={() => {
											if (!member || !canReorder) {
												return;
											}

											setDraggingIndex(globalIndex);
										}}
										onDragEnd={() => setDraggingIndex(null)}
										onDragOver={(event) => {
											if (!canReorder) {
												return;
											}
											event.preventDefault();
										}}
										onDrop={() => onDropToSlot(globalIndex)}
									>
										{member ? (
											<>
												<img
													src={member.imageUrl}
													alt={member.name}
													className="w-full h-full object-cover"
												/>
												{renderConstellationBadge(member)}
											</>
										) : (
											<img
												src={IconAssets.EMPTY_CHARACTER_ICON}
												alt={t(matchLocaleKeys.ban_pick_empty_team_slot_alt)}
												className="w-12 h-12 object-contain"
											/>
										)}
									</div>
									<div className="flex items-center justify-center aspect-square">
										{renderWeaponSlot(member)}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			<Dialog
				open={Boolean(weaponPicker)}
				onOpenChange={(open) => !open && setWeaponPicker(null)}
			>
				<DialogContent className="max-w-3xl">
					<DialogHeader>
						<DialogTitle>{t(matchLocaleKeys.ban_pick_select_weapon)}</DialogTitle>
					</DialogHeader>

					<div className="grid grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto">
						{weaponPickerOptions.map((weapon) => {
							const isSelected =
								weaponPicker &&
								selectedWeaponByCharacterIdState[weaponPicker.characterId] ===
									weapon.id;

							return (
								<button
									key={weapon.id}
									type="button"
									onClick={() => {
										if (!weaponPickerCharacter) {
											return;
										}

										setWeaponRefinementPicker({
											character: weaponPickerCharacter,
											weapon,
											refinement: 1,
										});
									}}
									disabled={!canPickWeapon || !weaponPickerCharacter}
									className={cn(
										"flex flex-col items-center gap-2 rounded border border-white/20 p-2 bg-white/5 hover:bg-white/10",
										isSelected && "border-emerald-400 bg-emerald-500/10",
									)}
								>
									<div className="h-14 w-14 overflow-hidden rounded">
										<img
											src={weapon.iconUrl ?? IconAssets.EMPTY_CHARACTER_ICON}
											alt={weapon.name}
											className="h-full w-full object-contain"
										/>
									</div>
									<span className="text-xs text-center leading-tight">
										{weapon.name}
									</span>
								</button>
							);
						})}
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={Boolean(weaponRefinementPicker)}
				onOpenChange={(open) => {
					if (!open && !isSubmittingWeapon) {
						setWeaponRefinementPicker(null);
					}
				}}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>
							{t(matchLocaleKeys.ban_pick_select_weapon_refinement)}
						</DialogTitle>
						<DialogDescription>
							{t(matchLocaleKeys.ban_pick_choose_refinement_for, {
								weaponName: weaponRefinementPicker?.weapon.name,
							})}
						</DialogDescription>
					</DialogHeader>

					<div className="grid grid-cols-5 gap-2">
						{[1, 2, 3, 4, 5].map((refinement) => (
							<button
								key={refinement}
								type="button"
								onClick={() =>
									setWeaponRefinementPicker((prev) =>
										prev
											? {
												...prev,
												refinement,
										  }
											: prev,
									)
								}
								className={cn(
									"rounded border border-white/20 bg-white/5 py-2 text-sm hover:bg-white/10",
									weaponRefinementPicker?.refinement === refinement &&
										"border-emerald-400 bg-emerald-500/10",
								)}
							>
								R{refinement}
							</button>
						))}
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setWeaponRefinementPicker(null)}
							disabled={isSubmittingWeapon}
						>
							{t(matchLocaleKeys.ban_pick_cancel)}
						</Button>
						<Button
							onClick={() => {
								if (!weaponRefinementPicker) {
									return;
								}

								void onSelectWeapon(
									weaponRefinementPicker.character,
									weaponRefinementPicker.weapon.id,
									weaponRefinementPicker.refinement,
								);
							}}
							disabled={isSubmittingWeapon || !canPickWeapon}
						>
							{t(matchLocaleKeys.ban_pick_confirm)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
