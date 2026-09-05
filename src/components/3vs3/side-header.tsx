import type { MatchResponse } from "@/apis/match/types";
import { cn } from "@/lib/utils";
import type { DraftSide } from "./types";

interface SideHeaderProps {
	side: DraftSide;
	player?: MatchResponse["bluePlayer"];
	picksCount: number;
	picksPerSide: number;
	turnTimeDisplay: string;
	punishTime: number;
	remainingTimeDisplay: string;
	remainingTimeSeconds: number;
	isActiveTurn: boolean;
	isOvertime: boolean;
}

export default function SideHeader({
	side,
	player,
	turnTimeDisplay,
	remainingTimeDisplay,
	remainingTimeSeconds,
	isActiveTurn,
	isOvertime,
	punishTime,
}: SideHeaderProps) {
	const isBlue = side === "blue";
	const remainingTimeClassName =
		remainingTimeSeconds < 0
			? "text-rose-300"
			: remainingTimeSeconds <= 60
				? "text-amber-200"
				: isBlue
					? "text-sky-200"
					: "text-red-200";

	return (
		<div
			className={cn(
				"flex justify-between rounded-xl border border-white/20 bg-white/5 p-4",
				isBlue ? "flex-row" : "flex-row-reverse",
			)}
		>
			<div
				className={cn(
					"flex items-center gap-3",
					!isBlue && "flex-row-reverse text-right",
				)}
			>
				<img
					src={player?.avatar}
					alt={player?.displayName ?? "Player"}
					className="h-12 w-12 rounded-full border border-white/30 object-cover"
				/>
				<div className={cn("flex flex-col", !isBlue && "items-end")}>
					<span
						className={cn(
							"text-lg font-semibold",
							isBlue ? "text-sky-400" : "text-red-500",
						)}
					>
						{player?.displayName ?? "-"}
					</span>
					<span className="text-xs text-white/70">
						UID: {player?.ingameUuid ?? "-"}
					</span>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<div
					className={cn(
						"rounded-md border bg-black/30 px-3 py-2 text-right w-48",
						isActiveTurn ? "border-amber-300/60" : "border-white/15",
					)}
				>
					<div
						className={cn(
							"inline-block text-center text-sm font-semibold tabular-nums",
							isActiveTurn
								? isOvertime
									? "text-rose-300"
									: "text-amber-200"
								: "text-white/75",
						)}
					>
						{turnTimeDisplay}
					</div>
					<div className="text-[12px] uppercase tracking-wider text-white/55 flex gap-1 justify-between">
						<span>Remain</span>
						<span
							className={cn(
								"inline-block text-center tabular-nums",
								remainingTimeClassName,
							)}
						>
							{remainingTimeDisplay}
							{punishTime > 0 ? ` (+${punishTime}s)` : ""}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
