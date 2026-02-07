import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { selfApi } from "@/apis/self";
import CharacterContainer, {
  type CharacterContainerProps,
} from "@/components/player-side/character-container";
import { AccountRole, CharacterElement, LocaleKeys } from "@/lib/constants";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { CodeBlock } from "@/components/code-block";

export const Route = createFileRoute("/_userLayout/_userProtectedLayout/profile")({
  component: RouteComponent,
});

const code = `// Copy cookies to clipboard
script: (function() {
  if (document.cookie.includes("ltuid_v2")) {
    const input = document.createElement('input');
    input.value = document.cookie;
    document.body.appendChild(input);
    input.focus();
    input.select();
    var result = document.execCommand('copy');
    document.body.removeChild(input);
    if (result) {
      alert('HoYoLAB cookie copied to clipboard');
    } else {
      prompt('Failed to copy cookie. Manually copy the cookie below:', input.value);
    }
  } else {
    alert('Please logout and log back in. Cookie is expired/invalid!');
  }
})();
`;

function RouteComponent() {
  const { t } = useTranslation();
  const [isHoyoLabDialogOpen, setIsHoyoLabDialogOpen] = useState(false);
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

  const hoyolabSteps = useMemo(
    () => [
      {
        label: t(LocaleKeys.profile_hoyolab_step_1_label),
        description: t(LocaleKeys.profile_hoyolab_step_1_desc),
      },
      {
        label: t(LocaleKeys.profile_hoyolab_step_2_label),
        description: t(LocaleKeys.profile_hoyolab_step_2_desc),
      },
      {
        label: t(LocaleKeys.profile_hoyolab_step_3_label),
        description: t(LocaleKeys.profile_hoyolab_step_3_desc),
        imageUrl: "https://res.cloudinary.com/dphtvhtvf/image/upload/v1770435183/Screenshot_2026-02-07_101347_hvv8y8.png",
      },
      {
        label: t(LocaleKeys.profile_hoyolab_step_4_label),
        description: t(LocaleKeys.profile_hoyolab_step_4_desc),
      },
      {
        label: t(LocaleKeys.profile_hoyolab_step_5_label),
        description: t(LocaleKeys.profile_hoyolab_step_5_desc),
        imageUrl: "https://res.cloudinary.com/dphtvhtvf/image/upload/v1770437128/Screenshot_2026-02-07_105034_frk4px.png"
      },
      {
        label: t(LocaleKeys.profile_hoyolab_step_6_label),
        description: t(LocaleKeys.profile_hoyolab_step_6_desc),
      },
    ],
    [t]
  );

  return (
    <div className="min-h-screen text-white">
      <div className="mx-auto w-full max-w-6xl px-6 pb-12 pt-24">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
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
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary">
              {t(LocaleKeys.profile_character_button)}
            </Button>
            <Dialog
              open={isHoyoLabDialogOpen}
              onOpenChange={setIsHoyoLabDialogOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  {t(LocaleKeys.profile_hoyolab_sync_button)}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] min-w-[70rem] overflow-y-auto sm:max-w-2xl bg-transparent bg-linear-45 from-white/5 to-white/10 backdrop-blur-md">
                <DialogHeader>
                  <DialogTitle>
                    {t(LocaleKeys.profile_hoyolab_dialog_title)}
                  </DialogTitle>
                  <DialogDescription>
                    {t(LocaleKeys.profile_hoyolab_dialog_description)}
                  </DialogDescription>
                </DialogHeader>
                <div className="no-scrollbar max-h-[60vh] overflow-y-auto py-6">
                  <Stepper orientation="vertical" defaultValue={1}>
                    <StepperNav className="gap-4">
                      {hoyolabSteps.map((step, index) => {
                        const stepNumber = index + 1;
                        return (
                          <StepperItem
                            key={step.label}
                            step={stepNumber}
                            className="items-start"
                          >
                            <StepperTrigger className="items-start">
                              <StepperIndicator>{stepNumber}</StepperIndicator>
                              <div className="space-y-1 text-left">
                                <StepperTitle>{step.label}</StepperTitle>
                                <StepperDescription>
                                  {step.description}
                                </StepperDescription>
                              </div>
                            </StepperTrigger>
                            {stepNumber === 3 ? (
                              <div className="mt-4 w-full space-y-2">
                                <Label className="text-sm text-white/70">
                                  {t(LocaleKeys.profile_hoyolab_step_3_copy)}
                                </Label>
                                <CodeBlock code={code} language="javascript" />
                              </div>
                            ) : null}
                            {stepNumber === 4 ? (
                              <div className="mt-4 w-full space-y-2">
                                <Label className="text-sm text-white/70">
                                  {t(LocaleKeys.profile_hoyolab_step_4_input_label)}
                                </Label>
                                <Textarea
                                  placeholder={t(
                                    LocaleKeys.profile_hoyolab_step_4_input_placeholder
                                  )}
                                  className="min-h-28vh max-w-full"
                                />
                              </div>
                            ) : null}
                            {stepNumber === 5 ? (
                              <div className="mt-4 w-full space-y-2">
                                <Label className="text-sm text-yellow-400">
                                  {t(LocaleKeys.profile_hoyolab_step_5_attention)}
                                </Label>
                              </div>
                            ) : null}
                            {stepNumber === 6 ? (
                              <div className="mt-4 w-full space-y-4">
                                <div className="space-y-2">
                                  <Label className="text-sm text-white/70">
                                    {t(LocaleKeys.profile_hoyolab_step_6_ltoken_label)}
                                  </Label>
                                  <Input
                                    placeholder={t(
                                      LocaleKeys.profile_hoyolab_step_6_ltoken_placeholder
                                    )}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm text-white/70">
                                    {t(
                                      LocaleKeys.profile_hoyolab_step_6_cookie_token_label
                                    )}
                                  </Label>
                                  <Input
                                    placeholder={t(
                                      LocaleKeys.profile_hoyolab_step_6_cookie_token_placeholder
                                    )}
                                  />
                                </div>
                              </div>
                            ) : null}
                            {![1,2,4,6].includes(stepNumber) ? (
                              <div className="mt-4 flex w-full flex-col gap-3">
                                <div className="flex w-full items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/5 text-xs text-white/60 overflow-hidden">
                                  {step.imageUrl ? (
                                    <img src={step.imageUrl} alt="Step guide" className="w-full object-contain" />
                                  ) : (
                                    t(LocaleKeys.profile_hoyolab_step_image_placeholder)
                                  )}
                                </div>
                              </div>
                            ) : null}
                          </StepperItem>
                        );
                      })}
                    </StepperNav>
                  </Stepper>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">
                      {t(LocaleKeys.profile_hoyolab_cancel_button)}
                    </Button>
                  </DialogClose>
                  <Button>
                    {t(LocaleKeys.profile_hoyolab_sync_submit_button)}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-10">
          {mockCharacters.map((character) => (
            <CharacterContainer
              key={`${character.name}-${character.element}`}
              {...character}
            />
          ))}
          <div className="w-full border border-dashed rounded-lg border-2 flex justify-center items-center hover:border-white/50 transition-colors bg-white/5 cursor-pointer">
            <Plus />
          </div>
        </div>
      </div>
    </div>
  );
}
