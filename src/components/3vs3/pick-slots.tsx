import type { BanPickCharacter } from "@/components/match/ban-pick.types";
import { CharacterElementDetail, CharacterElement } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { DraftSide, PendingPickState } from "./types";

interface PickSlotsProps {
	side: DraftSide;
	picks: BanPickCharacter[];
	picksPerSide: number;
	currentPickSide?: DraftSide;
	isPickTurn: boolean;
	pendingPick: PendingPickState | null;
	isDraftCompleted: boolean;
}

export default function PickSlots({
	side,
	picks,
	picksPerSide,
	currentPickSide,
	isPickTurn,
	pendingPick,
	isDraftCompleted,
}: PickSlotsProps) {
	const elementBadgeClasses: Record<string, string> = {
		[CharacterElementDetail[CharacterElement.ANEMO].key]:
			"bg-teal-950/75 border-teal-400",
		[CharacterElementDetail[CharacterElement.GEO].key]:
			"bg-amber-950/70 border-amber-300",
		[CharacterElementDetail[CharacterElement.ELECTRO].key]:
			"bg-purple-950/75 border-purple-700",
		[CharacterElementDetail[CharacterElement.DENDRO].key]:
			"bg-lime-950/70 border-lime-500",
		[CharacterElementDetail[CharacterElement.HYDRO].key]:
			"bg-sky-950/70 border-sky-400",
		[CharacterElementDetail[CharacterElement.PYRO].key]:
			"bg-red-950/70 border-red-500",
		[CharacterElementDetail[CharacterElement.CRYO].key]:
			"bg-cyan-950/70 border-cyan-300",
	};

	return (
		<div className="rounded-xl border border-white/20 bg-white/5 p-4">
			<div className="mb-2 text-xs uppercase tracking-wider text-white/70">
				Team Pool
			</div>
			<div className="grid grid-cols-8 gap-2">
				{Array.from({ length: picksPerSide }).map((_, index) => {
					const committed = picks[index];
					const preview =
						!isDraftCompleted &&
							isPickTurn &&
							!committed &&
							pendingPick?.side === side &&
							currentPickSide === side &&
							index === picks.length
							? pendingPick.character
							: null;

					const character = committed ?? preview;
					const isActiveSlot =
						!isDraftCompleted &&
						isPickTurn &&
						currentPickSide === side &&
						index === picks.length;

					return (
						<div
							key={`${side}-pick-slot-${index}`}
							className={cn(
								"relative h-16 overflow-hidden rounded-md border",
								side === "blue"
									? "border-sky-400/40 bg-sky-500/10"
									: "border-red-500/40 bg-red-500/10",
								isActiveSlot && "animate-pulse border-yellow-400",
							)}
						>
							{character ? (
								<>
									<img
										src={character.imageUrl}
										alt={character.name}
										className={cn(
											"h-full w-full object-cover",
											preview && "opacity-70",
										)}
									/>
									{CharacterElementDetail[character.element] ? (
										<div
											className={cn(
												"absolute left-1 top-1 size-5 rounded-full shadow flex items-center justify-center border z-1",
												elementBadgeClasses[CharacterElementDetail[character.element].key] ?? "bg-slate-950/70 border-slate-400",
											)}
										>
											<img
												src={CharacterElementDetail[character.element].iconUrl}
												alt={CharacterElementDetail[character.element].name}
												className="size-3"
											/>
										</div>
									) : null}
								</>
							) : null}
						</div>
					);
				})}
			</div>
		</div>
	);
}
