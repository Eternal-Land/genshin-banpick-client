import { useTranslation } from "react-i18next";
import type { CharacterResponse } from "@/apis/characters/types";
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

export interface CharacterToggleDialogProps {
  character: CharacterResponse | null;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CharacterToggleDialog({
  character,
  isPending,
  onConfirm,
  onCancel,
}: CharacterToggleDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={Boolean(character)}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {character?.isActive
              ? t(LocaleKeys.characters_confirm_deactivate_title)
              : t(LocaleKeys.characters_confirm_activate_title)}
          </DialogTitle>
          <DialogDescription>
            {character?.isActive
              ? t(LocaleKeys.characters_confirm_deactivate_desc, {
                  name: character.name,
                })
              : t(LocaleKeys.characters_confirm_activate_desc, {
                  name: character?.name,
                })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t(LocaleKeys.characters_cancel)}
          </Button>
          <Button
            type="button"
            variant={character?.isActive ? "destructive" : "secondary"}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending
              ? t(LocaleKeys.characters_update_pending)
              : character?.isActive
                ? t(LocaleKeys.characters_deactivate)
                : t(LocaleKeys.characters_activate)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
