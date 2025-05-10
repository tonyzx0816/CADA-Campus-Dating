import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground shadow hover:bg-primary/90",
                destructive:
                    "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
                outline:
                    "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
                secondary:
                    "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
                // New variants
                purple:
                    "bg-purple-600 text-white shadow hover:bg-purple-700",
                white:
                    "bg-white text-gray-800 border border-gray-300 shadow-sm hover:bg-gray-100",
                hobby:
                    "px-4 py-2 rounded-full border transition-colors bg-white text-gray-800 border-gray-300 hover:border-purple-300",
                hobbySelected:
                    "px-4 py-2 rounded-full border transition-colors bg-purple-600 text-white border-purple-600",
            },
            size: {
                default: "h-9 px-4 py-2",
                sm: "h-8 rounded-md px-3 text-xs",
                lg: "h-10 rounded-md px-8",
                icon: "h-9 w-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

// Specialized button components with pre-defined variants
const Button1 = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
    (props, ref) => <Button variant="purple" {...props} ref={ref} />
)
Button1.displayName = "Button1"

const Button2 = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
    (props, ref) => <Button variant="white" {...props} ref={ref} />
)
Button2.displayName = "Button2"

// Hobby selection button that handles selected/unselected state
interface Button3Props extends Omit<ButtonProps, 'variant'> {
    isSelected?: boolean;
}

const Button3 = React.forwardRef<HTMLButtonElement, Button3Props>(
    ({ isSelected = false, ...props }, ref) => (
        <Button
            variant={isSelected ? "hobbySelected" : "hobby"}
            {...props}
            ref={ref}
        />
    )
)
Button3.displayName = "Button3"

export { Button, Button1, Button2, Button3, buttonVariants }