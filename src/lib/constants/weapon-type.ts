export const WeaponType = {
	SWORD: 0,
	CLAYMORE: 1,
	POLEARM: 2,
	BOW: 3,
	CATALYST: 4,
} as const;

export type WeaponTypeEnum = (typeof WeaponType)[keyof typeof WeaponType];

export const WeaponTypeDetail = {
	[WeaponType.SWORD]: {
		key: "sword",
		name: "Sword",
		iconUrl:
			"https://res.cloudinary.com/dphtvhtvf/image/upload/v1768877471/sword_ailb09.png",
	},
	[WeaponType.CLAYMORE]: {
		key: "claymore",
		name: "Claymore",
		iconUrl:
			"https://res.cloudinary.com/dphtvhtvf/image/upload/v1768877470/polearm_dp2swy.png",
	},
	[WeaponType.POLEARM]: {
		key: "polearm",
		name: "Polearm",
		iconUrl:
			"https://res.cloudinary.com/dphtvhtvf/image/upload/v1768877470/polearm_dp2swy.png",
	},
	[WeaponType.BOW]: {
		key: "bow",
		name: "Bow",
		iconUrl:
			"https://res.cloudinary.com/dphtvhtvf/image/upload/v1768877467/bow_jnrdun.png",
	},
	[WeaponType.CATALYST]: {
		key: "catalyst",
		name: "Catalyst",
		iconUrl:
			"https://res.cloudinary.com/dphtvhtvf/image/upload/v1768877468/catalyst_rbold1.png",
	},
};
