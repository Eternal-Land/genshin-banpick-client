import type { BanPickCharacter } from "@/components/match/ban-pick.types";
import BanPickElementFilter from "@/components/match/ban-pick-element-filter";
import BanPickRarityFilter from "@/components/match/ban-pick-rarity-filter";
import CharacterContainer from "@/components/player-side/character-container";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DraftSide, PendingPickState } from "./types";

interface CharacterSelectorProps {
  side: DraftSide;
  characters: BanPickCharacter[];
  search: string;
  onSearchChange: (value: string) => void;
  selectedElement: string;
  onSelectElement: (value: string) => void;
  selectedRarity: string;
  onSelectRarity: (value: string) => void;
  selectedCharacterIds: Set<string>;
  pendingPick: PendingPickState | null;
  canInteract: boolean;
  onSelectCharacter: (side: DraftSide, character: BanPickCharacter) => void;
}

export default function CharacterSelector({
  side,
  characters,
  search,
  onSearchChange,
  selectedElement,
  onSelectElement,
  selectedRarity,
  onSelectRarity,
  selectedCharacterIds,
  pendingPick,
  canInteract,
  onSelectCharacter,
}: CharacterSelectorProps) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-xl border border-white/20 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search character"
          className="w-1/3"
        />
        <BanPickElementFilter
          selectedElement={selectedElement}
          onSelect={onSelectElement}
        />
        <BanPickRarityFilter
          selectedRarity={selectedRarity}
          onSelect={onSelectRarity}
        />
      </div>
      <div className="grid grid-cols-7 auto-rows-min gap-3 overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {characters.map((character) => {
          const isSelected = selectedCharacterIds.has(character.id);
          const isPending =
            pendingPick?.side === side && pendingPick.character.id === character.id;
          const isDisabled = isSelected || !canInteract;

          return (
            <button
              key={`${side}-${character.id}`}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectCharacter(side, character)}
              className={cn(
                "text-left",
                isDisabled
                  ? "cursor-not-allowed opacity-50 grayscale"
                  : "cursor-pointer",
                isPending &&
                  (side === "blue"
                    ? "rounded-sm ring-2 ring-sky-400"
                    : "rounded-sm ring-2 ring-red-500"),
              )}
            >
              <CharacterContainer
                constellation={character.constellation}
                element={character.element}
                imageUrl={character.imageUrl}
                level={character.level}
                name={character.name}
                rarity={character.rarity}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
