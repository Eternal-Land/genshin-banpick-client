import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CharacterElement, LocaleKeys } from "@/lib/constants";

export function useElementLabel() {
    const { t } = useTranslation();

    return useMemo(() => ({
        [CharacterElement.PYRO]: t(LocaleKeys.characters_element_pyro),
        [CharacterElement.HYDRO]: t(LocaleKeys.characters_element_hydro),
        [CharacterElement.ANEMO]: t(LocaleKeys.characters_element_anemo),
        [CharacterElement.ELECTRO]: t(LocaleKeys.characters_element_electro),
        [CharacterElement.DENDRO]: t(LocaleKeys.characters_element_dendro),
        [CharacterElement.CRYO]: t(LocaleKeys.characters_element_cryo),
        [CharacterElement.GEO]: t(LocaleKeys.characters_element_geo),
    }), [t]);
}

export function useElementOptions() {
    const elementLabels = useElementLabel();

    return useMemo(() => Object.entries(elementLabels).map(([value, label]) => ({
        value,
        label,
    })), [elementLabels]);
}