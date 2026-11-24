import React from "react";
import { Button } from "./Button";

export function LoadingState({ message = "Loading data..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center" role="status">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-line border-t-brand-accent" />
      <p className="mt-3 text-sm text-brand-slate">{message}</p>
    </div>
  );
}

export function EmptyState({
  title = "No records found",
  description = "No items match your filter criteria or currently exist in this view.",
  actionLabel,
  onAction,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-dashed border-brand-line bg-surface-subtle/50">
      <h4 className="text-sm font-semibold text-brand-onyx">{title}</h4>
      <p className="mt-1 text-xs text-brand-slate max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({
  title = "Unable to load data",
  error = "An unexpected error occurred while communicating with services.",
  onRetry,
}: {
  title?: string;
  error?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-state-danger/30 bg-state-dangerBg">
      <h4 className="text-sm font-semibold text-state-danger">{title}</h4>
      <p className="mt-1 text-xs text-state-danger/80 max-w-sm">{error}</p>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry} className="mt-4">
          Retry
        </Button>
      )}
    </div>
  );
}

export function AccessDeniedState({
  title = "Access Restricted",
  description = "Your current role lacks authorization for this resource.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-brand-line bg-surface-card shadow-sm">
      <div className="h-10 w-10 rounded-full bg-state-warningBg text-state-warning flex items-center justify-center font-bold text-lg mb-3">
        !
      </div>
      <h3 className="text-base font-semibold text-brand-onyx">{title}</h3>
      <p className="mt-1 text-xs text-brand-slate max-w-sm">{description}</p>
    </div>
  );
}
