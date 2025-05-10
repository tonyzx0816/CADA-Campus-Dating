import { Card, CardContent } from "@components/ui/card";
import React from "react";
import { cn } from "@lib/utils";

const TextBubbleLeft = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    return (
        <div className="flex flex-col items-start">
            <Card
                ref={ref}
                className={cn(
                    "bg-gray-200 text-black rounded-2xl max-w-xs mt-2 break-words overflow-hidden",
                    className
                )}
                {...props}
            >
                <CardContent className="whitespace-pre-wrap p-3 text-sm">
                    {children}
                </CardContent>
            </Card>
        </div>
    );
});

TextBubbleLeft.displayName = "TextBubbleLeft";

export { TextBubbleLeft };
