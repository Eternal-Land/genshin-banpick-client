import { useTranslation } from "react-i18next";
import type { StaffResponse } from "@/apis/staffs/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LocaleKeys } from "@/lib/constants";

export interface StaffToggleDialogProps {
  staff: StaffResponse | null;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function StaffToggleDialog({
  staff,
  isPending,
  onConfirm,
  onCancel,
}: StaffToggleDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={Boolean(staff)}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {staff?.isActive
              ? t(LocaleKeys.staffs_confirm_deactivate_title)
              : t(LocaleKeys.staffs_confirm_activate_title)}
          </DialogTitle>
          <DialogDescription>
            {staff?.isActive
              ? t(LocaleKeys.staffs_confirm_deactivate_desc, {
                  name: staff.displayName,
                })
              : t(LocaleKeys.staffs_confirm_activate_desc, {
                  name: staff?.displayName,
                })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t(LocaleKeys.staffs_cancel)}
          </Button>
          <Button
            type="button"
            variant={staff?.isActive ? "destructive" : "secondary"}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending
              ? t(LocaleKeys.staffs_update_pending)
              : staff?.isActive
                ? t(LocaleKeys.staffs_deactivate)
                : t(LocaleKeys.staffs_activate)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
