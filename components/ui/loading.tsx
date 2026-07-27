import { LoadingSpinner } from "@/components/ui/button";

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-zinc-500 dark:text-zinc-400">
      <LoadingSpinner className="w-8 h-8 mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
