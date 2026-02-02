export const WeaponType = {
    SWORD: 0,
    CLAYMORE: 1,
    POLEARM: 2,
    BOW: 3,
    CATALYST: 4
} as const;

export type WeaponTypeEnum = typeof WeaponType[keyof typeof WeaponType];