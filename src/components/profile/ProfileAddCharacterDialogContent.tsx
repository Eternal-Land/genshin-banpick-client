import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import { userCharactersApi } from "@/apis/user-characters";
import { Button } from "@/components/ui/button";
import {
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	SelectInput,
	SelectInputContent,
	SelectInputEmpty,
	SelectInputOption,
} from "@/components/select-input";
import { getTranslationToken } from "@/i18n/namespaces";
import { profileLocaleKeys } from "@/i18n/keys";

export interface ProfileAddCharacterDialogContentProps {
	selectedCharacterId: string;
	onSelectedCharacterIdChange: (value: string) => void;
	characterLevel: string;
	onCharacterLevelChange: (value: string) => void;
	constellation: string;
	onConstellationChange: (value: string) => void;
	onAddCharacter: () => void;
	isPending: boolean;
}

export default function ProfileAddCharacterDialogContent({
	selectedCharacterId,
	onSelectedCharacterIdChange,
	characterLevel,
	onCharacterLevelChange,
	constellation,
	onConstellationChange,
	onAddCharacter,
	isPending,
}: ProfileAddCharacterDialogContentProps) {
	const { t } = useTranslation();
	const [draftCharacterName, setDraftCharacterName] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setDebouncedSearch(searchTerm);
		}, 500);

		return () => clearTimeout(timeoutId);
	}, [searchTerm]);

	const { data: availableCharactersResponse } = useQuery({
		queryKey: ["user", "characters", "available", debouncedSearch],
		queryFn: () =>
			userCharactersApi.searchCharacters({ query: debouncedSearch }),
	});

	const availableCharacters = useMemo(
		() => availableCharactersResponse?.data ?? [],
		[availableCharactersResponse],
	);

	const selectedCharacterName = useMemo(
		() =>
			availableCharacters.find(
				(character) => character.id.toString() === selectedCharacterId,
			)?.name ?? "",
		[availableCharacters, selectedCharacterId],
	);

	const displayCharacterValue =
		selectedCharacterId && selectedCharacterName
			? selectedCharacterName
			: draftCharacterName;

	const handleCharacterInputChange = (value: string) => {
		setDraftCharacterName(value);
		setSearchTerm(value);

		if (!value.trim()) {
			onSelectedCharacterIdChange("");
			return;
		}

		onSelectedCharacterIdChange("");
	};

	const handleCharacterSelect = (characterId: string) => {
		const selectedCharacter = availableCharacters.find(
			(character) => character.id.toString() === characterId,
		);

		if (!selectedCharacter) {
			onSelectedCharacterIdChange("");
			return;
		}

		setDraftCharacterName(selectedCharacter.name);
		onSelectedCharacterIdChange(selectedCharacter.id.toString());
	};

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>
					{t(
						getTranslationToken(
							"profile",
							profileLocaleKeys.profile_add_character_title,
						),
					)}
				</DialogTitle>
				<DialogDescription>
					{t(
						getTranslationToken(
							"profile",
							profileLocaleKeys.profile_add_character_description,
						),
					)}
				</DialogDescription>
			</DialogHeader>
			<div className="space-y-4">
				<div className="space-y-2">
					<Label className="text-sm text-white/70">
						{t(
							getTranslationToken(
								"profile",
								profileLocaleKeys.profile_add_character_select_label,
							),
						)}
					</Label>
					<SelectInput
						value={displayCharacterValue}
						placeholder={t(
							getTranslationToken(
								"profile",
								profileLocaleKeys.profile_add_character_select_placeholder,
							),
						)}
						onValueChange={handleCharacterInputChange}
						wrapperClassName="w-full"
					>
						<SelectInputContent className="max-h-[20vh] overflow-y-auto">
							{availableCharacters.length === 0 ? (
								<SelectInputEmpty
									title={t(
										getTranslationToken(
											"profile",
											profileLocaleKeys.profile_add_character_empty,
										),
									)}
								/>
							) : (
								availableCharacters.map((character) => (
									<SelectInputOption
										key={character.id}
										value={character.id.toString()}
										onSelect={(value) => {
											if (value) {
												handleCharacterSelect(value);
											}
										}}
									>
										{character.name}
									</SelectInputOption>
								))
							)}
						</SelectInputContent>
					</SelectInput>
				</div>
				<div className="grid gap-3 sm:grid-cols-2">
					<div className="space-y-2">
						<Label className="text-sm text-white/70" htmlFor="character-level">
							{t(
								getTranslationToken(
									"profile",
									profileLocaleKeys.profile_add_character_level_label,
								),
							)}
						</Label>
						<Input
							id="character-level"
							type="number"
							min={0}
							placeholder={t(
								getTranslationToken(
									"profile",
									profileLocaleKeys.profile_add_character_level_placeholder,
								),
							)}
							value={characterLevel}
							onChange={(event) => onCharacterLevelChange(event.target.value)}
							inputMode="numeric"
						/>
					</div>
					<div className="space-y-2">
						<Label
							className="text-sm text-white/70"
							htmlFor="character-constellation"
						>
							{t(
								getTranslationToken(
									"profile",
									profileLocaleKeys.profile_add_character_constellation_label,
								),
							)}
						</Label>
						<Input
							id="character-constellation"
							type="number"
							min={0}
							max={6}
							placeholder={t(
								getTranslationToken(
									"profile",
									profileLocaleKeys.profile_add_character_constellation_placeholder,
								),
							)}
							value={constellation}
							onChange={(event) => onConstellationChange(event.target.value)}
							inputMode="numeric"
						/>
					</div>
				</div>
			</div>
			<DialogFooter>
				<DialogClose asChild>
					<Button variant="outline">
						{t(
							getTranslationToken(
								"profile",
								profileLocaleKeys.profile_add_character_cancel,
							),
						)}
					</Button>
				</DialogClose>
				<Button
					onClick={onAddCharacter}
					disabled={!selectedCharacterId || isPending}
				>
					{isPending
						? t(
								getTranslationToken(
									"profile",
									profileLocaleKeys.profile_add_character_pending,
								),
							)
						: t(
								getTranslationToken(
									"profile",
									profileLocaleKeys.profile_add_character_submit,
								),
							)}
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}
