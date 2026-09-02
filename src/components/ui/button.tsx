import type { ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-lime text-lime-foreground hover:bg-lime/85",
  secondary: "border border-outline bg-white text-ink hover:bg-surface-low",
  ghost: "text-ink-muted hover:bg-surface-container hover:text-ink",
  danger: "bg-danger text-white hover:bg-danger/90",
};

export function Button({ className, variant = "primary", loading, disabled, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2",
        variants[variant],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
