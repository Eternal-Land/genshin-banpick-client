import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { createFileRoute, Link } from "@tanstack/react-router";
import { charactersApi } from "@/apis/characters";
import type { CharacterResponse } from "@/apis/characters/types";
import type { BaseApiResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { PlusIcon, RefreshCcwIcon, SearchIcon } from "lucide-react";
import { RefreshSpinner } from "@/components/ui/spinner";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useTranslation } from "react-i18next";
import { LocaleKeys } from "@/lib/constants";
import {
  CharactersTable,
  CharacterToggleDialog,
} from "@/components/characters";
import type { CharactersTableFilter } from "@/components/characters/CharactersTable";

export const Route = createFileRoute("/admin/characters/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const [query, setQuery] = useState<CharactersTableFilter>({
    elements: [],
    rarities: [],
    search: "",
    statuses: [],
    weaponTypes: [],
  });
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
    console.log("Filtering characters with query:", query);

    const normalizedSearch = query.search?.trim().toLowerCase();

    return characters.filter((character) => {
      console.log("Checking character:", character);
      console.log(
        "Character element included? ",
        query.elements?.includes(character.element),
      );

      if (
        query.elements &&
        query.elements.length > 0 &&
        !query.elements.includes(character.element)
      ) {
        return false;
      }

      if (
        query.weaponTypes &&
        query.weaponTypes.length > 0 &&
        !query.weaponTypes.includes(character.weaponType)
      ) {
        return false;
      }

      if (
        query.rarities &&
        query.rarities.length > 0 &&
        !query.rarities.includes(character.rarity)
      ) {
        return false;
      }

      if (
        query.statuses &&
        query.statuses.length > 0 &&
        !query.statuses.includes(character.isActive)
      ) {
        return false;
      }

      if (normalizedSearch) {
        const nameMatch = character.name
          .toLowerCase()
          .includes(normalizedSearch);
        const keyMatch = character.key.toLowerCase().includes(normalizedSearch);
        if (!nameMatch && !keyMatch) {
          return false;
        }
      }

      return true;
    });
  }, [characters, query]);

  const handleConfirmToggle = () => {
    if (!confirmTarget) return;
    toggleMutation.mutate(confirmTarget.id);
  };

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
                value={query.search}
                onChange={(event) =>
                  setQuery({ ...query, search: event.target.value })
                }
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
            <CharactersTable
              isLoading={isLoading}
              characters={filteredCharacters}
              onActivateDeactivate={setConfirmTarget}
              filter={query}
              onFilterChange={setQuery}
            />
          </div>
        </CardContent>
      </Card>

      <CharacterToggleDialog
        character={confirmTarget}
        isPending={toggleMutation.isPending}
        onConfirm={handleConfirmToggle}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
