import { forwardRef, useId, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;
    const describedBy =
      [helperText ? helperId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy}
          className={`w-full px-3 py-2 border rounded-lg text-sm bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:border-indigo-500 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:focus:border-indigo-500 ${
            error
              ? "border-red-500 focus:ring-red-500/50 focus:border-red-500 dark:border-red-500"
              : "border-zinc-300"
          } ${className}`}
          {...props}
        />
        {helperText && (
          <p id={helperId} className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {helperText}
          </p>
        )}
        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
