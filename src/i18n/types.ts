import type { LocaleKeys } from "@/lib/constants";

export type LocaleKeyType = (typeof LocaleKeys)[keyof typeof LocaleKeys];
export type LocaleObject = {
	[key in LocaleKeyType]: string;
};
