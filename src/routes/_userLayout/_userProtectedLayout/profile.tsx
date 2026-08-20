import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { selfApi } from "@/apis/self";
import { accountCharactersApi } from "@/apis/account-characters";
import { hoyolabApi } from "@/apis/hoyolab";
import type { HoyolabSyncInput } from "@/apis/hoyolab/types";
import type {
	AccountCharacterResponse,
	UpdateAccountCharacterInput,
} from "@/apis/account-characters/types";
import CharacterContainer, {
	type CharacterContainerProps,
} from "@/components/player-side/character-container";
import { AccountRole } from "@/lib/constants";
import { getTranslationToken } from "@/i18n/namespaces";
import { headerLocaleKeys, profileLocaleKeys } from "@/i18n/keys";
import type { BaseApiResponse } from "@/lib/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import {
	ProfileAddCharacterDialogContent,
	ProfileEditCharacterDialog,
	ProfileHoyolabDialogs,
	ProfileRemoveCharacterDialog,
} from "@/components/profile";

export const Route = createFileRoute(
	"/_userLayout/_userProtectedLayout/profile",
)({
	component: RouteComponent,
});

function RouteComponent() {
	const { t } = useTranslation();
	const [isHoyoLabDialogOpen, setIsHoyoLabDialogOpen] = useState(false);
	const [isSyncConfirmOpen, setIsSyncConfirmOpen] = useState(false);
	const [isSyncResultOpen, setIsSyncResultOpen] = useState(false);
	const [isAddCharacterOpen, setIsAddCharacterOpen] = useState(false);
	const [isEditCharacterOpen, setIsEditCharacterOpen] = useState(false);
	const [isRemoveCharacterOpen, setIsRemoveCharacterOpen] = useState(false);
	const [selectedAccountCharacter, setSelectedAccountCharacter] =
		useState<AccountCharacterResponse | null>(null);
	const [selectedCharacterId, setSelectedCharacterId] = useState("");
	const [characterLevel, setCharacterLevel] = useState("");
	const [constellation, setConstellation] = useState("");
	const [editCharacterLevel, setEditCharacterLevel] = useState("");
	const [editConstellation, setEditConstellation] = useState("");
	const [syncResult, setSyncResult] = useState<"success" | "error" | null>(
		null,
	);
	const [hoyoUid, setHoyoUid] = useState("");
	const [hoyoServer, setHoyoServer] = useState("");
	const [generalCookie, setGeneralCookie] = useState("");
	const [cookieTokenV2, setCookieTokenV2] = useState("");
	const [ltokenV2, setLtokenV2] = useState("");
	const defaultCharacters: CharacterContainerProps[] = [];

	const {
		data: profileResponse,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["self"],
		queryFn: selfApi.getSelf,
	});

	const profile = profileResponse?.data;

	const { data: accountCharactersResponse, refetch: refetchAccountCharacters } =
		useQuery({
			queryKey: ["account-characters", profile?.id],
			queryFn: () => {
				if (!profile?.id) return Promise.reject("No profile ID");
				return accountCharactersApi.listAccountCharacters({
					accountId: profile.id,
				});
			},
			enabled: !!profile?.id,
		});

	const accountCharacters = useMemo<CharacterContainerProps[]>(() => {
		const items = accountCharactersResponse?.data ?? [];
		return items
			.filter((item) => item.characters)
			.map((item) => ({
				name: item.characters.name,
				level: item.characterLevel,
				rarity: item.characters.rarity as 4 | 5,
				constellation: item.activatedConstellation,
				element: item.characters.element,
				imageUrl: item.characters.iconUrl,
			}));
	}, [accountCharactersResponse]);

	const accountCharacterItems = accountCharactersResponse?.data ?? [];

	const roleLabel = useMemo(() => {
		if (!profile) return "";
		if (profile.role === AccountRole.ADMIN) {
			return t(
				getTranslationToken("header", headerLocaleKeys.header_role_admin),
			);
		}
		if (profile.role === AccountRole.STAFF) {
			return t(
				getTranslationToken("header", headerLocaleKeys.header_role_staff),
			);
		}
		return t(
			getTranslationToken("header", headerLocaleKeys.header_role_profile),
		);
	}, [profile, t]);

	useEffect(() => {
		if (!profile?.ingameUuid || hoyoUid) return;
		setHoyoUid(profile.ingameUuid);
	}, [profile?.ingameUuid, hoyoUid]);

	const syncMutation = useMutation<
		BaseApiResponse,
		AxiosError<BaseApiResponse>,
		HoyolabSyncInput
	>({
		mutationFn: hoyolabApi.syncCharacters,
		onSuccess: () => {
			toast.success(
				t(
					getTranslationToken(
						"profile",
						profileLocaleKeys.profile_hoyolab_sync_success,
					),
				),
			);
			setIsSyncConfirmOpen(false);
			setSyncResult("success");
			setIsSyncResultOpen(true);
			refetchAccountCharacters();
		},
		onError: (error) => {
			toast.error(
				error.response?.data.message ||
					t(
						getTranslationToken(
							"profile",
							profileLocaleKeys.profile_hoyolab_sync_error,
						),
					),
			);
			setIsSyncConfirmOpen(false);
			setSyncResult("error");
			setIsSyncResultOpen(true);
		},
	});

	const addCharacterMutation = useMutation<
		BaseApiResponse,
		AxiosError<BaseApiResponse>,
		number
	>({
		mutationFn: (characterId) =>
			accountCharactersApi.createAccountCharacter({
				characterId,
				characterLevel: characterLevel ? Number(characterLevel) : undefined,
				activatedConstellation: constellation
					? Number(constellation)
					: undefined,
			}),
		onSuccess: () => {
			toast.success(
				t(
					getTranslationToken(
						"profile",
						profileLocaleKeys.profile_add_character_success,
					),
				),
			);
			setSelectedCharacterId("");
			setCharacterLevel("");
			setConstellation("");
			setIsAddCharacterOpen(false);
			refetchAccountCharacters();
		},
		onError: (error) => {
			toast.error(
				error.response?.data.message ||
					t(
						getTranslationToken(
							"profile",
							profileLocaleKeys.profile_add_character_error,
						),
					),
			);
		},
	});

	const updateCharacterMutation = useMutation<
		BaseApiResponse,
		AxiosError<BaseApiResponse>,
		{ id: string; payload: UpdateAccountCharacterInput }
	>({
		mutationFn: ({ id, payload }) =>
			accountCharactersApi.updateAccountCharacter(id, payload),
		onSuccess: () => {
			toast.success(
				t(
					getTranslationToken(
						"profile",
						profileLocaleKeys.profile_edit_character_success,
					),
				),
			);
			setIsEditCharacterOpen(false);
			setSelectedAccountCharacter(null);
			refetchAccountCharacters();
		},
		onError: (error) => {
			toast.error(
				error.response?.data.message ||
					t(
						getTranslationToken(
							"profile",
							profileLocaleKeys.profile_edit_character_error,
						),
					),
			);
		},
	});

	const removeCharacterMutation = useMutation<
		BaseApiResponse,
		AxiosError<BaseApiResponse>,
		string
	>({
		mutationFn: (id) => accountCharactersApi.deleteAccountCharacter(id),
		onSuccess: () => {
			toast.success(
				t(
					getTranslationToken(
						"profile",
						profileLocaleKeys.profile_remove_character_success,
					),
				),
			);
			setIsRemoveCharacterOpen(false);
			setSelectedAccountCharacter(null);
			refetchAccountCharacters();
		},
		onError: (error) => {
			toast.error(
				error.response?.data.message ||
					t(
						getTranslationToken(
							"profile",
							profileLocaleKeys.profile_remove_character_error,
						),
					),
			);
		},
	});

	const isSyncReady = Boolean(
		hoyoUid && hoyoServer && generalCookie && cookieTokenV2 && ltokenV2,
	);

	const handleSyncConfirm = () => {
		syncMutation.mutate({
			uid: hoyoUid,
			server: hoyoServer,
			generalCookie,
			cookieTokenV2,
			ltokenV2,
		});
	};

	const handleAddCharacter = () => {
		if (!selectedCharacterId) return;
		addCharacterMutation.mutate(Number(selectedCharacterId));
	};

	const handleEditCharacterOpen = (item: AccountCharacterResponse) => {
		setSelectedAccountCharacter(item);
		setEditCharacterLevel(item.characterLevel?.toString() ?? "");
		setEditConstellation(item.activatedConstellation?.toString() ?? "");
		setIsEditCharacterOpen(true);
	};

	const handleRemoveCharacterOpen = (item: AccountCharacterResponse) => {
		setSelectedAccountCharacter(item);
		setIsRemoveCharacterOpen(true);
	};

	const handleEditCharacter = () => {
		if (!selectedAccountCharacter) return;
		updateCharacterMutation.mutate({
			id: selectedAccountCharacter.id,
			payload: {
				characterLevel: editCharacterLevel
					? Number(editCharacterLevel)
					: undefined,
				activatedConstellation: editConstellation
					? Number(editConstellation)
					: undefined,
			},
		});
	};

	const handleRemoveCharacter = () => {
		if (!selectedAccountCharacter) return;
		removeCharacterMutation.mutate(selectedAccountCharacter.id);
	};

	const handleAddCharacterOpenChange = (open: boolean) => {
		setIsAddCharacterOpen(open);
		if (!open) {
			setSelectedCharacterId("");
			setCharacterLevel("");
			setConstellation("");
		}
	};

	const handleEditCharacterOpenChange = (open: boolean) => {
		setIsEditCharacterOpen(open);
		if (!open) {
			setSelectedAccountCharacter(null);
			setEditCharacterLevel("");
			setEditConstellation("");
		}
	};

	const handleRemoveCharacterOpenChange = (open: boolean) => {
		setIsRemoveCharacterOpen(open);
		if (!open) {
			setSelectedAccountCharacter(null);
		}
	};

	return (
		<>
			<Dialog
				open={isAddCharacterOpen}
				onOpenChange={handleAddCharacterOpenChange}
			>
				<div className="flex justify-between items-center">
					<div className="flex flex-col">
						<div className="flex flex-wrap items-center gap-3">
							<h1 className="text-4xl font-semibold tracking-tight">
								{t(
									getTranslationToken(
										"profile",
										profileLocaleKeys.profile_title,
									),
								)}
							</h1>
							{isLoading ? (
								<span className="text-sm text-white/60">
									{t(
										getTranslationToken(
											"profile",
											profileLocaleKeys.profile_loading,
										),
									)}
								</span>
							) : isError ? (
								<span className="text-sm text-destructive">
									{t(
										getTranslationToken(
											"profile",
											profileLocaleKeys.profile_load_error,
										),
									)}
								</span>
							) : (
								<div className="flex flex-wrap gap-2">
									<Badge variant="secondary">{roleLabel}</Badge>
									{profile?.staffRolename ? (
										<Badge variant="outline">{profile.staffRolename}</Badge>
									) : null}
								</div>
							)}
						</div>
						<p className="mt-2 text-sm text-white/70">
							{t(
								getTranslationToken(
									"profile",
									profileLocaleKeys.profile_description,
								),
							)}
						</p>

						{profile?.permissions?.length ? (
							<div className="mt-6 flex flex-wrap gap-2">
								<span className="text-sm text-white/70">
									{t(
										getTranslationToken(
											"profile",
											profileLocaleKeys.profile_permissions_label,
										),
									)}
									:
								</span>
								{profile.permissions.map((permission) => (
									<Badge key={permission} variant="outline">
										{permission}
									</Badge>
								))}
							</div>
						) : null}
					</div>

					<div className="flex flex-wrap gap-2">
						<DialogTrigger asChild>
							<Button size="sm" variant="secondary">
								{t(
									getTranslationToken(
										"profile",
										profileLocaleKeys.profile_character_button,
									),
								)}
							</Button>
						</DialogTrigger>
						<ProfileHoyolabDialogs
							trigger={
								<Button size="sm" variant="outline">
									{t(
										getTranslationToken(
											"profile",
											profileLocaleKeys.profile_hoyolab_sync_button,
										),
									)}
								</Button>
							}
							isDialogOpen={isHoyoLabDialogOpen}
							onDialogOpenChange={setIsHoyoLabDialogOpen}
							isConfirmOpen={isSyncConfirmOpen}
							onConfirmOpenChange={setIsSyncConfirmOpen}
							isResultOpen={isSyncResultOpen}
							onResultOpenChange={setIsSyncResultOpen}
							syncResult={syncResult}
							isSyncPending={syncMutation.isPending}
							isSyncReady={isSyncReady}
							hoyoUid={hoyoUid}
							onHoyoUidChange={setHoyoUid}
							hoyoServer={hoyoServer}
							onHoyoServerChange={setHoyoServer}
							generalCookie={generalCookie}
							onGeneralCookieChange={setGeneralCookie}
							cookieTokenV2={cookieTokenV2}
							onCookieTokenV2Change={setCookieTokenV2}
							ltokenV2={ltokenV2}
							onLtokenV2Change={setLtokenV2}
							onOpenConfirm={() => setIsSyncConfirmOpen(true)}
							onConfirmSync={handleSyncConfirm}
						/>
					</div>
				</div>

				<div className="mt-8 grid gap-4 md:grid-cols-10">
					{(accountCharacters.length
						? accountCharacters
						: defaultCharacters
					).map((character, index) => {
						const accountCharacter = accountCharacterItems[index];

						return (
							<div
								className="flex flex-col gap-2 items-center"
								key={`${character.name}-${character.element}`}
							>
								<div
									className={`group relative ${accountCharacter ? "cursor-pointer" : ""}`}
									role={accountCharacter ? "button" : undefined}
									tabIndex={accountCharacter ? 0 : -1}
									onClick={
										accountCharacter
											? () => handleEditCharacterOpen(accountCharacter)
											: undefined
									}
									onKeyDown={
										accountCharacter
											? (event) => {
													if (event.key === "Enter" || event.key === " ") {
														event.preventDefault();
														handleEditCharacterOpen(accountCharacter);
													}
												}
											: undefined
									}
								>
									<CharacterContainer {...character} />
									{accountCharacter ? (
										<div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 z-20">
											<Button
												size="icon"
												variant="destructive"
												className="h-7 w-7"
												onClick={(event) => {
													event.stopPropagation();
													handleRemoveCharacterOpen(accountCharacter);
												}}
											>
												<Trash2 className="h-3.5 w-3.5" />
											</Button>
										</div>
									) : null}
								</div>
								<span className="text-sm text-muted-foreground">
									Cost: {accountCharacter.characterCost}
								</span>
							</div>
						);
					})}
					<DialogTrigger asChild>
						<div className="w-full border-dashed rounded-lg border-2 flex justify-center items-center hover:border-white/50 transition-colors bg-white/5 cursor-pointer">
							<Plus />
						</div>
					</DialogTrigger>
				</div>
				<ProfileAddCharacterDialogContent
					selectedCharacterId={selectedCharacterId}
					onSelectedCharacterIdChange={setSelectedCharacterId}
					characterLevel={characterLevel}
					onCharacterLevelChange={setCharacterLevel}
					constellation={constellation}
					onConstellationChange={setConstellation}
					onAddCharacter={handleAddCharacter}
					isPending={addCharacterMutation.isPending}
				/>
			</Dialog>
			<ProfileEditCharacterDialog
				open={isEditCharacterOpen}
				onOpenChange={handleEditCharacterOpenChange}
				characterLevel={editCharacterLevel}
				onCharacterLevelChange={setEditCharacterLevel}
				constellation={editConstellation}
				onConstellationChange={setEditConstellation}
				onSubmit={handleEditCharacter}
				isPending={updateCharacterMutation.isPending}
			/>
			<ProfileRemoveCharacterDialog
				open={isRemoveCharacterOpen}
				onOpenChange={handleRemoveCharacterOpenChange}
				characterName={selectedAccountCharacter?.characters?.name}
				onConfirm={handleRemoveCharacter}
				isPending={removeCharacterMutation.isPending}
			/>
		</>
	);
}
