import { LocaleKeys } from "@/lib/constants";
import type { CharacterElementEnum } from "@/lib/constants/character-element";
import { CharacterElementDetail } from "@/lib/constants/character-element";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export interface CharacterContainerProps {
    name: string;
    level: number;
    rarity: 4 | 5;
    constellation: number;
    element: CharacterElementEnum;
    imageUrl: string;
}

export default function CharacterContainer({
    name,
    level,
    rarity,
    constellation,
    element: elementId,
    imageUrl,
}: CharacterContainerProps) {
    const { t } = useTranslation();
    const element = CharacterElementDetail[elementId]
    const elementBadgeClasses: Record<string, string> = {
        [CharacterElementDetail[1].key]: "bg-teal-950/75 border-teal-400",
        [CharacterElementDetail[2].key]: "bg-amber-950/70 border-amber-300",
        [CharacterElementDetail[3].key]: "bg-purple-950/75 border-purple-700",
        [CharacterElementDetail[4].key]: "bg-lime-950/70 border-lime-500",
        [CharacterElementDetail[5].key]: "bg-sky-950/70 border-sky-400",
        [CharacterElementDetail[6].key]: "bg-red-950/70 border-red-500",
        [CharacterElementDetail[7].key]: "bg-cyan-950/70 border-cyan-300",
    }
    const elementBadgeClass = elementBadgeClasses[element.key] ?? "bg-slate-950/70 border-slate-400"

    const rarityBackground = rarity === 5 
        ? "bg-linear-180 from-[#9A6D43] to-[#DE9552]"
        : "bg-linear-180 from-[#4D4280] to-[#935DB1]";
    
    return (
        <div className="flex flex-col justify-center bg-white aspect-[4/5] rounded-sm shadow-md-2 overflow-hidden">
            <div className={`aspect-square ${rarityBackground} rounded-br-lg overflow-hidden flex items-center justify-center relative`}>
                <div
                    className={cn(
                        "absolute left-1 top-1 size-6 rounded-full shadow flex items-center justify-center border",
                        elementBadgeClass,
                    )}
                >
                    <img src={element.iconUrl} alt={element.name} className="size-4" />
                </div>
                <div className={cn(
                    "absolute right-1 top-1 min-w-6 rounded-full bg-black/70 px-2 pt-0.5 text-center text-xs text-white shadow",
                    constellation === 6 ? "text-yellow-700 bg-orange-200" : "",
                )}>
                    C{constellation}
                </div>
                <img src={imageUrl} alt={name} />
            </div>
            <div className="text-center">
                <span className={cn(
                    "text-black text-sm",
                    level > 90 ? "text-yellow-700" : "",
                )}>
                    {t(LocaleKeys.level)} {level}
                </span>
            </div>
        </div>
    );
}