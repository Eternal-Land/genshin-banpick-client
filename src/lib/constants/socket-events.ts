export const SocketEvent = {
	ERROR: "error",
	NOTIFICATION: "notification",
	JOIN_MATCH_ROOM: "join_match_room",
	LEAVE_MATCH_ROOM: "leave_match_room",
	MATCH_DELETED: "match_deleted",
	UPDATE_MATCH_STATE: "update_match_state",
	UPDATE_MATCH_SESSION: "update_match_session",
	UPDATE_MATCH_TIMER_INPUTS: "update_match_timer_inputs",
	SAVE_MATCH_TIMER_INPUTS: "save_match_timer_inputs",
	UPDATE_CHAMBER_CLEAR_TIME: "update_chamber_clear_time",
	UPDATE_BAN_PICK_SLOT: "update_ban_pick_slot",
	UPDATE_PICK_SLOT: "update_pick_slot",
	UPDATE_TEAM_COST: "update_team_cost",
	SWAP_BAN_PICK_SLOT_POSITION: "swap_ban_pick_slot_position",
	MATCH_STARTED: "match_started",
	MATCH_UPDATED: "match_updated",
} as const;

export type SocketEventEnum = (typeof SocketEvent)[keyof typeof SocketEvent];
