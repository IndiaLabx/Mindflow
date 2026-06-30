import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { cn } from '../../utils/cn';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

/**
 * A unified Markdown renderer that supports:
 * - Standard Markdown (lists, bold, italics, tables via GFM)
 * - Raw HTML (e.g. <pre>, <br>, <b>)
 * - LaTeX Math (inline $x$ and block $$x$$) via KaTeX
 *
 * It automatically applies Tailwind prose styles and safely parses HTML.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
    return (
        <div className={cn(
            "prose prose-sm md:prose-base max-w-none break-words",
            "dark:prose-invert",
            // Inheriting fonts directly for seamless integration with Quiz UI
            "font-inherit",
            className
        )}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
                // @ts-ignore - rehypeRaw types can sometimes mismatch, but it works correctly
                rehypePlugins={[rehypeRaw, rehypeKatex]}
                components={{
                    // Override default margins from prose to make it blend better in tight UI spaces
                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                    pre: ({ node, ...props }) => (
                        <pre
                            className="whitespace-pre-wrap font-inherit my-2 bg-gray-50 dark:bg-gray-900 p-2 rounded-md border border-gray-200 dark:border-gray-700"
                            {...props}
                        />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};
