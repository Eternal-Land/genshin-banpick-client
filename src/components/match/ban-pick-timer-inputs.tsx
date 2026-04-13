import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { matchLocaleKeys } from "@/i18n/keys";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const CLOCK_EDITABLE_POSITIONS = [0, 1, 3, 4] as const;

export interface BanPickTimerInputValues {
	chamber1: string;
	chamber2: string;
	chamber3: string;
	reset: string;
}

export interface BanPickTimerInputsProps {
	isRealtimeMatch: boolean;
	side: "blue" | "red";
	values?: BanPickTimerInputValues;
	onValuesChange?: (
		side: "blue" | "red",
		values: BanPickTimerInputValues,
	) => void;
}

export default function BanPickTimerInputs({
	isRealtimeMatch,
	side,
	values,
	onValuesChange,
}: BanPickTimerInputsProps) {
	const { t } = useTranslation("match");
	const resolvedValues = useMemo<BanPickTimerInputValues>(
		() =>
			values ?? {
				chamber1: "",
				chamber2: "",
				chamber3: "",
				reset: "",
			},
		[values],
	);

	const updateField = (field: keyof BanPickTimerInputValues, value: string) => {
		if (!onValuesChange) {
			return;
		}

		onValuesChange(side, {
			...resolvedValues,
			[field]: value,
		});
	};

	const formatClockInput = (rawValue: string) => {
		const digits = rawValue.replace(/\D/g, "").slice(0, 4);
		const minutes = digits.slice(0, 2);
		const seconds = digits.slice(2, 4);

		if (seconds.length > 0) {
			return `${minutes}:${seconds}`;
		}

		if (minutes.length === 2) {
			return `${minutes}:`;
		}

		return minutes;
	};

	const normalizeClockForEdit = (value: string) => {
		const digits = value.replace(/\D/g, "").slice(0, 4).padEnd(4, "0");
		return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
	};

	const getEditablePositionAtOrAfter = (position: number) =>
		CLOCK_EDITABLE_POSITIONS.find((item) => item >= position) ?? 4;

	const getEditablePositionBefore = (position: number) =>
		[...CLOCK_EDITABLE_POSITIONS].reverse().find((item) => item < position) ?? 0;

	const onClockInputChange =
		(field: "chamber1" | "chamber2" | "chamber3") =>
		(event: ChangeEvent<HTMLInputElement>) => {
			const target = event.target;
			const nextValue = formatClockInput(target.value);
			updateField(field, nextValue);

			const rawDigitsLength = target.value.replace(/\D/g, "").slice(0, 4).length;
			const shouldJumpToSeconds =
				rawDigitsLength === 2 && (target.selectionStart ?? 0) <= 2;

			if (shouldJumpToSeconds) {
				requestAnimationFrame(() => {
					target.setSelectionRange(3, 3);
				});
			}
		};

	const onClockInputKeyDown =
		(field: "chamber1" | "chamber2" | "chamber3") =>
		(event: KeyboardEvent<HTMLInputElement>) => {
			if (event.ctrlKey || event.metaKey || event.altKey) {
				return;
			}

			const target = event.currentTarget;
			const selectionStart = target.selectionStart ?? 0;

			if (/^\d$/.test(event.key)) {
				event.preventDefault();
				const editablePosition = getEditablePositionAtOrAfter(selectionStart);
				const nextChars = normalizeClockForEdit(target.value).split("");
				nextChars[editablePosition] = event.key;
				const nextValue = nextChars.join("");
				updateField(field, nextValue);

				const nextCursor = getEditablePositionAtOrAfter(editablePosition + 1);
				requestAnimationFrame(() => {
					target.setSelectionRange(nextCursor, nextCursor);
				});
				return;
			}

			if (event.key === "Backspace") {
				event.preventDefault();
				const editablePosition = getEditablePositionBefore(selectionStart);
				const nextChars = normalizeClockForEdit(target.value).split("");
				nextChars[editablePosition] = "0";
				updateField(field, nextChars.join(""));
				requestAnimationFrame(() => {
					target.setSelectionRange(editablePosition, editablePosition);
				});
				return;
			}

			if (event.key === "Delete") {
				event.preventDefault();
				const editablePosition = getEditablePositionAtOrAfter(selectionStart);
				const nextChars = normalizeClockForEdit(target.value).split("");
				nextChars[editablePosition] = "0";
				updateField(field, nextChars.join(""));
				requestAnimationFrame(() => {
					target.setSelectionRange(editablePosition, editablePosition);
				});
			}
		};

	if (isRealtimeMatch) {
		return (
			<Field>
				<FieldLabel>{t(matchLocaleKeys.ban_pick_timer_time)}</FieldLabel>
				<Input
					value={resolvedValues.chamber1}
					onChange={onClockInputChange("chamber1")}
					onKeyDown={onClockInputKeyDown("chamber1")}
					placeholder="00:00"
				/>
			</Field>
		);
	}

	return (
		<>
			<Field>
				<FieldLabel>{t(matchLocaleKeys.ban_pick_timer_chamber_1)}</FieldLabel>
				<Input
					value={resolvedValues.chamber1}
					onChange={onClockInputChange("chamber1")}
					onKeyDown={onClockInputKeyDown("chamber1")}
					placeholder="00:00"
				/>
			</Field>
			<Field>
				<FieldLabel>{t(matchLocaleKeys.ban_pick_timer_chamber_2)}</FieldLabel>
				<Input
					value={resolvedValues.chamber2}
					onChange={onClockInputChange("chamber2")}
					onKeyDown={onClockInputKeyDown("chamber2")}
					placeholder="00:00"
				/>
			</Field>
			<Field>
				<FieldLabel>{t(matchLocaleKeys.ban_pick_timer_chamber_3)}</FieldLabel>
				<Input
					value={resolvedValues.chamber3}
					onChange={onClockInputChange("chamber3")}
					onKeyDown={onClockInputKeyDown("chamber3")}
					placeholder="00:00"
				/>
			</Field>
			<Field>
				<FieldLabel>{t(matchLocaleKeys.ban_pick_timer_reset)}</FieldLabel>
				<Input
					value={resolvedValues.reset}
					onChange={(event) => updateField("reset", event.target.value)}
					placeholder="00"
				/>
			</Field>
		</>
	);
}
