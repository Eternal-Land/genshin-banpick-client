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
			"https://res.cloudinary.com/dphtvhtvf/image/upload/v1770348794/Element_Anemo_woedvc.png",
		color: "teal-400",
		backgroundColor: "teal-950/75",
	},
	[CharacterElement.GEO]: {
		key: "geo",
		name: "Geo",
		iconUrl:
			"https://res.cloudinary.com/dphtvhtvf/image/upload/v1770348802/Element_Geo_qwgdzr.png",
		color: "amber-300",
		backgroundColor: "amber-950/70",
	},
	[CharacterElement.ELECTRO]: {
		key: "electro",
		name: "Electro",
		iconUrl:
			"https://res.cloudinary.com/dphtvhtvf/image/upload/v1770348827/Element_Electro_tr1eji.png",
		color: "purple-700",
		backgroundColor: "purple-950/75",
	},
	[CharacterElement.DENDRO]: {
		key: "dendro",
		name: "Dendro",
		iconUrl:
			"https://res.cloudinary.com/dphtvhtvf/image/upload/v1770348857/Element_Dendro_afwdv7.png",
		color: "lime-500",
		backgroundColor: "lime-950/70",
	},
	[CharacterElement.HYDRO]: {
		key: "hydro",
		name: "Hydro",
		iconUrl:
			"https://res.cloudinary.com/dphtvhtvf/image/upload/v1770347050/Element_Hydro_gz9ndb.png",
		color: "sky-400",
		backgroundColor: "sky-950/70",
	},
	[CharacterElement.PYRO]: {
		key: "pyro",
		name: "Pyro",
		iconUrl:
			"https://res.cloudinary.com/dphtvhtvf/image/upload/v1770347137/Element_Pyro_fwixpx.png",
		color: "red-500",
		backgroundColor: "red-950/70",
	},
	[CharacterElement.CRYO]: {
		key: "cryo",
		name: "Cryo",
		iconUrl:
			"https://res.cloudinary.com/dphtvhtvf/image/upload/v1770348862/Element_Cryo_phlpxk.png",
		color: "cyan-300",
		backgroundColor: "cyan-950/70",
	},
};
