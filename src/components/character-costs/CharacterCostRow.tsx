import { memo } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { TableCell, TableRow } from "@/components/ui/table";
import CostInputCell from "./CostInputCell";
import type { CharacterCostCharacterResponse } from "@/apis/character-costs/type";

export type CharacterCostRowProps = {
  character: CharacterCostCharacterResponse;
  onCommit: (costId: number, value: number) => void;
};

function CharacterCostRow({ character, onCommit }: CharacterCostRowProps) {
  return (
    <TableRow key={character.id}>
      <TableCell className="h-20 flex gap-3 items-center">
        <Avatar size="lg">
          <AvatarImage src={character.iconUrl} />
        </Avatar>
        <p>{character.name}</p>
      </TableCell>
      {character.characterCosts?.map((cost) => (
        <TableCell key={cost.constellation}>
          <CostInputCell
            costId={cost.id}
            value={cost.cost}
            onCommit={onCommit}
          />
        </TableCell>
      ))}
    </TableRow>
  );
}

export default memo(CharacterCostRow);
