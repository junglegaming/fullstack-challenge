import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "neon-green" | "neon-red";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95";

    const variants: Record<string, string> = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline:
        "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
      "neon-green":
        "bg-[#00ff88] text-black font-bold shadow-[0_0_15px_rgba(0,255,136,0.6),0_0_30px_rgba(0,255,136,0.3)] hover:shadow-[0_0_20px_rgba(0,255,136,0.8),0_0_40px_rgba(0,255,136,0.5),0_0_60px_rgba(0,255,136,0.3)] hover:-translate-y-0.5",
      "neon-red":
        "bg-[#ff0055] text-white font-bold shadow-[0_0_15px_rgba(255,0,85,0.6),0_0_30px_rgba(255,0,85,0.3)] hover:shadow-[0_0_20px_rgba(255,0,85,0.8),0_0_40px_rgba(255,0,85,0.5),0_0_60px_rgba(255,0,85,0.3)] hover:-translate-y-0.5",
    };

    const sizes: Record<string, string> = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    };

    return (
      <button
        className={cn(base, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
export { Button };
