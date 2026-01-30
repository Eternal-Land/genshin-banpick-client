import { useTranslation } from "react-i18next";
import type { StaffRoleResonse } from "@/apis/staff-roles/types";
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

export interface StaffRoleToggleDialogProps {
  staffRole: StaffRoleResonse | null;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function StaffRoleToggleDialog({
  staffRole,
  isPending,
  onConfirm,
  onCancel,
}: StaffRoleToggleDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={Boolean(staffRole)}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {staffRole?.isActive
              ? t(LocaleKeys.staff_roles_confirm_deactivate_title)
              : t(LocaleKeys.staff_roles_confirm_activate_title)}
          </DialogTitle>
          <DialogDescription>
            {staffRole?.isActive
              ? t(LocaleKeys.staff_roles_confirm_deactivate_desc, {
                  name: staffRole.name,
                })
              : t(LocaleKeys.staff_roles_confirm_activate_desc, {
                  name: staffRole?.name,
                })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t(LocaleKeys.staff_roles_cancel)}
          </Button>
          <Button
            type="button"
            variant={staffRole?.isActive ? "destructive" : "secondary"}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending
              ? t(LocaleKeys.staff_roles_update_pending)
              : staffRole?.isActive
                ? t(LocaleKeys.staff_roles_deactivate)
                : t(LocaleKeys.staff_roles_activate)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
