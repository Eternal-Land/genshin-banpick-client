import { matchApi } from "@/apis/match";
import type { MatchStateResponse } from "@/apis/match/types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAppSelector } from "@/hooks/use-app-selector";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { matchLocaleKeys } from "@/i18n/keys";
import { getTranslationToken } from "@/i18n/namespaces";
import {
	MatchStatus,
	MatchType,
	SocketEvent,
	type MatchTypeEnum,
} from "@/lib/constants";
import { IconAssets } from "@/lib/constants/icon-assets";
import { selectAuthProfile } from "@/lib/redux/auth.slice";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { Copy, Swords } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_userLayout/room/$roomId/waiting")({
	component: RouteComponent,
});

interface CopyLinkButtonProps {
	link: string;
	label: string;
	onCopySuccess: string;
	onCopyError: string;
}

function CopyLinkButton({
	link,
	label,
	onCopySuccess,
	onCopyError,
}: CopyLinkButtonProps) {
	return (
		<Button
			variant="secondary"
			className="h-9 px-4 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all duration-300 hover:scale-105"
			onClick={async () => {
				try {
					await navigator.clipboard.writeText(link);
					toast.success(onCopySuccess);
				} catch {
					toast.error(onCopyError);
				}
			}}
		>
			<Copy className="size-4 mr-2" />
			<span className="text-sm font-medium">{label}</span>
		</Button>
	);
}

function RouteComponent() {
	const { t } = useTranslation();
	const navigate = Route.useNavigate();
	const { roomId } = Route.useParams();
	const tMatch = (key: string, options?: Record<string, string | number>) =>
		t(getTranslationToken("match", key), options);
	const { match, matchState } = useLoaderData({
		from: "/_userLayout/room/$roomId",
	});
	const profile = useAppSelector(selectAuthProfile);

	const [pageMatchState, setPageMatchState] = useState<
		MatchStateResponse | undefined
	>(matchState);

	const bluePlayer = match?.bluePlayer;
	const redPlayer = match?.redPlayer;
	const isHostJoined = Boolean(pageMatchState?.hostJoined);
	const isBlueJoined = Boolean(bluePlayer && pageMatchState?.bluePlayerJoined);
	const isRedJoined = Boolean(redPlayer && pageMatchState?.redPlayerJoined);
	const connectedPlayerCount = Number(isBlueJoined) + Number(isRedJoined);
	const waitingPlayers = Math.max(0, 2 - connectedPlayerCount);
	const isHost = match?.host?.id == profile?.id;

	const startMatchMutation = useMutation({
		mutationFn: matchApi.startMatch,
		onError: () => {
			toast.error(tMatch(matchLocaleKeys.match_waiting_start_error));
		},
	});

	useSocketEvent(
		SocketEvent.UPDATE_MATCH_STATE,
		(nextMatchState: MatchStateResponse) => {
			setPageMatchState(nextMatchState);
		},
	);

	const findMatchPath = (matchType: MatchTypeEnum): string | null => {
		switch (matchType) {
			case MatchType.REALTIME:
			case MatchType.TURN_BASED:
				return "/room/$roomId/ban-pick";
			case MatchType.THREE_VS_THREE:
				return "/room/$roomId/3vs3";
			default:
				toast.error(tMatch(matchLocaleKeys.match_waiting_start_error));
				return null;
		}
	};

	useSocketEvent(SocketEvent.MATCH_STARTED, () => {
		const matchPath = findMatchPath(match?.type as MatchTypeEnum);
		if (matchPath) {
			navigate({
				to: matchPath,
				params: {
					roomId: roomId,
				},
			});
		}
	});

	useSocketEvent(SocketEvent.UPDATE_MATCH_SESSION, () => {
		void (async () => {
			const matchPath = findMatchPath(match?.type as MatchTypeEnum);
			if (!matchPath) {
				return;
			}

			try {
				const response = await matchApi.getMatch(roomId);
				if (response.data?.status === MatchStatus.LIVE) {
					navigate({
						to: matchPath,
						params: {
							roomId,
						},
					});
				}
			} catch {
				// Session update navigation is best-effort.
			}
		})();
	});

	useEffect(() => {
		setPageMatchState(matchState);
	}, [matchState]);

	useEffect(() => {
		if (!match) {
			navigate({
				to: "/match",
				search: {
					page: 1,
					take: 10,
					accountId: profile?.id,
				},
			});
			return;
		}

		const matchPath = findMatchPath(match.type as MatchTypeEnum);
		if (!matchPath) {
			navigate({
				to: "/match",
				search: {
					page: 1,
					take: 10,
					accountId: profile?.id,
				},
			});
			return;
		}

		switch (match.status) {
			case MatchStatus.WAITING:
				return;
			case MatchStatus.COMPLETED:
				navigate({
					to: "/room/$roomId/result",
					params: {
						roomId,
					},
				});
				return;
			case MatchStatus.LIVE:
				navigate({
					to: matchPath,
					params: {
						roomId,
					},
				});
				return;
			default:
				navigate({
					to: "/match",
					search: {
						page: 1,
						take: 10,
						accountId: profile?.id,
					},
				});
		}
	}, [match, navigate, profile?.id, roomId]);

	if (!match) {
		return (
			<div className="min-h-screen w-full flex items-center justify-center text-xl text-red-500 font-medium bg-black/50 backdrop-blur-md">
				{tMatch(matchLocaleKeys.match_waiting_load_error)}
			</div>
		);
	}

	return (
		<div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-950/20">
			{/* Main Glass Panel */}
			<div className="relative w-full max-w-6xl rounded-3xl overflow-hidden bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
				{/* Top Glow Highlights */}
				<div className="absolute top-0 left-0 w-1/3 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
				<div className="absolute top-0 right-0 w-1/3 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-50"></div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 md:p-12 min-h-[600px] items-center relative z-10">
					{/* Left: Blue Player */}
					<div className="flex flex-col items-center justify-center gap-6 group">
						<div className="text-center space-y-2">
							<h2 className="text-3xl lg:text-4xl font-black text-cyan-400 uppercase tracking-wider drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
								{tMatch(matchLocaleKeys.match_waiting_blue_player)}
							</h2>
							<div className="flex items-center justify-center gap-2">
								<span className="text-sm font-medium text-white/50 uppercase tracking-widest">
									{tMatch(matchLocaleKeys.match_waiting_status_label)}
								</span>
								<div
									className={cn(
										"h-3 w-3 rounded-full shadow-[0_0_10px_currentColor] transition-colors duration-500",
										isBlueJoined
											? "bg-cyan-400 text-cyan-400"
											: "bg-amber-400 text-amber-400 animate-pulse",
									)}
								/>
							</div>
						</div>

						<div className="relative">
							{/* Glowing backdrop circle */}
							<div
								className={cn(
									"absolute inset-0 rounded-full blur-2xl opacity-40 transition-all duration-700",
									isBlueJoined
										? "bg-cyan-500 scale-110"
										: "bg-cyan-900/50 scale-100",
								)}
							></div>

							<div
								className={cn(
									"relative w-40 h-40 rounded-full flex items-center justify-center overflow-hidden border-4 transition-all duration-500",
									isBlueJoined
										? "border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.4)]"
										: "border-cyan-400/30 border-dashed",
								)}
							>
								<img
									src={bluePlayer?.avatar || IconAssets.EMPTY_CHARACTER_ICON}
									alt={tMatch(matchLocaleKeys.match_waiting_blue_avatar_alt)}
									className={cn(
										"w-full h-full object-cover transition-transform duration-700",
										isBlueJoined
											? "group-hover:scale-110"
											: "opacity-50 grayscale",
									)}
								/>
							</div>
						</div>

						<div className="text-center bg-black/30 px-6 py-4 rounded-2xl border border-white/5 backdrop-blur-sm min-w-[200px]">
							<h3
								className={cn(
									"text-2xl font-bold truncate",
									isBlueJoined ? "text-white" : "text-white/40 italic",
								)}
							>
								{isBlueJoined
									? bluePlayer?.displayName
									: tMatch(matchLocaleKeys.match_waiting_connecting)}
							</h3>
							<p className="text-cyan-200/60 font-mono mt-1 text-sm">
								{tMatch(matchLocaleKeys.match_waiting_uid_label)}:{" "}
								{bluePlayer?.ingameUuid || "--------"}
							</p>
						</div>
					</div>

					{/* Center: Match Details & Actions */}
					<div className="flex flex-col items-center justify-center gap-8 py-8 relative">
						{/* Vertical divider lines (visible on desktop) */}
						<div className="hidden md:block absolute left-0 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
						<div className="hidden md:block absolute right-0 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

						{/* VS Badge */}
						<div className="relative flex items-center justify-center">
							<div className="absolute inset-0 bg-white/5 blur-xl rounded-full scale-150"></div>
							<div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center shadow-2xl z-10">
								<Swords className="w-10 h-10 text-white/80" strokeWidth={1.5} />
							</div>
						</div>

						{/* Match Info */}
						<div className="text-center space-y-3">
							<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
								<span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
									{tMatch(matchLocaleKeys.match_waiting_format_label)}
								</span>
								<span className="text-sm font-bold text-white">
									BO{match.sessionCount}
								</span>
							</div>

							<div className="flex items-center justify-center gap-3 bg-black/40 px-5 py-2 rounded-full border border-white/5">
								<img
									src={match.host?.avatar || IconAssets.EMPTY_CHARACTER_ICON}
									alt={tMatch(matchLocaleKeys.match_waiting_host_avatar_alt)}
									className="w-6 h-6 rounded-full object-cover border border-white/20"
								/>
								<span className="text-sm text-white/70">
									{tMatch(matchLocaleKeys.match_waiting_host_label, {
										hostName:
											match.host?.displayName ||
											tMatch(matchLocaleKeys.match_waiting_unknown_host),
									})}
								</span>
								<div
									className={cn(
										"h-2 w-2 rounded-full",
										isHostJoined
											? "bg-emerald-400 shadow-[0_0_8px_currentColor]"
											: "bg-amber-500 animate-pulse",
									)}
								/>
							</div>
						</div>

						{/* Status / Call to Action */}
						<div className="w-full flex flex-col items-center gap-6 mt-4">
							{waitingPlayers > 0 ? (
								<div className="flex flex-col items-center gap-4">
									<div className="flex items-center gap-3 text-lg font-medium text-white/60 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
										<Spinner className="w-5 h-5 text-white/40" />
										<span>
											{tMatch(matchLocaleKeys.match_waiting_for_players, {
												count: waitingPlayers,
												suffix: waitingPlayers > 1 ? "s" : "",
											})}
										</span>
									</div>
									<CopyLinkButton
										link={window.location.href}
										label={tMatch(
											matchLocaleKeys.match_waiting_copy_invite_link,
										)}
										onCopySuccess={tMatch(
											matchLocaleKeys.match_waiting_copy_success,
										)}
										onCopyError={tMatch(
											matchLocaleKeys.match_waiting_copy_error,
										)}
									/>
								</div>
							) : (
								<div className="flex flex-col items-center gap-4 w-full px-4">
									<div className="text-emerald-400 font-medium text-lg animate-pulse">
										{tMatch(
											matchLocaleKeys.match_waiting_all_players_connected,
										)}
									</div>
									{isHost ? (
										<Button
											className="w-full h-14 text-lg font-bold uppercase tracking-widest rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all duration-300 hover:-translate-y-1"
											onClick={() => startMatchMutation.mutate(match.id)}
											disabled={startMatchMutation.isPending}
										>
											{startMatchMutation.isPending ? (
												<Spinner className="w-6 h-6" />
											) : (
												tMatch(matchLocaleKeys.match_waiting_start_game)
											)}
										</Button>
									) : (
										<div className="text-white/50 text-sm">
											{tMatch(matchLocaleKeys.match_waiting_for_host_start)}
										</div>
									)}
								</div>
							)}
						</div>
					</div>

					{/* Right: Red Player */}
					<div className="flex flex-col items-center justify-center gap-6 group">
						<div className="text-center space-y-2">
							<h2 className="text-3xl lg:text-4xl font-black text-rose-500 uppercase tracking-wider drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]">
								{tMatch(matchLocaleKeys.match_waiting_red_player)}
							</h2>
							<div className="flex items-center justify-center gap-2">
								<div
									className={cn(
										"h-3 w-3 rounded-full shadow-[0_0_10px_currentColor] transition-colors duration-500",
										isRedJoined
											? "bg-rose-500 text-rose-500"
											: "bg-amber-400 text-amber-400 animate-pulse",
									)}
								/>
								<span className="text-sm font-medium text-white/50 uppercase tracking-widest">
									{tMatch(matchLocaleKeys.match_waiting_status_label)}
								</span>
							</div>
						</div>

						<div className="relative">
							{/* Glowing backdrop circle */}
							<div
								className={cn(
									"absolute inset-0 rounded-full blur-2xl opacity-40 transition-all duration-700",
									isRedJoined
										? "bg-rose-600 scale-110"
										: "bg-rose-900/50 scale-100",
								)}
							></div>

							<div
								className={cn(
									"relative w-40 h-40 rounded-full flex items-center justify-center overflow-hidden border-4 transition-all duration-500",
									isRedJoined
										? "border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.4)]"
										: "border-rose-500/30 border-dashed",
								)}
							>
								<img
									src={redPlayer?.avatar || IconAssets.EMPTY_CHARACTER_ICON}
									alt={tMatch(matchLocaleKeys.match_waiting_red_avatar_alt)}
									className={cn(
										"w-full h-full object-cover transition-transform duration-700",
										isRedJoined
											? "group-hover:scale-110"
											: "opacity-50 grayscale",
									)}
								/>
							</div>
						</div>

						<div className="text-center bg-black/30 px-6 py-4 rounded-2xl border border-white/5 backdrop-blur-sm min-w-[200px]">
							<h3
								className={cn(
									"text-2xl font-bold truncate",
									isRedJoined ? "text-white" : "text-white/40 italic",
								)}
							>
								{isRedJoined
									? redPlayer?.displayName
									: tMatch(matchLocaleKeys.match_waiting_connecting)}
							</h3>
							<p className="text-rose-200/60 font-mono mt-1 text-sm">
								{tMatch(matchLocaleKeys.match_waiting_uid_label)}:{" "}
								{redPlayer?.ingameUuid || "--------"}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
