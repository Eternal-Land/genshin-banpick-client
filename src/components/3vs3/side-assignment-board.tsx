import type { BanPickCharacter } from "@/components/match/ban-pick.types";
import {
    SelectInput,
    SelectInputContent,
    SelectInputOption,
} from "@/components/select-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";
import {
    createRef,
    type ReactNode,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import Draggable, { type DraggableEvent } from "react-draggable";
import type { DraftSide } from "./types";

interface PlayerOption {
    value: string;
    label: string;
}

interface ChamberTagInput {
    player: string;
    cost: string;
    star: boolean;
    completeTime: string;
}

interface SlotBuildInput {
    level: 90 | 95 | 100;
    constellation: string;
    refinement: string;
}

interface SideAssignmentBoardProps {
    side: DraftSide;
    slots: Array<BanPickCharacter | null>;
    teamPlayerCount: number;
    picksPerPlayer: number;
    playerOptions: PlayerOption[];
    defaultCost: string;
    canReorder: boolean;
    onDragStart: (side: DraftSide, index: number) => void;
    onDrop: (side: DraftSide, index: number) => void;
    onDragEnd: () => void;
    onUpdateSlotBuild: (params: {
        side: DraftSide;
        slotIndex: number;
        characterId: string;
        constellation: number;
        refinement: number;
    }) => void;
}

const SLOT_BUILD_UPDATE_DEBOUNCE_MS = 500;

const COMPLETE_TIME_REGEX = /^\d{2}:[0-5]\d$/;

const normalizeCostInput = (value: string) => value.replace(/\D/g, "");

const formatCompleteTimeInput = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, "").slice(0, 4);
    const minutes = digits.slice(0, 2);
    const seconds = digits.slice(2, 4);

    if (seconds.length > 0) {
        return `${minutes}:${seconds}`;
    }

    if (minutes.length === 2) {
        return `${minutes}:`;
    }

    return minutes;
};

const isValidCompleteTime = (value: string) =>
    value.length === 0 || COMPLETE_TIME_REGEX.test(value);

const normalizeBuildNumberInput = (value: string) => value.replace(/\D/g, "").slice(0, 2);

const DEFAULT_CHAMBER_SLOT_RANGES = [
    { startTeamOrder: 1, endTeamOrder: 8 },
    { startTeamOrder: 9, endTeamOrder: 16 },
    { startTeamOrder: 17, endTeamOrder: 24 },
];

const getPointerPosition = (event: DraggableEvent) => {
    if ("touches" in event && event.touches.length > 0) {
        return {
            clientX: event.touches[0].clientX,
            clientY: event.touches[0].clientY,
        };
    }

    if ("changedTouches" in event && event.changedTouches.length > 0) {
        return {
            clientX: event.changedTouches[0].clientX,
            clientY: event.changedTouches[0].clientY,
        };
    }

    if ("clientX" in event && "clientY" in event) {
        return {
            clientX: event.clientX,
            clientY: event.clientY,
        };
    }

    return null;
};

export default function SideAssignmentBoard({
    side,
    slots,
    teamPlayerCount,
    picksPerPlayer,
    playerOptions,
    defaultCost,
    canReorder,
    onDragStart,
    onDrop,
    onDragEnd,
    onUpdateSlotBuild,
}: SideAssignmentBoardProps) {
    const isBlue = side === "blue";
    const [chamberTagInputs, setChamberTagInputs] = useState<ChamberTagInput[]>([]);
    const [slotBuildInputs, setSlotBuildInputs] = useState<SlotBuildInput[]>([]);
    const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);
    const [dragResetToken, setDragResetToken] = useState(0);
    const slotBuildTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

    const defaultPlayer = useMemo(
        () => playerOptions[0]?.label ?? "",
        [playerOptions],
    );
    const draggableNodeRefs = useMemo(
        () => Array.from({ length: slots.length }).map(() => createRef<HTMLDivElement>()),
        [slots.length],
    );
    const chamberSlotRanges = useMemo(() => {
        if (teamPlayerCount === 3 && picksPerPlayer === 8) {
            return DEFAULT_CHAMBER_SLOT_RANGES;
        }

        return Array.from({ length: teamPlayerCount }).map((_, index) => {
            const startTeamOrder = index * picksPerPlayer + 1;
            return {
                startTeamOrder,
                endTeamOrder: startTeamOrder + picksPerPlayer - 1,
            };
        });
    }, [picksPerPlayer, teamPlayerCount]);

    useEffect(() => {
        setChamberTagInputs((prev) =>
            Array.from({ length: chamberSlotRanges.length }).map((_, index) => {
                const previous = prev[index];

                if (previous) {
                    return {
                        ...previous,
                        player: previous.player || defaultPlayer,
                        cost: previous.cost || defaultCost,
                    };
                }

                return {
                    player: defaultPlayer,
                    cost: defaultCost,
                    star: false,
                    completeTime: "",
                };
            }),
        );
    }, [chamberSlotRanges.length, defaultCost, defaultPlayer]);

    useEffect(() => {
        setSlotBuildInputs((prev) =>
            Array.from({ length: slots.length }).map((_, index) => {
                const previous = prev[index];
                if (previous) {
                    return previous;
                }

                return {
                    level: 90,
                    constellation: "",
                    refinement: "",
                };
            }),
        );
    }, [slots.length]);

    useEffect(() => {
        return () => {
            Object.values(slotBuildTimersRef.current).forEach((timerId) => {
                clearTimeout(timerId);
            });
            slotBuildTimersRef.current = {};
        };
    }, []);

    const updateChamberTag = (
        chamberIndex: number,
        updater: (prev: ChamberTagInput) => ChamberTagInput,
    ) => {
        setChamberTagInputs((prev) => {
            const next = [...prev];
            const current =
                next[chamberIndex] ??
                ({
                    player: defaultPlayer,
                    cost: defaultCost,
                    star: false,
                    completeTime: "",
                } as ChamberTagInput);

            next[chamberIndex] = updater(current);
            return next;
        });
    };

    const updateSlotBuildInput = (
        slotIndex: number,
        updater: (prev: SlotBuildInput) => SlotBuildInput,
    ) => {
        let nextBuild: SlotBuildInput | null = null;

        setSlotBuildInputs((prev) => {
            const next = [...prev];
            const current =
                next[slotIndex] ??
                ({
                    level: 90,
                    constellation: "",
                    refinement: "",
                } as SlotBuildInput);
            const updated = updater(current);
            nextBuild = updated;
            next[slotIndex] = updated;
            return next;
        });

        const character = slots[slotIndex];
        if (!character || !nextBuild) {
            return;
        }

        const existingTimer = slotBuildTimersRef.current[slotIndex];
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        slotBuildTimersRef.current[slotIndex] = setTimeout(() => {
            const constellation = Number.parseInt(nextBuild?.constellation ?? "", 10);
            const refinement = Number.parseInt(nextBuild?.refinement ?? "", 10);

            onUpdateSlotBuild({
                side,
                slotIndex,
                characterId: character.id,
                constellation: Number.isNaN(constellation) ? 0 : constellation,
                refinement: Number.isNaN(refinement) ? 0 : refinement,
            });
        }, SLOT_BUILD_UPDATE_DEBOUNCE_MS);
    };

    const resolveDropIndex = (event: DraggableEvent, fallbackIndex: number) => {
        const pointer = getPointerPosition(event);
        if (!pointer) {
            return fallbackIndex;
        }

        const targetElement = document
            .elementFromPoint(pointer.clientX, pointer.clientY)
            ?.closest("[data-slot-index]");
        const rawSlotIndex = targetElement?.getAttribute("data-slot-index");
        const targetIndex = Number(rawSlotIndex);

        if (Number.isNaN(targetIndex)) {
            return fallbackIndex;
        }

        return targetIndex;
    };

    return (
        <div className="rounded-xl border border-white/20 bg-white/5 p-4 overflow-y-auto">
            <div className="mb-3 flex items-center justify-between">
                <h3
                    className={cn(
                        "text-sm font-semibold uppercase tracking-wider",
                        isBlue ? "text-sky-400" : "text-red-500",
                    )}
                >
                    Final time:
                </h3>
            </div>

            <div className="grid grid-rows-3 gap-3">
                {chamberSlotRanges.map((range, playerIndex) => {
                    const start = range.startTeamOrder - 1;
                    const end = range.endTeamOrder;
                    const playerSlots = slots.slice(start, end);

                    const chamberTagRows: Array<{
                        key: string;
                        label: string;
                        control: ReactNode;
                    }> = [
                        {
                            key: "player",
                            label: "Player:",
                            control: (
                                <SelectInput
                                    value={chamberTagInputs[playerIndex]?.player ?? ""}
                                    placeholder="Select player"
                                    onValueChange={(value) => {
                                        updateChamberTag(playerIndex, (prev) => ({
                                            ...prev,
                                            player: value,
                                        }));
                                    }}
                                    inputClassName="h-8"
                                >
                                    <SelectInputContent>
                                        {playerOptions.map((player) => (
                                            <SelectInputOption
                                                key={`${side}-player-option-${player.value}`}
                                                value={player.label}
                                            >
                                                {player.label}
                                            </SelectInputOption>
                                        ))}
                                    </SelectInputContent>
                                </SelectInput>
                            ),
                        },
                        {
                            key: "cost",
                            label: "Cost:",
                            control: (
                                <Input
                                    value={chamberTagInputs[playerIndex]?.cost ?? ""}
                                    onChange={(event) => {
                                        updateChamberTag(playerIndex, (prev) => ({
                                            ...prev,
                                            cost: normalizeCostInput(event.target.value),
                                        }));
                                    }}
                                    inputMode="numeric"
                                    placeholder="0"
                                    className="h-8"
                                />
                            ),
                        },
                        {
                            key: "star",
                            label: "Star:",
                            control: (
                                <div className="flex h-8 items-center">
                                    <Checkbox
                                        checked={chamberTagInputs[playerIndex]?.star ?? false}
                                        onCheckedChange={(checked) => {
                                            updateChamberTag(playerIndex, (prev) => ({
                                                ...prev,
                                                star: checked === true,
                                            }));
                                        }}
                                        id={`${side}-chamber-star-${playerIndex + 1}`}
                                    />
                                </div>
                            ),
                        },
                        {
                            key: "complete-time",
                            label: "Time clear:",
                            control: (
                                <Input
                                    value={chamberTagInputs[playerIndex]?.completeTime ?? ""}
                                    onChange={(event) => {
                                        updateChamberTag(playerIndex, (prev) => ({
                                            ...prev,
                                            completeTime: formatCompleteTimeInput(
                                                event.target.value,
                                            ),
                                        }));
                                    }}
                                    placeholder="00:00"
                                    className={cn(
                                        "h-8",
                                        !isValidCompleteTime(
                                            chamberTagInputs[playerIndex]?.completeTime ?? "",
                                        ) && "border-red-500 focus-visible:ring-red-500",
                                    )}
                                />
                            ),
                        },
                        {
                            key: "total-time",
                            label: "Total time:",
                            control: (
                                <div className="text-xs text-white/70">
                                    {chamberTagInputs[playerIndex]?.completeTime ?? "0"}s
                                </div>
                            ),
                        }
                    ];

                    return (
                        <div
                            key={`${side}-player-${playerIndex}`}
                            className="flex flex-col rounded-lg border border-white/15 bg-black/30 p-3"
                        >
                            <div className="mb-2 text-xs font-medium text-white/70">
                                Chamber {playerIndex + 1}: {range.startTeamOrder}-{range.endTeamOrder}
                            </div>
                            <div className="flex justify-between gap-3">
                                <div className="grid min-w-80 grid-cols-[100px_minmax(0,1fr)] items-center gap-x-2 gap-y-2">
                                    {chamberTagRows.map((row) => (
                                        <div key={`${side}-${playerIndex}-${row.key}`} className="contents">
                                            <div className="text-right text-xs text-white/70">{row.label}</div>
                                            {row.control}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-4 gap-2">
                                    {playerSlots.map((character, slotIndex) => {
                                        const globalIndex = start + slotIndex;
                                        const slotBuild = slotBuildInputs[globalIndex];
                                        const level = slotBuild?.level ?? 90;

                                        return (
                                            <div
                                                key={`${side}-assignment-${globalIndex}`}
                                                className="flex flex-col"
                                                data-slot-index={globalIndex}
                                            >
                                                {/* Character slot */}
                                                <Draggable
                                                    key={`draggable-${globalIndex}-${dragResetToken}`}
                                                    nodeRef={draggableNodeRefs[globalIndex]}
                                                    disabled={!canReorder || !character}
                                                    cancel="[data-no-drag='true']"
                                                    onStart={() => {
                                                        if (!canReorder || !character) {
                                                            return false;
                                                        }

                                                        onDragStart(side, globalIndex);
                                                        setActiveDragIndex(globalIndex);
                                                    }}
                                                    onStop={(event) => {
                                                        if (!canReorder || !character) {
                                                            return;
                                                        }

                                                        const targetIndex = resolveDropIndex(
                                                            event,
                                                            globalIndex,
                                                        );
                                                        onDrop(side, targetIndex);
                                                        onDragEnd();
                                                        setActiveDragIndex(null);
                                                        setDragResetToken((prev) => prev + 1);
                                                    }}
                                                >
                                                    <div
                                                        ref={draggableNodeRefs[globalIndex]}
                                                        className={cn(
                                                            "group relative flex flex-col transition-shadow will-change-transform",
                                                            character && canReorder && "cursor-move",
                                                            activeDragIndex === globalIndex &&
                                                            "z-20 pointer-events-none shadow-lg shadow-black/40",
                                                        )}
                                                    >
                                                        <div className="relative h-20 overflow-hidden rounded-t-lg border border-white/20 bg-white/5">
                                                            {character ? (
                                                                <img
                                                                    src={character.imageUrl}
                                                                    alt={character.name}
                                                                    className="h-full w-full object-cover"
                                                                    draggable={false}
                                                                />
                                                            ) : null}

                                                            <div className="absolute inset-x-0 bottom-0 bg-black/70 px-1 py-0.5 text-[10px] text-white text-center p-0 outline-none">
                                                                {character ? (
                                                                    <div
                                                                        className="mx-auto w-16 flex"
                                                                        data-no-drag="true"
                                                                        onClick={(event) => event.stopPropagation()}
                                                                        onMouseDown={(event) => event.stopPropagation()}
                                                                    >
                                                                        <span className="text-[12px]">Level</span>
                                                                        <SelectInput
                                                                            value={String(level)}
                                                                            disabled={!canReorder || !character}
                                                                            onValueChange={(value) => {
                                                                                const nextLevel = Number(value);
                                                                                if (
                                                                                    nextLevel !== 90 &&
                                                                                    nextLevel !== 95 &&
                                                                                    nextLevel !== 100
                                                                                ) {
                                                                                    return;
                                                                                }

                                                                                updateSlotBuildInput(globalIndex, (prev) => ({
                                                                                    ...prev,
                                                                                    level: nextLevel,
                                                                                }));
                                                                            }}
                                                                            inputClassName="h-4 border-none bg-transparent px-1 py-0 text-[10px] text-center text-white "
                                                                        >
                                                                            <SelectInputContent>
                                                                                <SelectInputOption value="90">
                                                                                    90
                                                                                </SelectInputOption>
                                                                                <SelectInputOption value="95">
                                                                                    95
                                                                                </SelectInputOption>
                                                                                <SelectInputOption value="100">
                                                                                    100
                                                                                </SelectInputOption>
                                                                            </SelectInputContent>
                                                                        </SelectInput>
                                                                    </div>
                                                                ) : null}
                                                            </div>

                                                            {character ? (
                                                                <GripVertical className="absolute right-1 top-1 h-4 w-4 text-white/90 opacity-80" />
                                                            ) : null}
                                                        </div>

                                                        {/* Constellation - Refinement */}
                                                        <div
                                                            className="flex items-center justify-center gap-1 text-[16px] text-white/80 border-r border-l border-b border-white/20 bg-black/30 px-1 py-0.5 rounded-b-lg"
                                                            data-no-drag="true"
                                                        >
                                                            <span>C</span>
                                                            <Input
                                                                value={slotBuild?.constellation ?? ""}
                                                                onChange={(event) => {
                                                                    updateSlotBuildInput(globalIndex, (prev) => ({
                                                                        ...prev,
                                                                        constellation: normalizeBuildNumberInput(
                                                                            event.target.value,
                                                                        ),
                                                                    }));
                                                                }}
                                                                disabled={!character}
                                                                placeholder="0"
                                                                className="h-6 w-6 px-1 py-0 text-center text-[10px] rounded-none border-none bg-transparent"
                                                                onClick={(event) => event.stopPropagation()}
                                                                onMouseDown={(event) => event.stopPropagation()}
                                                            />
                                                            <span>R</span>
                                                            <Input
                                                                value={slotBuild?.refinement ?? ""}
                                                                onChange={(event) => {
                                                                    updateSlotBuildInput(globalIndex, (prev) => ({
                                                                        ...prev,
                                                                        refinement: normalizeBuildNumberInput(
                                                                            event.target.value,
                                                                        ),
                                                                    }));
                                                                }}
                                                                disabled={!character}
                                                                placeholder="0"
                                                                className="h-6 w-6 px-1 py-0 text-center text-[10px] rounded-none border-none bg-transparent"
                                                                onClick={(event) => event.stopPropagation()}
                                                                onMouseDown={(event) => event.stopPropagation()}
                                                            />
                                                        </div>
                                                    </div>
                                                </Draggable>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>
                    );
                })}
            </div>
        </div>
    );
}
