import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { store } from "@/lib/redux";
import { AccountRole, LocaleKeys } from "@/lib/constants";
import { authApi } from "@/apis/auth";
import { useAppSelector } from "@/hooks/use-app-selector";
import AdminSidebarContent from "@/components/admin-sidebar/admin-sidebar-content";
import AdminSidebarFooter from "@/components/admin-sidebar/admin-sidebar-footer";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/admin")({
  component: RouteComponent,
  beforeLoad: async () => {
    const { profile } = store.getState().auth;
    if (!profile) {
      throw redirect({
        to: "/auth/login",
      });
    }

    if (profile.role != AccountRole.ADMIN) {
      throw redirect({
        to: "/user",
      });
    }
  },
});

function RouteComponent() {
  const { t } = useTranslation();
  const profile = useAppSelector((state) => state.auth.profile);

  return (
    <SidebarProvider>
      <Sidebar variant="inset">
        <AdminSidebarContent />
        <AdminSidebarFooter profile={profile} onLogout={authApi.logout} />
      </Sidebar>
      <SidebarInset className="max-w-full overflow-x-hidden">
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <div className="text-sm font-medium">
            {t(LocaleKeys.admin_sidebar_label)}
          </div>
        </header>
        <div className="flex-1 max-w-full overflow-x-hidden p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
