import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/costs/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex gap-4">
			<div className="flex-1">Character Cost</div>
			<div>Cost Milestone</div>
		</div>
	);
}
