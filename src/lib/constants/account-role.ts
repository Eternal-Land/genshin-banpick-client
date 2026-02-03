export const AccountRole = {
	USER: 0,
	STAFF: 1,
	ADMIN: 2,
} as const;

export type AccountRoleEnum = (typeof AccountRole)[keyof typeof AccountRole];
