import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
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
import { store } from "@/lib/redux";
import { ACCOUNT_ROLES } from "@/lib/constants";
import { authApi } from "@/apis/auth";

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

function RouteComponent() {
  return (
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/admin">Dashboard</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="text-destructive"
                    onClick={() => authApi.logout()}
                  >
                    Logout
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <div className="text-sm font-medium">Admin</div>
        </header>
        <div className="flex-1 p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
