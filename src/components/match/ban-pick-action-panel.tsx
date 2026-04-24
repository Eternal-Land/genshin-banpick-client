import type { DraftAction } from "@/components/match/ban-pick.types";
import { Button } from "@/components/ui/button";
import { matchLocaleKeys } from "@/i18n/keys";
import { ArrowLeftRight, StepBack, StepForward } from "lucide-react";
import { useTranslation } from "react-i18next";
import BanPickDraftTimer from "@/components/match/ban-pick-draft-timer";

interface BanPickActionPanelProps {
	isDraftCompleted: boolean;
	draftStep: number;
	draftSequenceLength: number;
	currentAction?: DraftAction;
	isSubmittingTurnAction: boolean;
	isButtonDisabled: boolean;
	blueTotalComparableSeconds: number;
	redTotalComparableSeconds: number;
	turnStartedAt: string | null;
	blueTimeBank: number;
	redTimeBank: number;
	onSubmit: () => Promise<void> | void;
}

export default function BanPickActionPanel({
	isDraftCompleted,
	draftStep,
	draftSequenceLength,
	currentAction,
	isSubmittingTurnAction,
	isButtonDisabled,
	blueTotalComparableSeconds,
	redTotalComparableSeconds,
	turnStartedAt,
	blueTimeBank,
	redTimeBank,
	onSubmit,
}: BanPickActionPanelProps) {
	const { t } = useTranslation("match");
	const sideLabel =
		currentAction?.side === "blue"
			? t(matchLocaleKeys.ban_pick_side_blue)
			: currentAction?.side === "red"
				? t(matchLocaleKeys.ban_pick_side_red)
				: "";
	const actionLabel =
		currentAction?.type === "ban"
			? t(matchLocaleKeys.ban_pick_action_ban)
			: currentAction?.type === "pick"
				? t(matchLocaleKeys.ban_pick_action_pick)
				: "";

	const leadDifferenceSeconds = Math.abs(
		blueTotalComparableSeconds - redTotalComparableSeconds,
	);

	const isBlueLower = blueTotalComparableSeconds < redTotalComparableSeconds;
	const isBlueHigher = blueTotalComparableSeconds > redTotalComparableSeconds;

	return (
		<div className="col-span-1 flex flex-col items-center justify-between p-4">
			<div className="w-full mt-4 rounded-md border border-white/30 bg-white/5 p-3 text-center">
				<p className="text-sm text-white/80">
					{isDraftCompleted
						? t(matchLocaleKeys.ban_pick_draft_completed)
						: t(matchLocaleKeys.ban_pick_step_label, {
								step: draftStep + 1,
								total: draftSequenceLength,
								side: sideLabel,
								action: actionLabel,
							})}
				</p>
			</div>

			<BanPickDraftTimer
				turnStartedAt={turnStartedAt}
				blueTimeBank={blueTimeBank}
				redTimeBank={redTimeBank}
				currentAction={currentAction}
				isDraftCompleted={isDraftCompleted}
			/>

			<div className="w-full rounded-md p-3 text-center text-white/90">
				<p className="text-[11px] text-white/70">
					{t(matchLocaleKeys.ban_pick_lead_title)}
				</p>
				<div className="mt-2 flex justify-center">
					{isBlueLower ? (
						<div className="flex gap-2 items-center text-sky-400">
							<StepBack className="h-8 w-8 text-sky-400" />
							<h1 className="text-bold text-2xl">{leadDifferenceSeconds}s</h1>
						</div>
					) : isBlueHigher ? (
						<div className="flex gap-2 items-center text-red-400">
							<h1 className="text-bold text-2xl">{leadDifferenceSeconds}s</h1>
							<StepForward className="h-8 w-8" />
						</div>
					) : (
						<ArrowLeftRight className="h-8 w-8 text-white/70" />
					)}
				</div>
			</div>

			<div className="flex flex-col gap-2 w-full">
				<Button
					onClick={onSubmit}
					disabled={isButtonDisabled}
					className={
						isDraftCompleted
							? "w-full border shadow-[0_0_10px_rgba(255,255,255,0.2)]"
							: "w-full"
					}
					variant={isDraftCompleted ? "secondary" : "default"}
				>
					{isSubmittingTurnAction
						? t(matchLocaleKeys.ban_pick_submitting)
						: isDraftCompleted
							? t(matchLocaleKeys.ban_pick_complete_session)
							: t(matchLocaleKeys.ban_pick_confirm)}
				</Button>
			</div>
		</div>
	);
}
