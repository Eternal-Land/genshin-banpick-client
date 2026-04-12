import type {
	MatchStatusEnum,
	MatchTypeEnum,
	PlayerSideEnum,
} from "@/lib/constants";
import type { SessionCostResponse } from "@/apis/session-cost/types";
import type { ProfileResponse } from "@/apis/self/types";

export interface SaveSessionRecordInput {
	blueChamber1: number;
	blueChamber2: number;
	blueChamber3: number;
	blueResetTimes: number;
	blueFinalTime: number;
	redChamber1: number;
	redChamber2: number;
	redChamber3: number;
	redResetTimes: number;
	redFinalTime: number;
}

export interface SessionRecordResponse extends SaveSessionRecordInput {
	id: number;
	matchSessionId: number;
}

export interface MatchSessionReportItemResponse {
	matchSessionId: number;
	sessionIndex: number;
	sessionStatus: number;
	currentTurn: PlayerSideEnum;
	totalCostBlue: number;
	totalCostRed: number;
	blueParticipant: ProfileResponse | null;
	redParticipant: ProfileResponse | null;
	winnerSide: PlayerSideEnum | null;
	blueFinalTime: number | null;
	redFinalTime: number | null;
	blueResultTotal: number | null;
	redResultTotal: number | null;
	resultDifference: number | null;
	record: SessionRecordResponse | null;
	cost: SessionCostResponse | null;
}

export interface MatchReportDetailResponse {
	matchId: string;
	status: MatchStatusEnum;
	type: MatchTypeEnum;
	sessionCount: number;
	host: ProfileResponse | null;
	redPlayer: ProfileResponse | null;
	bluePlayer: ProfileResponse | null;
	sessions: MatchSessionReportItemResponse[];
}
