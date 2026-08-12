import type { BanPickCharacter } from "@/components/match/ban-pick.types";

export type DraftSide = "blue" | "red";

export interface PendingPickState {
	side: DraftSide;
	character: BanPickCharacter;
}
