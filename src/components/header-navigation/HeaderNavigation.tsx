import { useEffect, useMemo, useState } from "react";
import type { ProfileResponse } from "@/apis/self/types";
import { authApi } from "@/apis/auth";
import { selfApi } from "@/apis/self";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import {
  AccountRole,
  LocaleKeys,
  SupportedLanguages,
} from "@/lib/constants";
import { useAppDispatch } from "@/hooks/use-app-dispatch";
import { useAppSelector } from "@/hooks/use-app-selector";
import { setProfile } from "@/lib/redux/auth.slice";
import {
  selectThemeMode,
  setThemeMode,
  type ThemeMode,
} from "@/lib/redux/theme.slice";
import {
  GlobeIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  PaletteIcon,
  SunIcon,
  UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { updateProfileSchema, type UpdateProfileInput } from "@/apis/self/types";
import { useMutation } from "@tanstack/react-query";
import { AxiosError, type AxiosProgressEvent } from "axios";
import type { BaseApiResponse } from "@/lib/types";
import { filesApi } from "@/apis/files";
import { toast } from "sonner";

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
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector(selectThemeMode);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [fileNeedUpload, setFileNeedUpload] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      displayName: "",
      ingameUuid: "",
      avatar: undefined,
    },
  });

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

  useEffect(() => {
    form.reset({
      displayName: profile.displayName ?? "",
      ingameUuid: profile.ingameUuid ?? "",
      avatar: profile.avatar ?? undefined,
    });
  }, [form, profile.avatar, profile.displayName, profile.ingameUuid]);

  const handleUploadProgress = (event: AxiosProgressEvent) => {
    setProgress((event.progress ?? 0) * 100);
  };

  const handleOnFilesChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files.item(0)!;
    setFileNeedUpload(file);
  };

  const updateMutation = useMutation<
    BaseApiResponse,
    AxiosError<BaseApiResponse>,
    UpdateProfileInput
  >({
    mutationFn: async (input) => {
      if (fileNeedUpload) {
        const uploadResult = await filesApi.uploadFile(
          fileNeedUpload,
          handleUploadProgress,
        );
        input.avatar = uploadResult.secure_url;
      }

      return selfApi.updateProfile(input);
    },
    onSuccess: async () => {
      toast.success(t(LocaleKeys.profile_update_success));
      setErrorMsg(null);
      setFileNeedUpload(null);
      setProgress(0);
      setIsProfileDialogOpen(false);
      const response = await selfApi.getSelf();
      dispatch(setProfile(response.data ?? null));
    },
    onError: (error) => {
      setErrorMsg(
        error.response?.data.message || t(LocaleKeys.profile_update_error),
      );
    },
  });

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

  const themeOptions = useMemo(
    () => [
      {
        value: "system" as const,
        label: t(LocaleKeys.admin_theme_system),
        icon: MonitorIcon,
      },
      {
        value: "light" as const,
        label: t(LocaleKeys.admin_theme_light),
        icon: SunIcon,
      },
      {
        value: "dark" as const,
        label: t(LocaleKeys.admin_theme_dark),
        icon: MoonIcon,
      },
    ],
    [t],
  );

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
                <AvatarFallback>{getInitials(profile.displayName)}</AvatarFallback>
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
            <DropdownMenuItem variant="destructive" onClick={authApi.logout}>
              <LogOutIcon className="size-4" />
              {t(LocaleKeys.admin_logout_label)}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
          <DialogContent className="bg-black text-white">
            <DialogHeader>
              <DialogTitle>{t(LocaleKeys.profile_update_title)}</DialogTitle>
              <DialogDescription className="text-white/70">
                {t(LocaleKeys.profile_description)}
              </DialogDescription>
            </DialogHeader>
            <form
              id="header-profile-form"
              onSubmit={form.handleSubmit((values) =>
                updateMutation.mutate(values),
              )}
            >
              <FieldGroup className="grid gap-6">
                <Controller
                  name="avatar"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        {t(LocaleKeys.profile_avatar_label)}
                      </FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        type="hidden"
                        disabled={updateMutation.isPending}
                      />
                      <Input
                        type="file"
                        accept="image/*"
                        className="text-muted-foreground file:border-input file:text-foreground p-0 pr-3 italic file:mr-3 file:h-full file:border-0 file:border-r file:border-solid file:bg-transparent file:px-3 file:text-sm file:font-medium file:not-italic"
                        onChange={(event) =>
                          handleOnFilesChange(event.target.files)
                        }
                        disabled={updateMutation.isPending}
                      />
                      {progress ? <Progress value={progress} /> : null}
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="displayName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        {t(LocaleKeys.profile_display_name_label)}
                      </FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        placeholder={t(
                          LocaleKeys.profile_display_name_placeholder,
                        )}
                        disabled={updateMutation.isPending}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="ingameUuid"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        {t(LocaleKeys.profile_ingame_uid_label)}
                      </FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        placeholder={t(
                          LocaleKeys.profile_ingame_uid_placeholder,
                        )}
                        inputMode="numeric"
                        disabled={updateMutation.isPending}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Field>
                  <FieldLabel>{t(LocaleKeys.profile_email_label)}</FieldLabel>
                  <Input value={profile.email ?? ""} disabled />
                </Field>
              </FieldGroup>
            </form>
            <DialogFooter className="items-center">
              {updateMutation.isError && errorMsg ? (
                <span className="text-sm text-destructive">
                  {errorMsg}
                </span>
              ) : null}
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProfileDialogOpen(false)}
                className="border-white/30 text-white hover:bg-white/10"
              >
                {t(LocaleKeys.profile_dialog_close)}
              </Button>
              <Button
                type="submit"
                form="header-profile-form"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending
                  ? t(LocaleKeys.profile_saving)
                  : t(LocaleKeys.profile_save_changes)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <PaletteIcon className="size-4" />
                <span className="sr-only">
                  {t(LocaleKeys.admin_theme_label)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>
                {t(LocaleKeys.admin_theme_label)}
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={themeMode}
                onValueChange={(value) => handleSetTheme(value as ThemeMode)}
              >
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <DropdownMenuRadioItem key={option.value} value={option.value}>
                      <Icon className="size-4" />
                      {option.label}
                    </DropdownMenuRadioItem>
                  );
                })}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <GlobeIcon className="size-4" />
                <span className="sr-only">
                  {t(LocaleKeys.admin_language_label)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>
                {t(LocaleKeys.admin_language_label)}
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={i18n.language}
                onValueChange={(value) => i18n.changeLanguage(value)}
              >
                {languageOptions.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
