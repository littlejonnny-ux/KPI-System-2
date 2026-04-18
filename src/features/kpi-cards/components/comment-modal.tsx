"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CommentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
  title?: string;
  initialValue?: string;
  required?: boolean;
  isPending?: boolean;
}

export function CommentModal({
  open,
  onClose,
  onSubmit,
  title = "Комментарий",
  initialValue = "",
  required = false,
  isPending = false,
}: CommentModalProps) {
  const [value, setValue] = useState(initialValue);

  function handleSubmit() {
    if (required && !value.trim()) return;
    onSubmit(value.trim());
    setValue("");
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setValue(initialValue);
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="modal-comment">
            {required ? "Комментарий (обязательно)" : "Комментарий"}
          </Label>
          <Textarea
            id="modal-comment"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            placeholder="Введите комментарий…"
            data-testid="comment-textarea"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || (required && !value.trim())}
            data-testid="comment-submit"
          >
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
