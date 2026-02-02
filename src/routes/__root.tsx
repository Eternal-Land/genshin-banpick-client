import { selfApi } from "@/apis/self";
import PlayerSideBackground from "@/components/player-side/background";
import Providers from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { store } from "@/lib/redux";
import { setProfile } from "@/lib/redux/auth.slice";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createRootRoute({
  component: RootComponent,
  beforeLoad: async () => {
    const { profile } = store.getState().auth;
    if (!profile) {
      try {
        const response = await selfApi.getSelf();
        const fetchedProfile = response.data;
        store.dispatch(setProfile(fetchedProfile!));
      } catch (err) {
        console.log("Fetch profile failed in root route:", err);
      }
    }
  },
});

function RootComponent() {
    const themeMode = store.getState().theme.mode;

  useEffect(() => {    
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    root.classList.add("dark");
  }, [themeMode])
  
  return (
    <Providers>
      <Outlet />
      <Toaster position="top-center" richColors/>
      <PlayerSideBackground/>
    </Providers>
  );
}
