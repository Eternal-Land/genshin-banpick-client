import { useMemo, useState } from "react";
import type { ProfileResponse } from "@/apis/self/types";
import { authApi } from "@/apis/auth";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProfileDialog from "@/components/profile-dialog";
import { useTranslation } from "react-i18next";
import { AccountRole, LocaleKeys, SupportedLanguages } from "@/lib/constants";
import { Globe, LogOutIcon, UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type HeaderNavigationProps = {
  profile: ProfileResponse;
};

const getInitials = (name?: string) => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  return parts
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

export default function HeaderNavigation({ profile }: HeaderNavigationProps) {
  const { t, i18n } = useTranslation();
  const { location } = useRouterState();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  const openProfileDialog = () => {
    setIsProfileDialogOpen(true);
  };

  const tabs = useMemo(() => {
    const navigationItems = [
      {
        to: "/match",
        label: t(LocaleKeys.header_nav_match),
        isActive: location.pathname.startsWith("/match"),
      },
      {
        to: profile.role === AccountRole.USER ? "/profile" : "/admin",
        label:
          profile.role === AccountRole.USER
            ? t(LocaleKeys.header_nav_profile)
            : t(LocaleKeys.header_nav_admin),
        isActive:
          profile.role === AccountRole.USER
            ? location.pathname.startsWith("/profile")
            : location.pathname.startsWith("/admin"),
      },
    ];

    return navigationItems;
  }, [location.pathname, profile.role, t]);

  const languageOptions = useMemo(
    () =>
      SupportedLanguages.map(({ code, label }) => ({
        value: code,
        label,
      })),
    [],
  );

  return (
    <header className="fixed inset-x-0 top-0 z-20 border-b border-white/10 bg-black/20 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-3 rounded px-2 py-1 transition hover:bg-white/10"
            >
              <Avatar className="size-9 rounded-full">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback>
                  {getInitials(profile.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col md:flex items-start">
                <span className="text-sm font-semibold text-white">
                  {profile.displayName}
                </span>
                <span className="text-xs text-white/70">
                  UID: {profile.ingameUuid}
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-48">
            <DropdownMenuLabel>{profile.displayName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={openProfileDialog}>
              <UserIcon className="size-4" />
              {t(LocaleKeys.profile_view_option)}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Globe />
                {t(LocaleKeys.admin_language_label)}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={i18n.language}
                  onValueChange={(value) => i18n.changeLanguage(value)}
                >
                  {languageOptions.map((option) => (
                    <DropdownMenuRadioItem
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={authApi.logout}>
              <LogOutIcon className="size-4" />
              {t(LocaleKeys.admin_logout_label)}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ProfileDialog
          profile={profile}
          open={isProfileDialogOpen}
          onOpenChange={setIsProfileDialogOpen}
        />

        <nav className="flex items-center gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                tab.isActive
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:text-white",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

      </div>
    </header>
  );
}
