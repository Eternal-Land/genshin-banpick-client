import { memo, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

export type CostInputCellProps = {
  costId: number;
  value?: number;
  onCommit: (costId: number, value: number) => void;
};

function CostInputCell({ costId, value, onCommit }: CostInputCellProps) {
  const [localValue, setLocalValue] = useState(value != null ? String(value) : "");

  useEffect(() => {
    setLocalValue(value != null ? String(value) : "");
  }, [value]);

  const handleBlur = () => {
    const trimmed = localValue.trim();
    const currentValue = value != null ? value : null;

    if (trimmed === "") {
      setLocalValue(currentValue != null ? String(currentValue) : "");
      return;
    }

    const parsed = Number(trimmed);
    if (Number.isNaN(parsed) || parsed < 0) {
      setLocalValue(currentValue != null ? String(currentValue) : "");
      return;
    }

    if (currentValue !== null && parsed === currentValue) {
      return;
    }

    onCommit(costId, parsed);
  };

  return (
    <Input
      className="w-15"
      inputMode="decimal"
      value={localValue}
      onChange={(event) => setLocalValue(event.target.value)}
      onBlur={handleBlur}
    />
  );
}

export default memo(CostInputCell);
