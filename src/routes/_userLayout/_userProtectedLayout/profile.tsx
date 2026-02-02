import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { selfApi } from "@/apis/self";
import { AccountRole, LocaleKeys } from "@/lib/constants";

import HeaderNavigation from "@/components/header-navigation";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_userLayout/_userProtectedLayout/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();

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
      {profile ? <HeaderNavigation profile={profile} /> : null}
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

      </div>
    </div>
  );
}
