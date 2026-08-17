import type { BanPickCharacter } from "@/components/match/ban-pick.types";
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
								<img
									src={character.imageUrl}
									alt={character.name}
									className={cn(
										"h-full w-full object-cover",
										preview && "opacity-70",
									)}
								/>
							) : null}
						</div>
					);
				})}
			</div>
		</div>
	);
}
