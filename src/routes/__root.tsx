import { selfApi } from "@/apis/self";
import Providers from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { store } from "@/lib/redux";
import { setProfile } from "@/lib/redux/auth.slice";
import { Outlet, createRootRoute } from "@tanstack/react-router";

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
  return (
    <Providers>
      <Outlet />
      <Toaster position="top-center" />
    </Providers>
  );
}
