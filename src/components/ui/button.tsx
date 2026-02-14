import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-medium hover:shadow-strong hover:shadow-primary/15 relative overflow-hidden before:absolute before:inset-0 before:bg-[linear-gradient(135deg,hsl(0_0%_100%/0.08)_0%,transparent_50%)] before:pointer-events-none",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-medium hover:shadow-strong hover:shadow-destructive/20",
        outline: "border border-input bg-background hover:bg-accent/5 hover:text-accent-foreground hover:border-accent/30 transition-colors",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-soft hover:shadow-medium",
        ghost: "hover:bg-accent/8 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "bg-gradient-to-r from-accent via-accent/90 to-accent bg-[length:200%_auto] text-accent-foreground hover:bg-right shadow-strong hover:shadow-elevated hover:shadow-accent/20 relative overflow-hidden before:absolute before:inset-0 before:bg-[linear-gradient(135deg,hsl(0_0%_100%/0.12)_0%,transparent_50%)] before:pointer-events-none",
        glow: "bg-accent text-accent-foreground shadow-[0_0_24px_hsl(var(--accent)/0.3)] hover:shadow-[0_0_40px_hsl(var(--accent)/0.5)] relative overflow-hidden before:absolute before:inset-0 before:bg-[linear-gradient(135deg,hsl(0_0%_100%/0.1)_0%,transparent_50%)] before:pointer-events-none",
        metallic: "bg-gradient-to-b from-secondary to-muted text-foreground border border-border/60 shadow-medium hover:shadow-strong relative overflow-hidden before:absolute before:inset-0 before:bg-[linear-gradient(135deg,hsl(0_0%_100%/0.06)_0%,transparent_40%,transparent_60%,hsl(0_0%_100%/0.03)_100%)] before:pointer-events-none hover:border-accent/20",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-md px-3.5",
        lg: "h-11 rounded-lg px-8",
        xl: "h-14 rounded-xl px-10 text-base font-semibold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
