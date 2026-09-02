import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type FieldMessageProps = { id?: string; error?: string; description?: string };

export function FieldMessage({ id, error, description }: FieldMessageProps) {
  if (!error && !description) return null;
  return (
    <p id={id} className={cn("mt-1.5 text-xs", error ? "text-danger" : "text-ink-muted")}>
      {error || description}
    </p>
  );
}

type LabelProps = { htmlFor: string; children: React.ReactNode; required?: boolean };

export function FieldLabel({ htmlFor, children, required }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold text-ink">
      {children}
      {required ? <span className="ml-1 text-danger" aria-hidden="true">*</span> : null}
    </label>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldMessageProps & { label?: string; required?: boolean };

export function Input({ id, label, error, description, className, required, ...props }: InputProps) {
  const messageId = `${id}-message`;
  return (
    <div>
      {label ? <FieldLabel htmlFor={id || "input"} required={required}>{label}</FieldLabel> : null}
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error || description ? messageId : undefined}
        className={cn(
          "min-h-11 w-full rounded-md border border-outline/70 bg-white px-3.5 text-sm text-ink placeholder:text-ink-muted/60 transition-colors",
          "focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/40 disabled:cursor-not-allowed disabled:bg-surface-low disabled:opacity-70",
          error && "border-danger focus:border-danger focus:ring-danger/20",
          className,
        )}
        required={required}
        {...props}
      />
      <FieldMessage id={messageId} error={error} description={description} />
    </div>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldMessageProps & { label?: string; required?: boolean };

export function Textarea({ id, label, error, description, className, required, ...props }: TextareaProps) {
  const messageId = `${id}-message`;
  return (
    <div>
      {label ? <FieldLabel htmlFor={id || "textarea"} required={required}>{label}</FieldLabel> : null}
      <textarea
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error || description ? messageId : undefined}
        className={cn(
          "min-h-28 w-full resize-y rounded-md border border-outline/70 bg-white px-3.5 py-3 text-sm text-ink placeholder:text-ink-muted/60 transition-colors",
          "focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/40 disabled:cursor-not-allowed disabled:bg-surface-low disabled:opacity-70",
          error && "border-danger focus:border-danger focus:ring-danger/20",
          className,
        )}
        required={required}
        {...props}
      />
      <FieldMessage id={messageId} error={error} description={description} />
    </div>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & FieldMessageProps & { label?: string; required?: boolean };

export function Select({ id, label, error, description, className, required, children, ...props }: SelectProps) {
  const messageId = `${id}-message`;
  return (
    <div>
      {label ? <FieldLabel htmlFor={id || "select"} required={required}>{label}</FieldLabel> : null}
      <select
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error || description ? messageId : undefined}
        className={cn(
          "min-h-11 w-full rounded-md border border-outline/70 bg-white px-3.5 text-sm text-ink transition-colors",
          "focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/40 disabled:cursor-not-allowed disabled:bg-surface-low disabled:opacity-70",
          error && "border-danger focus:border-danger focus:ring-danger/20",
          className,
        )}
        required={required}
        {...props}
      >
        {children}
      </select>
      <FieldMessage id={messageId} error={error} description={description} />
    </div>
  );
}
