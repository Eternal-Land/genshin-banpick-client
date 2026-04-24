import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { matchLocaleKeys } from "@/i18n/keys";
import type { DraftAction } from "@/components/match/ban-pick.types";
import { TURN_DURATION_SECONDS } from "@/components/match/ban-pick.utils";

interface BanPickDraftTimerProps {
	turnStartedAt: string | null;
	blueTimeBank: number;
	redTimeBank: number;
	currentAction?: DraftAction;
	isDraftCompleted: boolean;
}

const formatTimer = (seconds: number) => {
	const clamped = Math.max(0, Math.ceil(seconds));
	const m = Math.floor(clamped / 60);
	const s = clamped % 60;
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export default function BanPickDraftTimer({
	turnStartedAt,
	blueTimeBank,
	redTimeBank,
	currentAction,
	isDraftCompleted,
}: BanPickDraftTimerProps) {
	const { t } = useTranslation("match");
	const [now, setNow] = useState(Date.now());

	useEffect(() => {
		if (isDraftCompleted || !turnStartedAt) {
			return;
		}

		const interval = setInterval(() => {
			setNow(Date.now());
		}, 100);

		return () => clearInterval(interval);
	}, [isDraftCompleted, turnStartedAt]);

	// Reset `now` when turnStartedAt changes to avoid flicker
	useEffect(() => {
		setNow(Date.now());
	}, [turnStartedAt]);

	const timerState = useMemo(() => {
		if (isDraftCompleted || !turnStartedAt || !currentAction) {
			return null;
		}

		const startMs = new Date(turnStartedAt).getTime();
		const elapsedSeconds = Math.max(0, (now - startMs) / 1000);

		const sideBank = currentAction.side === "blue" ? blueTimeBank : redTimeBank;

		const turnTimeRemaining = Math.max(
			0,
			TURN_DURATION_SECONDS - elapsedSeconds,
		);
		const isUsingBank = turnTimeRemaining <= 0;
		const bankTimeUsed = isUsingBank
			? elapsedSeconds - TURN_DURATION_SECONDS
			: 0;
		const bankRemaining = Math.max(0, sideBank - bankTimeUsed);

		return {
			turnTimeRemaining,
			isUsingBank,
			bankRemaining,
		};
	}, [
		blueTimeBank,
		currentAction,
		isDraftCompleted,
		now,
		redTimeBank,
		turnStartedAt,
	]);

	if (!timerState) {
		return null;
	}

	const displaySeconds = timerState.isUsingBank
		? timerState.bankRemaining
		: timerState.turnTimeRemaining;

	const isUrgent = timerState.isUsingBank || timerState.turnTimeRemaining <= 5;
	const isCritical = timerState.isUsingBank && timerState.bankRemaining <= 10;

	return (
		<div className="flex flex-col items-center gap-2 w-full">
			{/* Main countdown */}
			<div
				className={`text-4xl font-mono font-bold tabular-nums transition-colors ${
					isCritical
						? "text-red-500 animate-pulse"
						: isUrgent
							? "text-yellow-400"
							: "text-white"
				}`}
			>
				{formatTimer(displaySeconds)}
			</div>

			{/* Phase indicator */}
			<p
				className={`text-xs ${
					timerState.isUsingBank ? "text-yellow-400" : "text-white/60"
				}`}
			>
				{timerState.isUsingBank
					? t(matchLocaleKeys.ban_pick_timer_bank_time)
					: t(matchLocaleKeys.ban_pick_timer_turn_time)}
			</p>

			{/* Bank displays */}
			<div className="flex w-full justify-between text-xs text-white/70 mt-1">
				<div className="flex flex-col items-center gap-0.5">
					<span className="text-sky-400">
						{t(matchLocaleKeys.ban_pick_side_blue)}
					</span>
					<span className="font-mono tabular-nums">
						{formatTimer(
							currentAction?.side === "blue" && timerState.isUsingBank
								? timerState.bankRemaining
								: blueTimeBank,
						)}
					</span>
				</div>
				<div className="flex flex-col items-center gap-0.5">
					<span className="text-red-400">
						{t(matchLocaleKeys.ban_pick_side_red)}
					</span>
					<span className="font-mono tabular-nums">
						{formatTimer(
							currentAction?.side === "red" && timerState.isUsingBank
								? timerState.bankRemaining
								: redTimeBank,
						)}
					</span>
				</div>
			</div>
		</div>
	);
}
