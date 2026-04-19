"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface PasswordModalProps {
  open: boolean;
  onClose: () => void;
  password: string;
  participantEmail: string;
  mode: "created" | "reset";
}

export function PasswordModal({
  open,
  onClose,
  password,
  participantEmail,
  mode,
}: PasswordModalProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const title =
    mode === "created" ? "Участник создан" : "Пароль сброшен";
  const description =
    mode === "created"
      ? `Учётная запись для ${participantEmail} создана. Сохраните временный пароль — он отображается только один раз.`
      : `Пароль для ${participantEmail} сброшен. Сохраните новый пароль — он отображается только один раз.`;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md" data-testid="password-modal">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-primary/40 bg-primary/5 p-4">
          <p className="mb-2 text-xs text-muted-foreground">Временный пароль</p>
          <div className="flex items-center gap-2">
            <code
              className="flex-1 break-all font-mono text-sm text-primary"
              data-testid="temp-password-value"
            >
              {password}
            </code>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopy}
              data-testid="copy-password-btn"
              aria-label="Скопировать пароль"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <Button
          type="button"
          className="mt-2 w-full"
          onClick={onClose}
          data-testid="password-modal-close-btn"
        >
          Понятно, сохранил
        </Button>
      </DialogContent>
    </Dialog>
  );
}
