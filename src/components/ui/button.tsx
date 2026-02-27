import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles shared by all variants
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0",
  {
    variants: {
      variant: {
        // ── Default: your teal→dark-teal gradient, coral on hover ──
        default:
          "btn-primary-green shadow-sm",

        // ── Destructive ──
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:opacity-90",

        // ── Outline: teal border, fills on hover ──
        outline:
          "border border-primary bg-transparent text-primary shadow-sm hover:bg-secondary hover:text-primary",

        // ── Secondary: your soft teal surface ──
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-accent",

        // ── Ghost: transparent, subtle teal hover ──
        ghost:
          "hover:bg-secondary hover:text-primary",

        // ── Link: teal underline style ──
        link:
          "text-primary underline-offset-4 hover:underline",

        // ── Highlight: coral/orange for CTAs ──
        highlight:
          "btn-highlight shadow-sm",

        // ── Muted: subtle gray for secondary table actions ──
        muted:
          "bg-muted text-muted-foreground border border-border shadow-sm hover:bg-secondary hover:text-primary",

        // ── Success: for positive actions ──
        success:
          "bg-success/10 text-success border border-success/20 shadow-sm hover:bg-success/20",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm:      "h-8 rounded-md px-3 text-xs has-[>svg]:px-2.5",
        lg:      "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon:    "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }