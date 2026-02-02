import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_userLayout")({
  component: RouteComponent,
});

function RouteComponent() {
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    root.classList.add("dark");
  }, []);

  return (
    <>
      <Outlet />
    </>
  );
}
