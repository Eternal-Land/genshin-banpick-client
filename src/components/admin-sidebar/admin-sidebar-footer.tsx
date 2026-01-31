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
} from "@/components/ui/dropdown-menu";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useTranslation } from "react-i18next";
import { SupportedLanguages } from "@/lib/constants";
import { GlobeIcon, LogOutIcon, UserIcon } from "lucide-react";

type AdminSidebarFooterProps = {
  profile: ProfileResponse | null;
  onLogout: () => void;
};

export default function AdminSidebarFooter({
  profile,
  onLogout,
}: AdminSidebarFooterProps) {
  const { t, i18n } = useTranslation();

  return (
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
              <DropdownMenuLabel>{t("admin_account_label")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserIcon className="size-4" /> {t("admin_profile_label")}
              </DropdownMenuItem>
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
  );
}
