export const WeaponRarity = {
	WEAPON_NORMAL: 0,
	WEAPON_S: 1,
	WEAPON_SS: 2,
} as const;

export type WeaponRarityEnum = (typeof WeaponRarity)[keyof typeof WeaponRarity];
