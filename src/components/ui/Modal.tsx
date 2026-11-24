import { cn } from "@/lib/utils";
import type React from "react";
import { useEffect } from "react";
import { Button } from "./Button";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div
        className={cn(
          "w-full rounded-lg border border-brand-line bg-surface-card shadow-modal p-6 relative flex flex-col max-h-[90vh] overflow-hidden",
          widthStyles[maxWidth],
        )}
      >
        <div className="flex items-start justify-between pb-3 border-b border-brand-line">
          <div>
            <h3 id="modal-title" className="text-base font-semibold text-brand-onyx">
              {title}
            </h3>
            {description && <p className="text-xs text-brand-slate mt-0.5">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-brand-slate hover:text-brand-onyx rounded-md p-1 focus:outline-none"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className="py-4 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="pt-3 border-t border-brand-line flex justify-end gap-2">{footer}</div>
        )}
      </div>
    </div>
  );
}
