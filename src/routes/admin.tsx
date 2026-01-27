import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { store } from "@/lib/redux";
import { ACCOUNT_ROLES } from "@/lib/constants";
import { authApi } from "@/apis/auth";
import { useAppSelector } from "@/hooks/use-app-selector";
import {
  BriefcaseIcon,
  ContactIcon,
  HouseIcon,
  WrenchIcon,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: RouteComponent,
  beforeLoad: async () => {
    const { profile } = store.getState().auth;
    if (!profile) {
      throw redirect({
        to: "/auth/login",
      });
    }

    if (profile.role != ACCOUNT_ROLES.ADMIN) {
      throw redirect({
        to: "/user",
      });
    }
  },
});

const adminRoutes = [
  {
    to: "/admin",
    label: "Dashboard",
    icon: <HouseIcon className="size-4" />,
  },
  {
    to: "/admin/permissions",
    label: "Permissions",
    icon: <WrenchIcon className="size-4" />,
  },
  {
    to: "/admin/staff-roles",
    label: "Staff Roles",
    icon: <BriefcaseIcon className="size-4" />,
  },
  {
    to: "/admin/staffs",
    label: "Staffs",
    icon: <ContactIcon className="size-4" />,
  },
];

function RouteComponent() {
  const profile = useAppSelector((state) => state.auth.profile);
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
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminRoutes.map((route, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuButton
                      asChild
                      isActive={isRouteActive(route.to)}
                    >
                      <Link to={route.to}>
                        {route.icon} {route.label}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="h-auto gap-3 py-2">
                    <Avatar className="size-8">
                      <AvatarFallback />
                    </Avatar>
                    <div className="flex min-w-0 flex-col text-left">
                      <span className="truncate text-sm font-medium leading-none">
                        {profile?.displayName ?? "Admin"}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        Admin
                      </span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="right" className="w-48">
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => authApi.logout()}
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="max-w-full overflow-x-hidden">
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <div className="text-sm font-medium">Admin</div>
        </header>
        <div className="flex-1 max-w-full overflow-x-hidden p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
