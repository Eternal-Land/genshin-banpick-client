import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import {
	Sidebar,
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { store } from "@/lib/redux";
import { AccountRole } from "@/lib/constants";
import { authApi } from "@/apis/auth";
import { useAppSelector } from "@/hooks/use-app-selector";
import AdminSidebarContent from "@/components/admin-sidebar/admin-sidebar-content";
import AdminSidebarFooter from "@/components/admin-sidebar/admin-sidebar-footer";
import { useTranslation } from "react-i18next";
import { getTranslationToken } from "@/i18n/namespaces";
import { adminLocaleKeys } from "@/i18n/keys";

export const Route = createFileRoute("/admin")({
	component: RouteComponent,
	beforeLoad: async () => {
		const { profile } = store.getState().auth;
		if (!profile) {
			throw redirect({
				to: "/auth/login",
			});
		}

		if (profile.role != AccountRole.ADMIN && profile.role != AccountRole.STAFF) {
			throw redirect({
				to: "/",
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
				<AdminSidebarFooter profile={profile!} onLogout={authApi.logout} />
			</Sidebar>
			<SidebarInset className="max-w-full overflow-x-hidden">
				<header className="flex h-14 items-center gap-2 border-b px-4">
					<SidebarTrigger />
					<div className="text-sm font-medium">
						{t(
							getTranslationToken("admin", adminLocaleKeys.admin_sidebar_label),
						)}
					</div>
				</header>
				<div className="flex-1 max-w-full overflow-x-hidden p-4">
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
