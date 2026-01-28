import { useEffect } from "react";
import {
  GlobeIcon,
  MenuIcon,
  MonitorIcon,
  MoonIcon,
  PaletteIcon,
  SunIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAppDispatch } from "@/hooks/use-app-dispatch";
import { useAppSelector } from "@/hooks/use-app-selector";
import {
  selectThemeMode,
  setThemeMode,
  type ThemeMode,
} from "@/lib/redux/theme.slice";
import { useTranslation } from "react-i18next";
import { SupportedLanguages } from "@/lib/constants";

export default function FixedMenu() {
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector(selectThemeMode);
  const { i18n } = useTranslation();

  const language = i18n.language.startsWith("vi") ? "vi" : "en";

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
    <div className="absolute bottom-10 right-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon-lg">
            <MenuIcon className="size-5" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <PaletteIcon className="size-4" /> Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={themeMode}
                  onValueChange={(value) => handleSetTheme(value as ThemeMode)}
                >
                  <DropdownMenuRadioItem value="system">
                    <MonitorIcon className="size-4" /> System
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="light">
                    <SunIcon className="size-4" /> Light
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">
                    <MoonIcon className="size-4" /> Dark
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <GlobeIcon className="size-4" /> Language
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={language}
                  onValueChange={(value) => i18n.changeLanguage(value)}
                >
                  {SupportedLanguages.map(({ code, label }) => (
                    <DropdownMenuRadioItem key={code} value={code}>
                      {label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
