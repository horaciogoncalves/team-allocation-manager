import { forwardRef, useId, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: { value: string; label: string }[];
  showEmptyOption?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, error, options, className = "", id, showEmptyOption = true, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const helperId = `${selectId}-helper`;
    const errorId = `${selectId}-error`;
    const describedBy =
      [helperText ? helperId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy}
          className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:border-indigo-500 bg-white dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:focus:border-indigo-500 ${
            error
              ? "border-red-500 focus:ring-red-500/50 focus:border-red-500 dark:border-red-500"
              : "border-zinc-300"
          } ${className}`}
          {...props}
        >
          {showEmptyOption && <option value="">Select...</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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

Select.displayName = "Select";
