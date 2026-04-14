import { cn } from '@/lib/utils'
import { IconAssets } from '@/lib/constants/icon-assets'
import { matchLocaleKeys } from '@/i18n/keys'
import { useTranslation } from 'react-i18next'
import type {
    BanPickCharacter,
    DraftAction,
    DraftActionType,
    DraftSide,
} from '@/components/match/ban-pick.types'

export interface BanPickDraftSlotsProps {
    side: DraftSide
    bans: BanPickCharacter[]
    picks: BanPickCharacter[]
    currentAction?: DraftAction
    isDraftCompleted: boolean
    pendingCharacter: BanPickCharacter | null
}

function getSlotHighlightClasses(
    side: DraftSide,
    type: DraftActionType,
    slotIndex: number,
    bans: BanPickCharacter[],
    picks: BanPickCharacter[],
    currentAction: DraftAction | undefined,
    isDraftCompleted: boolean,
) {
    const filledCount = type === 'ban' ? bans.length : picks.length
    const maxSlot = type === 'ban' ? 3 : 8
    const isFilled = slotIndex < filledCount
    const isCurrentSlot =
        !isDraftCompleted &&
        currentAction?.side === side &&
        currentAction?.type === type &&
        slotIndex === filledCount &&
        filledCount < maxSlot

    if (isCurrentSlot) {
        if (type === 'ban') {
            return 'border-yellow-400 bg-white/20 animate-pulse border-4'
        }

        return side === 'blue'
            ? 'border-yellow-400 bg-sky-400/20 animate-pulse border-4'
            : 'border-yellow-400 bg-red-600/20 animate-pulse border-4'
    }

    if (isFilled) {
        return type === 'ban'
            ? 'border-white bg-white/20'
            : side === 'blue'
                ? 'border-sky-400 bg-sky-400/40'
                : 'border-red-600 bg-red-600/50'
    }

    return ''
}

function getSlotCharacter(
    side: DraftSide,
    type: DraftActionType,
    slotIndex: number,
    bans: BanPickCharacter[],
    picks: BanPickCharacter[],
    currentAction: DraftAction | undefined,
    isDraftCompleted: boolean,
    pendingCharacter: BanPickCharacter | null,
) {
    const committedCharacter = type === 'ban' ? bans[slotIndex] : picks[slotIndex]
    if (committedCharacter) {
        return committedCharacter
    }

    const filledCount = type === 'ban' ? bans.length : picks.length
    const maxSlot = type === 'ban' ? 3 : 8
    const isPreviewSlot =
        !isDraftCompleted &&
        !!pendingCharacter &&
        currentAction?.side === side &&
        currentAction?.type === type &&
        slotIndex === filledCount &&
        filledCount < maxSlot

    return isPreviewSlot ? pendingCharacter : undefined
}

export default function BanPickDraftSlots({
    side,
    bans,
    picks,
    currentAction,
    isDraftCompleted,
    pendingCharacter,
}: BanPickDraftSlotsProps) {
    const { t } = useTranslation('match')
    const pickBaseClass =
        side === 'blue'
            ? 'bg-sky-800/10 border-sky-400/50'
            : 'bg-red-800/10 border-red-600/50'

    return (
        <div className="col-span-4 grid grid-rows-3 gap-4">
            <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 3 }).map((_, index) => {
                    const slotCharacter = getSlotCharacter(
                        side,
                        'ban',
                        index,
                        bans,
                        picks,
                        currentAction,
                        isDraftCompleted,
                        pendingCharacter,
                    )

                    return (
                        <div
                            key={index}
                            className={cn(
                                'bg-gray-800/50 w-full h-full flex flex-col items-center justify-center border border-2 overflow-hidden',
                                side === 'blue' && `col-start-${index + 2}`,
                                getSlotHighlightClasses(
                                    side,
                                    'ban',
                                    index,
                                    bans,
                                    picks,
                                    currentAction,
                                    isDraftCompleted,
                                ),
                            )}
                        >
                            {slotCharacter ? (
                                <img
                                    src={slotCharacter.imageUrl}
                                    alt={slotCharacter.name}
                                    className={cn(
                                        'w-full h-full object-cover',
                                        'grayscale',
                                    )}
                                />
                            ) : (
                                <img
                                    src={IconAssets.EMPTY_CHARACTER_ICON}
                                    alt={t(matchLocaleKeys.ban_pick_empty_ban_slot_alt)}
                                    className="w-12 h-12 object-contain"
                                />
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="grid grid-cols-4 grid-rows-2 gap-4 h-full row-span-2">
                {Array.from({ length: 8 }).map((_, index) => {
                    const slotCharacter = getSlotCharacter(
                        side,
                        'pick',
                        index,
                        bans,
                        picks,
                        currentAction,
                        isDraftCompleted,
                        pendingCharacter,
                    )

                    return (
                        <div
                            key={index}
                            className={cn(
                                'w-full h-full flex items-center justify-center border border-2',
                                pickBaseClass,
                                getSlotHighlightClasses(
                                    side,
                                    'pick',
                                    index,
                                    bans,
                                    picks,
                                    currentAction,
                                    isDraftCompleted,
                                ),
                            )}
                        >
                            {slotCharacter ? (
                                <img
                                    src={slotCharacter.imageUrl}
                                    alt={slotCharacter.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <img
                                    src={IconAssets.EMPTY_CHARACTER_ICON}
                                    alt={t(matchLocaleKeys.ban_pick_empty_pick_slot_alt)}
                                    className="w-12 h-12 object-contain"
                                />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
