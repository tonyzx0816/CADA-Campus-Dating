import { Card, CardContent } from "@components/ui/card";
import React from "react";
import { cn } from "@lib/utils";

const TextBubbleRight = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    return (
        <div className="flex flex-col items-end">
            <Card
                ref={ref}
                className={cn(
                    "bg-purple-500 text-white rounded-2xl max-w-xs mt-2 break-words overflow-hidden",
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

TextBubbleRight.displayName = "TextBubbleRight";

export { TextBubbleRight };
