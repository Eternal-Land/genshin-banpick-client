import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import dayjs from "dayjs";
import { BanIcon, PenIcon, SquareCheckIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LocaleKeys } from "@/lib/constants";
import type { CharacterResponse } from "@/apis/characters/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useElementLabel } from "@/hooks/use-element-label";
import { useWeaponTypeLabel } from "@/hooks/use-weapon-type-label";

export interface CharactersTableProps {
  isLoading?: boolean;
  characters?: CharacterResponse[];
  onActivateDeactivate?: (character: CharacterResponse) => void;
}

export default function CharactersTable({
  isLoading,
  characters,
  onActivateDeactivate,
}: CharactersTableProps) {
  const { t } = useTranslation();
  const elementLabelMap = useElementLabel();
  const weaponTypeLabelMap = useWeaponTypeLabel();

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");

  return (
    <Table className="w-full table-auto">
      <TableHeader>
        <TableRow>
          <TableHead>{t(LocaleKeys.characters_table_icon)}</TableHead>
          <TableHead>{t(LocaleKeys.characters_table_name)}</TableHead>
          <TableHead>{t(LocaleKeys.characters_table_key)}</TableHead>
          <TableHead>{t(LocaleKeys.characters_table_element)}</TableHead>
          <TableHead>{t(LocaleKeys.characters_table_weapon)}</TableHead>
          <TableHead className="w-20">
            {t(LocaleKeys.characters_table_rarity)}
          </TableHead>
          <TableHead className="w-30">
            {t(LocaleKeys.characters_table_status)}
          </TableHead>
          <TableHead className="w-50">
            {t(LocaleKeys.characters_table_updated_at)}
          </TableHead>
          <TableHead className="w-30">
            {t(LocaleKeys.characters_table_action)}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`character-skeleton-${index}`}>
                <TableCell>
                  <Skeleton className="h-10 w-10 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-10" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-36" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
              </TableRow>
            ))
          : characters?.map((character) => (
              <TableRow key={character.id}>
                <TableCell>
                  <Avatar className="size-10">
                    <AvatarImage src={character.iconUrl} alt={character.name} />
                    <AvatarFallback>{getInitials(character.name)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{character.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {character.key}
                </TableCell>
                <TableCell>
                  {elementLabelMap[character.element as keyof typeof elementLabelMap] ?? "-"}
                </TableCell>
                <TableCell>
                  {weaponTypeLabelMap[character.weaponType as keyof typeof weaponTypeLabelMap] ?? "-"}
                </TableCell>
                <TableCell>{character.rarity}★</TableCell>
                <TableCell>
                  {character.isActive ? (
                    <Badge variant="secondary">
                      {t(LocaleKeys.characters_status_active)}
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      {t(LocaleKeys.characters_status_inactive)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {character.updatedAt
                    ? dayjs(character.updatedAt).format("DD/MM/YYYY HH:mm")
                    : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button asChild variant="outline" size="icon-sm">
                          <Link
                            to="/admin/characters/$characterId"
                            params={{ characterId: character.id.toString() }}
                          >
                            <PenIcon className="size-3" />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t(LocaleKeys.characters_edit_tooltip)}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant={
                            character.isActive ? "destructive" : "secondary"
                          }
                          size="icon-sm"
                          disabled={isLoading}
                          onClick={() =>
                            onActivateDeactivate &&
                            onActivateDeactivate(character)
                          }
                          className="cursor-pointer"
                        >
                          {character.isActive ? (
                            <BanIcon className="size-3" />
                          ) : (
                            <SquareCheckIcon className="size-3" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {character.isActive
                          ? t(LocaleKeys.characters_deactivate_tooltip)
                          : t(LocaleKeys.characters_activate_tooltip)}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
      </TableBody>
    </Table>
  );
}
