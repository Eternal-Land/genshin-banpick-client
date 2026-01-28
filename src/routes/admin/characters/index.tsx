import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { createFileRoute, Link } from "@tanstack/react-router";
import { charactersApi } from "@/apis/characters";
import type { CharacterResponse } from "@/apis/characters/types";
import type { BaseApiResponse } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { RefreshSpinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LocaleKeys } from "@/lib/constants";
import dayjs from "dayjs";
import {
  BanIcon,
  PenIcon,
  PlusIcon,
  RefreshCcwIcon,
  SearchIcon,
  SquareCheckIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useElementLabel } from "@/hooks/use-element-label";
import { useWeaponTypeLabel } from "@/hooks/use-weapon-type-label";

export const Route = createFileRoute("/admin/characters/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const elementLabelMap = useElementLabel();
  const weaponTypeLabelMap = useWeaponTypeLabel();
  const [query, setQuery] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<CharacterResponse | null>(
    null,
  );

  const {
    data: charactersResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["characters"],
    queryFn: charactersApi.listCharacters,
  });

  const toggleMutation = useMutation<
    BaseApiResponse,
    AxiosError<BaseApiResponse>,
    number
  >({
    mutationFn: (id) => charactersApi.toggleActive(id),
    onSuccess: () => {
      toast.success(t(LocaleKeys.characters_status_updated));
      refetch();
      setConfirmTarget(null);
    },
    onError: (mutationError) => {
      toast.error(
        mutationError.response?.data.message ||
          t(LocaleKeys.characters_status_update_error),
      );
    },
  });

  const characters = charactersResponse?.data ?? [];

  const filteredCharacters = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return characters;

    return characters.filter((character) =>
      [character.name, character.key]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [characters, query]);

  const handleConfirmToggle = () => {
    if (!confirmTarget) return;
    toggleMutation.mutate(confirmTarget.id);
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t(LocaleKeys.characters_title)}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            <span>
              {t(LocaleKeys.characters_count, { count: characters.length })}
            </span>
            {error ? (
              <span className="text-destructive">
                {t(LocaleKeys.characters_load_error)}
              </span>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <InputGroup>
              <InputGroupInput
                placeholder={t(LocaleKeys.characters_search_placeholder)}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <SearchIcon className="size-4" />
              </InputGroupAddon>
            </InputGroup>

            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    size="icon"
                  >
                    {isFetching ? (
                      <RefreshSpinner className="size-4" />
                    ) : (
                      <RefreshCcwIcon className="size-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t(LocaleKeys.characters_refresh)}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild size="icon">
                    <Link to="/admin/characters/create">
                      <PlusIcon className="size-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t(LocaleKeys.characters_create_new)}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="w-full max-w-full overflow-x-auto">
            <Table className="w-full table-auto">
              <TableHeader>
                <TableRow>
                  <TableHead>{t(LocaleKeys.characters_table_icon)}</TableHead>
                  <TableHead>{t(LocaleKeys.characters_table_name)}</TableHead>
                  <TableHead>{t(LocaleKeys.characters_table_key)}</TableHead>
                  <TableHead>
                    {t(LocaleKeys.characters_table_element)}
                  </TableHead>
                  <TableHead>{t(LocaleKeys.characters_table_weapon)}</TableHead>
                  <TableHead>{t(LocaleKeys.characters_table_rarity)}</TableHead>
                  <TableHead>{t(LocaleKeys.characters_table_status)}</TableHead>
                  <TableHead>
                    {t(LocaleKeys.characters_table_updated_at)}
                  </TableHead>
                  <TableHead>{t(LocaleKeys.characters_table_action)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`character-skeleton-${index}`}>
                        <TableCell>
                          <Skeleton className="h-9 w-9" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-12" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                      </TableRow>
                    ))
                  : filteredCharacters.map((character) => (
                      <TableRow key={character.id}>
                        <TableCell>
                          <Avatar className="size-9">
                            <AvatarImage
                              src={character.iconUrl}
                              alt={character.name}
                            />
                            <AvatarFallback>
                              {getInitials(character.name)}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium break-words">
                          {character.name}
                        </TableCell>
                        <TableCell className="break-words">
                          {character.key}
                        </TableCell>
                        <TableCell>
                          {elementLabelMap[character.element]}
                        </TableCell>
                        <TableCell>
                          {weaponTypeLabelMap[character.weaponType]}
                        </TableCell>
                        <TableCell>
                          {character.rarity ? `${character.rarity}★` : "-"}
                        </TableCell>
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
                            ? dayjs(character.updatedAt).format(
                                "DD/MM/YYYY HH:mm",
                              )
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  asChild
                                  variant="outline"
                                  size="icon-sm"
                                >
                                  <Link
                                    to="/admin/characters/$characterId"
                                    params={{
                                      characterId: character.id.toString(),
                                    }}
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
                                    character.isActive
                                      ? "destructive"
                                      : "secondary"
                                  }
                                  size="icon-sm"
                                  disabled={toggleMutation.isPending}
                                  onClick={() => setConfirmTarget(character)}
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

                {!isLoading && filteredCharacters.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-muted-foreground text-center"
                    >
                      {t(LocaleKeys.characters_empty)}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(confirmTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmTarget(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmTarget?.isActive
                ? t(LocaleKeys.characters_confirm_deactivate_title)
                : t(LocaleKeys.characters_confirm_activate_title)}
            </DialogTitle>
            <DialogDescription>
              {confirmTarget?.isActive
                ? t(LocaleKeys.characters_confirm_deactivate_desc, {
                    name: confirmTarget.name,
                  })
                : t(LocaleKeys.characters_confirm_activate_desc, {
                    name: confirmTarget?.name,
                  })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmTarget(null)}
            >
              {t(LocaleKeys.characters_cancel)}
            </Button>
            <Button
              type="button"
              variant={confirmTarget?.isActive ? "destructive" : "secondary"}
              onClick={handleConfirmToggle}
              disabled={toggleMutation.isPending}
            >
              {toggleMutation.isPending
                ? t(LocaleKeys.characters_update_pending)
                : confirmTarget?.isActive
                  ? t(LocaleKeys.characters_deactivate)
                  : t(LocaleKeys.characters_activate)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
