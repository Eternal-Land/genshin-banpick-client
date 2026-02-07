import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
	BriefcaseIcon,
	ChartScatterIcon,
	ContactIcon,
	HouseIcon,
	SparklesIcon,
	SwordIcon,
	UsersIcon,
	WrenchIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { LocaleKeys } from "@/lib/constants";

type AdminSidebarRoute = {
	to: string;
	label: string;
	icon: ReactNode;
};

const adminRoutes: AdminSidebarRoute[] = [
	{
		to: "/admin",
		label: LocaleKeys.admin_sidebar_dashboard,
		icon: <HouseIcon className="size-4" />,
	},
	{
		to: "/admin/permissions",
		label: LocaleKeys.admin_sidebar_permissions,
		icon: <WrenchIcon className="size-4" />,
	},
	{
		to: "/admin/staff-roles",
		label: LocaleKeys.admin_sidebar_staff_roles,
		icon: <BriefcaseIcon className="size-4" />,
	},
	{
		to: "/admin/staffs",
		label: LocaleKeys.admin_sidebar_staffs,
		icon: <ContactIcon className="size-4" />,
	},
	{
		to: "/admin/users",
		label: LocaleKeys.admin_sidebar_users,
		icon: <UsersIcon className="size-4" />,
	},
	{
		to: "/admin/characters",
		label: LocaleKeys.admin_sidebar_characters,
		icon: <SparklesIcon className="size-4" />,
	},
	{
		to: "/admin/weapons",
		label: LocaleKeys.admin_sidebar_weapons,
		icon: <SwordIcon className="size-4" />,
	},
	{
		to: "/admin/costs",
		label: LocaleKeys.admin_sidebar_character_costs,
		icon: <ChartScatterIcon className="size-4" />,
	},
];

export default function AdminSidebarContent() {
	const { t } = useTranslation();
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});

	const isRouteActive = (to: string) => {
		if (to === "/admin") {
			return pathname === "/admin";
		}

		return pathname.startsWith(to);
	};

	return (
		<SidebarContent>
			<SidebarGroup>
				<SidebarGroupLabel>{t("admin_sidebar_label")}</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
						{adminRoutes.map((route) => (
							<SidebarMenuItem key={route.to}>
								<SidebarMenuButton asChild isActive={isRouteActive(route.to)}>
									<Link to={route.to}>
										{route.icon} {t(route.label)}
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
		</SidebarContent>
	);
}
