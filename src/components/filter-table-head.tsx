import { FilterIcon } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { TableHead } from "./ui/table";

export interface FilterTableHeadProps {
  label?: string;
  options?: {
    label: string;
    value: string;
  }[];
  multiSelect?: boolean;
  value?: string[];
  onValueChange?: (value: string[]) => void;
}

export default function FilterTableHead({
  label,
  options,
  multiSelect,
  value,
  onValueChange,
}: FilterTableHeadProps) {
  return (
    <TableHead>
      <div className="flex items-center">
        <p>{label}</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs">
              <FilterIcon />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            {multiSelect ? (
              <DropdownMenuGroup>
                {options?.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={value?.includes(option.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onValueChange?.([...(value ?? []), option.value]);
                      } else {
                        onValueChange?.(
                          (value ?? []).filter((v) => v !== option.value),
                        );
                      }
                    }}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            ) : (
              <DropdownMenuRadioGroup
                value={value?.[0]}
                onValueChange={(val) => onValueChange?.([val])}
              >
                {options?.map((option) => (
                  <DropdownMenuRadioItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TableHead>
  );
}
