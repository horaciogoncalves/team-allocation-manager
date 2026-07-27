import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  title = "No items found",
  description = "Get started by adding your first item.",
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-zinc-100 dark:bg-zinc-800 rounded-full p-4 mb-4">
        <Inbox className="w-8 h-8 text-zinc-400 dark:text-zinc-500" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">{title}</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 max-w-sm">{description}</p>
      {action}
    </div>
  );
}
