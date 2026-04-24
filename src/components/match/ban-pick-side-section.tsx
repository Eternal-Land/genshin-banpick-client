import type { AccountCharacterResponse } from "@/apis/account-characters/types";
import type { UserWeaponResponse } from "@/apis/user-weapons/types";
import BanPickCharacterSelector from "@/components/match/ban-pick-character-selector";
import BanPickDraftSlots from "@/components/match/ban-pick-draft-slots";
import BanPickElementFilter from "@/components/match/ban-pick-element-filter";
import BanPickPlayerInfo from "@/components/match/ban-pick-player-info";
import BanPickRarityFilter from "@/components/match/ban-pick-rarity-filter";
import BanPickTeamBuild from "@/components/match/ban-pick-team-build";
import BanPickTimerInputs, {
	type BanPickTimerInputValues,
} from "@/components/match/ban-pick-timer-inputs";
import type {
	BanPickCharacter,
	DraftAction,
	DraftSide,
} from "@/components/match/ban-pick.types";

interface BanPickSideCostInfo {
	totalCost?: number;
	milestoneCost?: number;
	constellationCost?: number;
	refinementCost?: number;
	levelCost?: number;
	timeBonusCost?: number;
}

interface BanPickSidePlayerInfo {
	id?: string;
	displayName?: string;
	ingameUuid?: string;
	avatar?: string;
}

interface BanPickSideSectionProps {
	side: DraftSide;
	player?: BanPickSidePlayerInfo;
	cost: BanPickSideCostInfo;
	isRealtimeMatch: boolean;
	timerValues: BanPickTimerInputValues;
	onTimerValuesChange: (
		side: DraftSide,
		values: BanPickTimerInputValues,
	) => void;
	bans: BanPickCharacter[];
	picks: BanPickCharacter[];
	currentAction?: DraftAction;
	isDraftCompleted: boolean;
	pendingCharacter: BanPickCharacter | null;
	canInteract: boolean;
	search: string;
	onSearchChange: (value: string) => void;
	selectedElement: string;
	onSelectElement: (value: string) => void;
	selectedRarity: string;
	onSelectRarity: (value: string) => void;
	characters: BanPickCharacter[];
	selectedCharacterNames: Set<string>;
	filteredCharacters: AccountCharacterResponse[];
	onSelectCharacter: (character: AccountCharacterResponse) => void;
	weapons: UserWeaponResponse[];
	canReorderTeam: boolean;
	canPickWeapon: boolean;
	selectedWeaponByCharacterId: Record<string, number | undefined>;
	selectedWeaponRefinementByCharacterId: Record<string, number | undefined>;
	onPickWeapon: (
		character: BanPickCharacter,
		weaponId: number,
		weaponRefinement: number,
	) => Promise<void>;
}

export default function BanPickSideSection({
	side,
	player,
	cost,
	isRealtimeMatch,
	timerValues,
	onTimerValuesChange,
	bans,
	picks,
	currentAction,
	isDraftCompleted,
	pendingCharacter,
	canInteract,
	search,
	onSearchChange,
	selectedElement,
	onSelectElement,
	selectedRarity,
	onSelectRarity,
	characters,
	selectedCharacterNames,
	filteredCharacters,
	onSelectCharacter,
	weapons,
	canReorderTeam,
	canPickWeapon,
	selectedWeaponByCharacterId,
	selectedWeaponRefinementByCharacterId,
	onPickWeapon,
}: BanPickSideSectionProps) {
	const isBlue = side === "blue";
	const backgroundClassName = isBlue
		? "bg-transparent bg-radial from-sky-400/50 from-0% to-white/0 to-70% fixed inset-0 z-[-2] left-[-500px] top-0 h-screen aspect-square rounded-full"
		: "bg-transparent bg-radial from-red-400/50 from-0% to-white/0 to-70% fixed inset-0 z-[-2] left-[1500px] top-0 h-screen aspect-square rounded-full";

	return (
		<div className="col-span-3 flex flex-col h-dvh p-4 gap-4">
			<div className={backgroundClassName}></div>

			<div className="timer-side flex items-center gap-4">
				<BanPickTimerInputs
					isRealtimeMatch={isRealtimeMatch}
					side={side}
					values={timerValues}
					onValuesChange={onTimerValuesChange}
				/>
			</div>

			<div className="grid grid-rows-2 gap-4 h-full overflow-hidden">
				<div className="grid grid-cols-7 gap-8">
					{isBlue ? (
						<>
							<BanPickPlayerInfo side={side} player={player} cost={cost} />
							<BanPickDraftSlots
								side={side}
								bans={bans}
								picks={picks}
								currentAction={currentAction}
								isDraftCompleted={isDraftCompleted}
								pendingCharacter={pendingCharacter}
							/>
						</>
					) : (
						<>
							<BanPickDraftSlots
								side={side}
								bans={bans}
								picks={picks}
								currentAction={currentAction}
								isDraftCompleted={isDraftCompleted}
								pendingCharacter={pendingCharacter}
							/>
							<BanPickPlayerInfo side={side} player={player} cost={cost} />
						</>
					)}
				</div>

				{isDraftCompleted ? (
					<BanPickTeamBuild
						picks={picks}
						weapons={weapons}
						titleClassName={isBlue ? "text-sky-400" : "text-red-600"}
						slotClassName={
							isBlue
								? "bg-sky-800/10 border-sky-400/50"
								: "bg-red-800/10 border-red-600/50"
						}
						canReorder={canReorderTeam}
						canPickWeapon={canPickWeapon}
						selectedWeaponByCharacterId={selectedWeaponByCharacterId}
						selectedWeaponRefinementByCharacterId={selectedWeaponRefinementByCharacterId}
						onPickWeapon={onPickWeapon}
					/>
				) : (
					<BanPickCharacterSelector
						side={side}
						canInteract={canInteract}
						search={search}
						onSearchChange={onSearchChange}
						renderElementFilter={
							<BanPickElementFilter
								selectedElement={selectedElement}
								onSelect={onSelectElement}
							/>
						}
						renderRarityFilter={
							<BanPickRarityFilter
								selectedRarity={selectedRarity}
								onSelect={onSelectRarity}
							/>
						}
						characters={characters}
						selectedCharacterNames={selectedCharacterNames}
						pendingCharacter={pendingCharacter}
						isDraftCompleted={isDraftCompleted}
						currentAction={currentAction}
						onSelectCharacter={(character) => {
							const selected = filteredCharacters.find(
								(item) => item.characters.name === character.name,
							);
							if (!selected) {
								return;
							}
							onSelectCharacter(selected);
						}}
					/>
				)}
			</div>
		</div>
	);
}
