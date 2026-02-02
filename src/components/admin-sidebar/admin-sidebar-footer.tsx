import type { ProfileResponse } from "@/apis/self/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useTranslation } from "react-i18next";
import { LocaleKeys, SupportedLanguages } from "@/lib/constants";
import {
  GlobeIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  PaletteIcon,
  SunIcon,
  UserIcon,
} from "lucide-react";
import { useAppDispatch } from "@/hooks/use-app-dispatch";
import { useAppSelector } from "@/hooks/use-app-selector";
import {
  selectThemeMode,
  setThemeMode,
  type ThemeMode,
} from "@/lib/redux/theme.slice";
import { useEffect, useState } from "react";
import ProfileDialog from "../profile-dialog";

type AdminSidebarFooterProps = {
  profile: ProfileResponse;
  onLogout: () => void;
};

export default function AdminSidebarFooter({
  profile,
  onLogout,
}: AdminSidebarFooterProps) {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector(selectThemeMode);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const handleSetTheme = (mode: ThemeMode) => {
    window.localStorage.setItem("theme", mode);
    dispatch(setThemeMode(mode));
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (themeMode === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(themeMode);
  }, [themeMode]);

  return (
    <>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-auto gap-3 py-2">
                  <Avatar className="size-8">
                    <AvatarImage src={profile?.avatar} />
                    <AvatarFallback />
                  </Avatar>
                  <div className="flex min-w-0 flex-col text-left">
                    <span className="truncate text-sm font-medium leading-none">
                      {profile?.displayName ?? t("admin_user_fallback")}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {t("admin_role_label")}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="right" className="w-48">
                <DropdownMenuLabel>
                  {t("admin_account_label")}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setProfileDialogOpen(true)}>
                  <UserIcon className="size-4" /> {t("admin_profile_label")}
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <PaletteIcon className="size-4" />{" "}
                    {t(LocaleKeys.admin_theme_label)}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup
                        value={themeMode}
                        onValueChange={(value) =>
                          handleSetTheme(value as ThemeMode)
                        }
                      >
                        <DropdownMenuRadioItem value="system">
                          <MonitorIcon className="size-4" />{" "}
                          {t(LocaleKeys.admin_theme_system)}
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="light">
                          <SunIcon className="size-4" />{" "}
                          {t(LocaleKeys.admin_theme_light)}
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="dark">
                          <MoonIcon className="size-4" />{" "}
                          {t(LocaleKeys.admin_theme_dark)}
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <GlobeIcon className="size-4" /> {t("admin_language_label")}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={i18n.language}
                      onValueChange={(value) => i18n.changeLanguage(value)}
                    >
                      {SupportedLanguages.map(({ code, label }) => (
                        <DropdownMenuRadioItem key={code} value={code}>
                          {label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem variant="destructive" onClick={onLogout}>
                  <LogOutIcon className="size-4" /> {t("admin_logout_label")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <ProfileDialog
        profile={profile}
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
      />
    </>
  );
}
