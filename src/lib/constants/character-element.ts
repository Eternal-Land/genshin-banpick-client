export const CharacterElement = {
	ANEMO: 0,
	GEO: 1,
	ELECTRO: 2,
	DENDRO: 3,
	HYDRO: 4,
	PYRO: 5,
	CRYO: 6,
} as const;

export type CharacterElementEnum =
	(typeof CharacterElement)[keyof typeof CharacterElement];

export const CharacterElementDetail = {
	[CharacterElement.ANEMO]: {
		key: "anemo",
		name: "Anemo",
		iconUrl:
			"https://res.cloudinary.com/dphtvhtvf/image/upload/v1768877397/anemo_cufvih.svg",
		color: "teal-400",
		backgroundColor: "teal-950/75",
	},
	[CharacterElement.GEO]: {
		key: "geo",
		name: "Geo",
		iconUrl:
			"https://res.cloudinary.com/dphtvhtvf/image/upload/v1768877399/geo_bn3np1.svg",
		color: "amber-300",
		backgroundColor: "amber-950/70",
	},
	[CharacterElement.ELECTRO]: {
		key: "electro",
		name: "Electro",
		iconUrl:
			"https://res.cloudinary.com/dphtvhtvf/image/upload/v1768877398/electro_z0vkqq.svg",
		color: "purple-700",
		backgroundColor: "purple-950/75",
	},
	[CharacterElement.DENDRO]: {
		key: "dendro",
		name: "Dendro",
		iconUrl:
			"https://res.cloudinary.com/dphtvhtvf/image/upload/v1768877398/dendro_rdfqyi.svg",
		color: "lime-500",
		backgroundColor: "lime-950/70",
	},
	[CharacterElement.HYDRO]: {
		key: "hydro",
		name: "Hydro",
		iconUrl:
			"https://res.cloudinary.com/dphtvhtvf/image/upload/v1768877399/hydro_rgk3aq.svg",
		color: "sky-400",
		backgroundColor: "sky-950/70",
	},
	[CharacterElement.PYRO]: {
		key: "pyro",
		name: "Pyro",
		iconUrl:
			"https://res.cloudinary.com/dphtvhtvf/image/upload/v1768877400/pyro_swlrdc.svg",
		color: "red-500",
		backgroundColor: "red-950/70",
	},
	[CharacterElement.CRYO]: {
		key: "cryo",
		name: "Cryo",
		iconUrl:
			"https://res.cloudinary.com/dphtvhtvf/image/upload/v1768877397/cryo_zhakhc.svg",
		color: "cyan-300",
		backgroundColor: "cyan-950/70",
	},
};
