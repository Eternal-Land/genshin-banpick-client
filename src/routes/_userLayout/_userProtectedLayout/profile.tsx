import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { selfApi } from "@/apis/self";
import CharacterContainer, {
  type CharacterContainerProps,
} from "@/components/player-side/character-container";
import { AccountRole, CharacterElement, LocaleKeys } from "@/lib/constants";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_userLayout/_userProtectedLayout/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const elementOrder = [
    CharacterElement.ANEMO,
    CharacterElement.GEO,
    CharacterElement.ELECTRO,
    CharacterElement.DENDRO,
    CharacterElement.HYDRO,
    CharacterElement.PYRO,
    CharacterElement.CRYO,
  ] as const;

  const mockCharacters: CharacterContainerProps[] = [
    {
      name: "Venti",
      level: 90,
      rarity: 5,
      constellation: 2,
      element: elementOrder[0],
      imageUrl:
        "https://res.cloudinary.com/dphtvhtvf/image/upload/v1768877333/venti_fetznx.png",
    },
    {
      name: "Zhongli",
      level: 90,
      rarity: 5,
      constellation: 1,
      element: elementOrder[1],
      imageUrl:
        "https://res.cloudinary.com/dphtvhtvf/image/upload/v1768877352/zhongli_dyd174.png",
    },
    {
      name: "Raiden Shogun",
      level: 100,
      rarity: 5,
      constellation: 2,
      element: elementOrder[2],
      imageUrl:
        "https://res.cloudinary.com/dphtvhtvf/image/upload/v1768877319/raiden-shogun_lxknci.png",
    },
    {
      name: "Nahida",
      level: 95,
      rarity: 5,
      constellation: 0,
      element: elementOrder[3],
      imageUrl:
        "https://res.cloudinary.com/dphtvhtvf/image/upload/v1768877310/nahida_gjvmxf.png",
    },
    {
      name: "Furina",
      level: 90,
      rarity: 5,
      constellation: 0,
      element: elementOrder[4],
      imageUrl:
        "https://res.cloudinary.com/dphtvhtvf/image/upload/v1768877205/furina_owz4t6.png",
    },
    {
      name: "Mavuika",
      level: 90,
      rarity: 5,
      constellation: 1,
      element: elementOrder[5],
      imageUrl:
        "https://res.cloudinary.com/dphtvhtvf/image/upload/v1768877306/mavuika_qc2av8.png",
    },
    {
      name: "Skirk",
      level: 90,
      rarity: 5,
      constellation: 0,
      element: elementOrder[6],
      imageUrl:
        "https://res.cloudinary.com/dphtvhtvf/image/upload/v1768877326/skirk_fq6fjc.png",
    },
    {
      name: "Sucrose",
      level: 80,
      rarity: 4,
      constellation: 6,
      element: elementOrder[0],
      imageUrl:
        "https://res.cloudinary.com/dphtvhtvf/image/upload/v1768877328/sucrose_jl08gt.png",
    },
    {
      name: "Ningguang",
      level: 80,
      rarity: 4,
      constellation: 6,
      element: elementOrder[1],
      imageUrl:
        "https://res.cloudinary.com/dphtvhtvf/image/upload/v1768877314/ningguang_h7slif.png",
    },
    {
      name: "Sara",
      level: 80,
      rarity: 4,
      constellation: 6,
      element: elementOrder[2],
      imageUrl:
        "https://res.cloudinary.com/dphtvhtvf/image/upload/v1768877301/kujou-sara_hjzujq.png",
    },
    {
      name: "Collei",
      level: 80,
      rarity: 4,
      constellation: 4,
      element: elementOrder[3],
      imageUrl:
        "https://res.cloudinary.com/dphtvhtvf/image/upload/v1768877195/collei_d2hooz.png",
    },
    {
      name: "Xingqiu",
      level: 80,
      rarity: 4,
      constellation: 6,
      element: elementOrder[4],
      imageUrl:
        "https://res.cloudinary.com/dphtvhtvf/image/upload/v1768877341/xingqiu_rpiuky.png",
    },
    {
      name: "Bennett",
      level: 80,
      rarity: 4,
      constellation: 6,
      element: elementOrder[5],
      imageUrl:
        "https://res.cloudinary.com/dphtvhtvf/image/upload/v1768877361/bennett_jlrnvc.png",
    },
    {
      name: "Charlotte",
      level: 80,
      rarity: 4,
      constellation: 4,
      element: elementOrder[6],
      imageUrl:
        "https://res.cloudinary.com/dphtvhtvf/image/upload/v1768877194/charlotte_g19k7t.png",
    },
  ];

  const {
    data: profileResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["self"],
    queryFn: selfApi.getSelf,
  });

  const profile = profileResponse?.data;

  const roleLabel = useMemo(() => {
    if (!profile) return "";
    if (profile.role === AccountRole.ADMIN) {
      return t(LocaleKeys.header_role_admin);
    }
    if (profile.role === AccountRole.STAFF) {
      return t(LocaleKeys.header_role_staff);
    }
    return t(LocaleKeys.header_role_profile);
  }, [profile, t]);

  return (
    <div className="min-h-screen text-white">
      <div className="mx-auto w-full max-w-6xl px-6 pb-12 pt-24">
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-semibold tracking-tight">
            {t(LocaleKeys.profile_title)}
          </h1>
          {isLoading ? (
            <span className="text-sm text-white/60">
              {t(LocaleKeys.profile_loading)}
            </span>
          ) : isError ? (
            <span className="text-sm text-destructive">
              {t(LocaleKeys.profile_load_error)}
            </span>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{roleLabel}</Badge>
              {profile?.staffRolename ? (
                <Badge variant="outline">{profile.staffRolename}</Badge>
              ) : null}
            </div>
          )}
        </div>
        <p className="mt-2 text-sm text-white/70">
          {t(LocaleKeys.profile_description)}
        </p>

        {profile?.permissions?.length ? (
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="text-sm text-white/70">
              {t(LocaleKeys.profile_permissions_label)}:
            </span>
            {profile.permissions.map((permission) => (
              <Badge key={permission} variant="outline">
                {permission}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-10">
          {mockCharacters.map((character) => (
            <CharacterContainer
              key={`${character.name}-${character.element}`}
              {...character}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
