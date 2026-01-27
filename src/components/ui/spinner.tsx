import { Loader2Icon, RefreshCcwIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

function RefreshSpinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <RefreshCcwIcon
      role="status"
      aria-label="Refreshing"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner, RefreshSpinner };
