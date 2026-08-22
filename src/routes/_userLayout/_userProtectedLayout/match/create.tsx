import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { AxiosError } from "axios";
import { matchApi } from "@/apis/match";
import { usersApi } from "@/apis/users";
import type { ProfileResponse } from "@/apis/self/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { matchLocaleKeys } from "@/i18n/keys";
import { getTranslationToken } from "@/i18n/namespaces";
import { useTranslation } from "react-i18next";
import type { BaseApiResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MatchType, type MatchTypeEnum } from "@/lib/constants";

export const Route = createFileRoute(
	"/_userLayout/_userProtectedLayout/match/create",
)({
	component: RouteComponent,
});

function RouteComponent() {
	const MIN_PLAYER_SEARCH_LENGTH = 4;
	const { t } = useTranslation();
	const navigate = Route.useNavigate();
	const tMatch = (key: string) => t(getTranslationToken("match", key));
	const [playerSearchA, setPlayerSearchA] = useState("");
	const [playerSearchB, setPlayerSearchB] = useState("");
	const [playerQueryA, setPlayerQueryA] = useState("");
	const [playerQueryB, setPlayerQueryB] = useState("");
	const [playerA, setPlayerA] = useState<string | undefined>(undefined);
	const [playerB, setPlayerB] = useState<string | undefined>(undefined);
	const [playerOpenA, setPlayerOpenA] = useState(false);
	const [playerOpenB, setPlayerOpenB] = useState(false);
	const [selectedPlayerA, setSelectedPlayerA] =
		useState<ProfileResponse | null>(null);
	const [selectedPlayerB, setSelectedPlayerB] =
		useState<ProfileResponse | null>(null);
	const [sessionCount, setSessionCount] = useState<number | undefined>(
		undefined,
	);
	const [matchType, setMatchType] = useState<MatchTypeEnum | undefined>(
		undefined,
	);

	const triggerSearchA = useDebounce((value: string) => {
		setPlayerQueryA(value.trim());
	}, 400);
	const triggerSearchB = useDebounce((value: string) => {
		setPlayerQueryB(value.trim());
	}, 400);

	const handleSearchA = (value: string) => {
		setPlayerSearchA(value);
		if (value.trim().length < MIN_PLAYER_SEARCH_LENGTH) {
			setPlayerQueryA("");
			return;
		}
		triggerSearchA(value);
	};

	const handleSearchB = (value: string) => {
		setPlayerSearchB(value);
		if (value.trim().length < MIN_PLAYER_SEARCH_LENGTH) {
			setPlayerQueryB("");
			return;
		}
		triggerSearchB(value);
	};

	const playersQueryA = useQuery({
		queryKey: ["match-players", "side-a", playerQueryA],
		queryFn: () =>
			usersApi.searchUsers({
				page: 1,
				take: 10,
				search: playerQueryA,
			}),
		enabled: playerQueryA.length >= MIN_PLAYER_SEARCH_LENGTH,
	});

	const playersQueryB = useQuery({
		queryKey: ["match-players", "side-b", playerQueryB],
		queryFn: () =>
			usersApi.searchUsers({
				page: 1,
				take: 10,
				search: playerQueryB,
			}),
		enabled: playerQueryB.length >= MIN_PLAYER_SEARCH_LENGTH,
	});

	const playersA = playersQueryA.data?.data ?? [];
	const playersB = playersQueryB.data?.data ?? [];
	const filteredPlayersA = playerB
		? playersA.filter((player) => player.id !== playerB)
		: playersA;
	const filteredPlayersB = playerA
		? playersB.filter((player) => player.id !== playerA)
		: playersB;

	const formatPlayerLabel = (player: ProfileResponse) => {
		if (player.ingameUuid) {
			return `${player.displayName} (${player.ingameUuid})`;
		}
		return player.displayName;
	};

	const getInitials = (name: string) =>
		name
			.split(" ")
			.filter(Boolean)
			.map((part) => part[0]?.toUpperCase())
			.slice(0, 2)
			.join("") || "?";

	const renderPlayerItems = (
		players: ProfileResponse[],
		query: string,
		isLoading: boolean,
		isError: boolean,
		selectedId: string | undefined,
		onSelect: (player: ProfileResponse) => void,
	) => {
		if (!query) {
			return (
				<CommandEmpty>
					{tMatch(matchLocaleKeys.match_player_search_hint)}
				</CommandEmpty>
			);
		}

		if (isLoading) {
			return (
				<CommandEmpty>
					{tMatch(matchLocaleKeys.match_player_search_loading)}
				</CommandEmpty>
			);
		}

		if (isError) {
			return (
				<CommandEmpty>
					{tMatch(matchLocaleKeys.match_player_search_error)}
				</CommandEmpty>
			);
		}

		if (players.length === 0) {
			return (
				<CommandEmpty>
					{tMatch(matchLocaleKeys.match_player_search_empty)}
				</CommandEmpty>
			);
		}

		return (
			<CommandGroup>
				{players.map((player) => (
					<CommandItem
						key={player.id}
						value={player.id}
						onSelect={() => onSelect(player)}
					>
						{formatPlayerLabel(player)}
						<CheckIcon
							className={cn(
								"ml-auto",
								player.id === selectedId ? "opacity-100" : "opacity-0",
							)}
						/>
					</CommandItem>
				))}
			</CommandGroup>
		);
	};

	const renderSelectedCard = (player: ProfileResponse | null) =>
		player ? (
			<div className="flex items-center gap-3 rounded-md border bg-card px-3 py-2">
				<Avatar className="size-9">
					<AvatarImage src={player.avatar} alt={player.displayName} />
					<AvatarFallback>{getInitials(player.displayName)}</AvatarFallback>
				</Avatar>
				<div className="flex flex-col">
					<span className="text-sm font-medium">{player.displayName}</span>
					<span className="text-xs text-muted-foreground">
						{tMatch(matchLocaleKeys.match_player_uid_label)}:{" "}
						{player.ingameUuid || "-"}
					</span>
				</div>
			</div>
		) : null;

	const renderSideSection = (config: {
		titleKey: string;
		titleClassName: string;
		placeholderKey: string;
		open: boolean;
		setOpen: (value: boolean) => void;
		search: string;
		onSearch: (value: string) => void;
		query: string;
		players: ProfileResponse[];
		isFetching: boolean;
		isError: boolean;
		selectedId: string | undefined;
		selectedPlayer: ProfileResponse | null;
		onSelect: (player: ProfileResponse) => void;
	}) => (
		<div className="flex w-full flex-col gap-3">
			<h2
				className={cn(
					"text-center font-semibold text-2xl",
					config.titleClassName,
				)}
			>
				{tMatch(config.titleKey)}
			</h2>
			<Popover open={config.open} onOpenChange={config.setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={config.open}
						className="w-full justify-between"
					>
						{config.selectedPlayer
							? formatPlayerLabel(config.selectedPlayer)
							: tMatch(config.placeholderKey)}
						<ChevronsUpDownIcon className="opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-(--radix-popper-anchor-width) p-0">
					<Command shouldFilter={false}>
						<CommandInput
							placeholder={tMatch(
								matchLocaleKeys.match_player_search_placeholder,
							)}
							value={config.search}
							onValueChange={config.onSearch}
						/>
						<CommandList>
							{renderPlayerItems(
								config.players,
								config.query,
								config.isFetching,
								config.isError,
								config.selectedId,
								config.onSelect,
							)}
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			{renderSelectedCard(config.selectedPlayer)}
		</div>
	);

	const matchTypeOptions = [
		{
			value: String(MatchType.TURN_BASED),
			label: tMatch(matchLocaleKeys.match_type_turn_based),
		},
		{
			value: String(MatchType.REALTIME),
			label: tMatch(matchLocaleKeys.match_type_real_time),
		},
		{
			value: String(MatchType.THREE_VS_THREE),
			label: tMatch(matchLocaleKeys.match_type_three_vs_three),
		}
	];

	const sessionOptions = [
		{
			value: 1,
			label: tMatch(matchLocaleKeys.match_session_bo1),
		},
		{
			value: 3,
			label: tMatch(matchLocaleKeys.match_session_bo3),
		},
		{
			value: 5,
			label: tMatch(matchLocaleKeys.match_session_bo5),
		},
	];

	const isThreeVsThreeMatch = matchType === MatchType.THREE_VS_THREE;

	useEffect(() => {
		if (!isThreeVsThreeMatch) {
			return;
		}

		if (sessionCount !== 1) {
			setSessionCount(1);
		}
	}, [isThreeVsThreeMatch, sessionCount]);

	const createMatchMutation = useMutation({
		mutationFn: () => {
			const left = selectedPlayerA;
			const right = selectedPlayerB;

			if (!left || !right || !sessionCount || matchType === undefined) {
				throw new Error("Missing create match payload");
			}

			return matchApi.createMatch({
				sessionCount,
				type: matchType,
				bluePlayerId: left.id,
				redPlayerId: right.id,
			});
		},
		onSuccess: (response) => {
			toast.success("Match created successfully");
			navigate({
				to: "/room/$roomId/waiting",
				params: {
					roomId: response.data?.id || "",
				},
			});
		},
		onError: (error: AxiosError<BaseApiResponse> | Error) => {
			if (error instanceof AxiosError) {
				toast.error(error.response?.data?.message ?? "Failed to create match");
				return;
			}

			toast.error(error.message || "Failed to create match");
		},
	});

	const canCreate =
		!!selectedPlayerA &&
		!!selectedPlayerB &&
		!!sessionCount &&
		matchType !== undefined &&
		!createMatchMutation.isPending;

	return (
		<div className="flex flex-col items-center justify-center gap-12">
			<h1 className="text-2xl font-bold text-center">
				{tMatch(matchLocaleKeys.match_create_title)}
			</h1>
			<div className="flex gap-6">
				<Select
					value={matchType !== undefined ? String(matchType) : undefined}
					onValueChange={(value) =>
						setMatchType(Number(value) as MatchTypeEnum)
					}
				>
					<SelectTrigger className="w-full max-w-[25vw] min-w-[10vw]">
						<SelectValue
							placeholder={tMatch(matchLocaleKeys.match_type_placeholder)}
						/>
					</SelectTrigger>
					<SelectContent>
						{matchTypeOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					value={sessionCount ? String(sessionCount) : undefined}
					onValueChange={(value) => {
						const nextSessionCount = Number(value);
						if (isThreeVsThreeMatch && nextSessionCount !== 1) {
							return;
						}

						setSessionCount(nextSessionCount);
					}}
				>
					<SelectTrigger className="w-full max-w-[25vw] min-w-[10vw]">
						<SelectValue
							placeholder={tMatch(matchLocaleKeys.match_sessions_placeholder)}
						/>
					</SelectTrigger>
					<SelectContent>
						{sessionOptions.map((option) => {
							const isDisabled =
								isThreeVsThreeMatch && option.value !== 1;

							return (
								<SelectItem
									key={option.value}
									value={String(option.value)}
									disabled={isDisabled}
								>
								{option.label}
								</SelectItem>
							);
						})}
					</SelectContent>
				</Select>
			</div>

			<div className="flex w-full max-w-[60vw] flex-col gap-6 sm:flex-row py-20">
				{renderSideSection({
					titleKey: matchLocaleKeys.match_side_a_title,
					titleClassName: "text-sky-400",
					placeholderKey: matchLocaleKeys.match_side_a_placeholder,
					open: playerOpenA,
					setOpen: setPlayerOpenA,
					search: playerSearchA,
					onSearch: handleSearchA,
					query: playerQueryA,
					players: filteredPlayersA,
					isFetching: playersQueryA.isFetching,
					isError: playersQueryA.isError,
					selectedId: playerA,
					selectedPlayer: selectedPlayerA,
					onSelect: (player) => {
						setPlayerA(player.id);
						setSelectedPlayerA(player);
						setPlayerOpenA(false);
					},
				})}
				<div className="hidden sm:block w-px self-stretch bg-border mx-30" />
				{renderSideSection({
					titleKey: matchLocaleKeys.match_side_b_title,
					titleClassName: "text-red-600",
					placeholderKey: matchLocaleKeys.match_side_b_placeholder,
					open: playerOpenB,
					setOpen: setPlayerOpenB,
					search: playerSearchB,
					onSearch: handleSearchB,
					query: playerQueryB,
					players: filteredPlayersB,
					isFetching: playersQueryB.isFetching,
					isError: playersQueryB.isError,
					selectedId: playerB,
					selectedPlayer: selectedPlayerB,
					onSelect: (player) => {
						setPlayerB(player.id);
						setSelectedPlayerB(player);
						setPlayerOpenB(false);
					},
				})}
			</div>

			<Button
				type="button"
				className="w-full max-w-[10vw]"
				onClick={() => createMatchMutation.mutate()}
				disabled={!canCreate}
			>
				{tMatch(matchLocaleKeys.match_create_button)}
			</Button>
		</div>
	);
}
