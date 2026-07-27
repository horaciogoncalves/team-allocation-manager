"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "./button";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element): element is HTMLElement => {
      if (!(element instanceof HTMLElement)) return false;
      if (element.hasAttribute("disabled")) return false;
      const tabIndex = element.getAttribute("tabindex");
      if (tabIndex && Number.parseInt(tabIndex, 10) < 0) return false;
      return true;
    }
  );
}

function trapFocus(event: KeyboardEvent, container: HTMLElement) {
  const focusable = getFocusableElements(container);
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey) {
    if (document.activeElement === first || !container.contains(document.activeElement)) {
      event.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last || !container.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    }
  }
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
  triggerRef,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = getFocusableElements(dialog);
    const focusTarget =
      focusable.find((el) => el.dataset.autoFocus === "true") ??
      focusable.find((el) => el.getAttribute("type") === "button") ??
      focusable[0];
    focusTarget?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key === "Tab") {
        trapFocus(event, dialog);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  useEffect(() => {
    if (!isOpen && triggerRef?.current) {
      triggerRef.current.focus();
    }
  }, [isOpen, triggerRef]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900 dark:border dark:border-zinc-800"
      >
        <h2 id={titleId} className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            data-auto-focus="true"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
