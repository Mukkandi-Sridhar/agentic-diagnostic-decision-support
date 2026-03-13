import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
};

export function buttonVariants(variant: "default" | "outline" | "ghost" = "default", className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition",
    variant === "default" && "bg-accent text-white shadow-clinical hover:bg-teal-700",
    variant === "outline" && "border border-border bg-white text-foreground hover:bg-slate-50",
    variant === "ghost" && "text-foreground hover:bg-slate-100",
    className
  );
}

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  return <button suppressHydrationWarning className={buttonVariants(variant, className)} {...props} />;
}
