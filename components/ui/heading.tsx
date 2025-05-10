import React, {JSX, ReactNode} from 'react';
import { cn } from "@/lib/utils";

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

type HeadingProps = {
    level?: HeadingLevel;
    children: ReactNode;
    className?: string;
    emoji?: string;
    required?: boolean;
    error?: boolean;
    errorMessage?: string;
};

/**
 * Reusable Heading component that can be used for h1-h6 elements
 * with consistent styling and optional emoji, required indicator, and error messages.
 */
export function Heading({
                            level = 2,
                            children,
                            className,
                            emoji,
                            required = false,
                            error = false,
                            errorMessage
                        }: HeadingProps) {
    // Base styles for different heading levels
    const headingStyles = {
        1: "text-4xl font-bold",
        2: "text-2xl font-bold",
        3: "text-xl font-semibold",
        4: "text-lg font-semibold",
        5: "text-base font-medium",
        6: "text-sm font-medium",
    };

    // Choose the HTML tag based on level
    const Tag = `h${level}` as keyof JSX.IntrinsicElements;

    return (
        <div className="mb-2">
            <div className="flex items-center">
                <Tag
                    className={cn(
                        headingStyles[level],
                        error ? "text-red-600" : "",
                        className
                    )}
                >
                    {children} {emoji && <span>{emoji}</span>}
                </Tag>

                {required && (
                    <span className="text-red-500 ml-1 text-sm">*</span>
                )}

                {error && (
                    <div className="ml-2 flex items-center text-red-500">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4 mr-1"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span className="text-sm">
              {errorMessage || "Required"}
            </span>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Section Heading - Preset for level 2 headings with consistent styling for sections
 */
export function SectionHeading(props: Omit<HeadingProps, 'level'>) {
    return <Heading level={2} {...props} />;
}

/**
 * Page Heading - Preset for level 1 headings with consistent styling for page titles
 */
export function PageHeading(props: Omit<HeadingProps, 'level'>) {
    return <Heading level={1} className="mb-6" {...props} />;
}

export default Heading;