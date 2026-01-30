import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PlayerSideButtonProps = React.ComponentProps<typeof Button>;

const PlayerSideButton = React.forwardRef<
	React.ElementRef<typeof Button>,
  PlayerSideButtonProps
>(({ className, size = "lg", variant = "secondary", ...props }, ref) => {
	return (
		<Button
			ref={ref}
			size={size}
			variant={variant}
			className={cn(
				"h-11 rounded-xl border border-white/15 bg-white/10 px-6 text-white shadow-sm backdrop-blur-md transition hover:bg-white/20 active:bg-white/25",
				"focus-visible:ring-2 focus-visible:ring-white/50",
				className
			)}
			{...props}
		/>
	);
});

PlayerSideButton.displayName = "PlayerSideButton";

export default PlayerSideButton;
