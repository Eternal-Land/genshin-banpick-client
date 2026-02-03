import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SupportedLanguages } from "@/lib/constants";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { GlobeIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_userLayout/auth")({
  component: RouteComponent,
});

function RouteComponent() {
  const { i18n } = useTranslation();

  return (
    <>
      <main className="min-h-screen bg-muted/30 bg-transparent">
        <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </main>

      <div className="absolute bottom-10 right-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon-lg">
              <GlobeIcon className="size-5" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent>
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
