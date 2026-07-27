import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-white rounded-xl border border-zinc-200/60 shadow-sm dark:bg-zinc-900/50 dark:border-zinc-800 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export function CardHeader({ children, className = "" }: CardProps) {
  return (
    <div className={`px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: CardProps) {
  return (
    <h3 className={`text-lg font-semibold text-zinc-900 dark:text-zinc-100 ${className}`}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = "" }: CardProps) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}
