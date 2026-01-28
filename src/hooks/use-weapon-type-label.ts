import { LocaleKeys, WeaponType } from "@/lib/constants";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export function useWeaponTypeLabel() {
    const { t } = useTranslation();

    return useMemo(() => ({
        [WeaponType.SWORD]: t(LocaleKeys.characters_weapon_sword),
        [WeaponType.BOW]: t(LocaleKeys.characters_weapon_bow),
        [WeaponType.POLEARM]: t(LocaleKeys.characters_weapon_polearm),
        [WeaponType.CATALYST]: t(LocaleKeys.characters_weapon_catalyst),
        [WeaponType.CLAYMORE]: t(LocaleKeys.characters_weapon_claymore),
    }), [t]);
}

export function useWeaponTypeOptions() {
    const weaponTypeLabels = useWeaponTypeLabel();
    return useMemo(() => Object.entries(weaponTypeLabels).map(([value, label]) => ({
        value,
        label,
    })), [weaponTypeLabels]);
}