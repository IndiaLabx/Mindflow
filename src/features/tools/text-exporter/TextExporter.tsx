import React, { useState, useEffect, useMemo } from 'react';
import MarkdownIt from 'markdown-it';
import rehypeRaw from 'rehype-raw';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, FileCode, File, Eye, Edit3, Settings } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useNotification } from '../../../stores/useNotificationStore';

const DEFAULT_TEMPLATE = `# Welcome to Text Exporter

This is a robust **Markdown** and text editor. You can write your content here and instantly preview it.

## Features

* **Rich Text**: Write *italics*, **bold**, or \`inline code\`.
* **Lists**: Like this bulleted list!
* **Code Highlight**:
\`\`\`javascript
function helloWorld() {
  console.log("Hello, Exporter!");
}
\`\`\`
* **Export**: Download as \`.txt\`, \`.md\`, or fully rendered \`.html\`.

> "The secret to getting ahead is getting started." - Mark Twain

---

### Start typing to replace this text!`;

const TextExporter: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useNotification();
    const [text, setText] = useState<string>(DEFAULT_TEMPLATE);
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
    const isHtmlDocument = /<html/i.test(text.trim()) || /<!DOCTYPE html>/i.test(text.trim());

    // Stats calculation
    const stats = useMemo(() => {
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        const characters = text.length;
        const readingTime = Math.max(1, Math.ceil(words / 200)); // Assume 200 wpm
        return { words, characters, readingTime };
    }, [text]);

    const handleDownload = (format: 'txt' | 'md' | 'html') => {
        let content = text;
        let mimeType = 'text/plain';

        if (format === 'html') {
            if (isHtmlDocument) {
                // If it's already a full HTML document, download it exactly as is
                content = text;
            } else {
                // Otherwise wrap the processed markdown in a basic HTML structure
                content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Document</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; color: #333; }
        pre { background: #f4f4f4; padding: 1rem; border-radius: 8px; overflow-x: auto; }
        code { font-family: monospace; background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 4px; }
        pre code { background: none; padding: 0; }
        blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 1rem; color: #666; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f4f4f4; }
    </style>
</head>
<body>
    <div id="content">
    ${new MarkdownIt({ html: true }).render(text)}
    </div>
</body>
</html>`;
            }
            mimeType = 'text/html';
        } else if (format === 'md') {
            mimeType = 'text/markdown';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `exported_document.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast({
            title: 'Download Started',
            message: `Your file has been saved as .${format}`,
            variant: 'success'
        });
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-700 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-rose-50 via-rose-100/50 to-transparent dark:from-rose-950/20 dark:via-rose-900/10 dark:to-transparent z-0 blur-3xl opacity-70 pointer-events-none transition-colors duration-700"></div>

            <div className="flex-1 flex flex-col relative z-10 w-full max-w-7xl mx-auto p-2 sm:p-4 lg:p-6 space-y-2 animate-fade-in pb-24">

                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/tools')}
                            className="p-2.5 hover:bg-white/60 dark:hover:bg-slate-800/60 backdrop-blur-md rounded-2xl text-gray-600 dark:text-gray-400 transition-all active:scale-95 shadow-sm border border-black/5 dark:border-white/5"
                        >
                            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white flex items-center gap-3 drop-shadow-sm">
                                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-rose-500" />
                                Text Exporter
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1 font-medium hidden sm:block">
                                Write, format, and download your documents instantly.
                            </p>
                        </div>
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-gray-200 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('edit')}
                            className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'edit' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            <Edit3 className="w-4 h-4" /> <span className="hidden sm:inline">Editor</span>
                        </button>
                        <button
                            onClick={() => setViewMode('preview')}
                            className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'preview' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            <Eye className="w-4 h-4" /> <span className="hidden sm:inline">Preview</span>
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[32px] rounded-b-none shadow-lg flex flex-col overflow-hidden relative">

                    <div className="flex-1 flex overflow-hidden">
                        {/* Editor View */}
                        <div className={`flex-1 w-full h-full min-h-[50vh] flex flex-col p-4 sm:p-6 pb-24 sm:pb-6 ${viewMode === 'edit' ? 'block' : 'hidden md:block border-r border-gray-200 dark:border-slate-700'}`}>
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Start typing your text here..."
                                className="flex-1 w-full h-full resize-none bg-transparent outline-none text-gray-800 dark:text-gray-200 font-mono text-sm sm:text-base leading-relaxed placeholder-gray-400 dark:placeholder-gray-500"
                                spellCheck={false}
                            />
                        </div>

                        {/* Preview View */}
                        <div className={`flex-1 w-full h-full min-h-[50vh] flex flex-col p-4 sm:p-8 pb-24 sm:pb-8 overflow-y-auto custom-scrollbar ${viewMode === 'preview' ? 'block' : 'hidden md:block'} bg-white/40 dark:bg-slate-900/40`}>
{viewMode === 'edit' && <div className="absolute top-4 right-4 px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full text-xs font-bold uppercase tracking-wider md:block hidden z-20">Live Preview</div>}
                            {isHtmlDocument ? (
                                <iframe
                                    srcDoc={text}
                                    title="HTML Preview"
                                    className="flex-1 w-full h-full min-h-full border-0 bg-white rounded-xl"
                                    sandbox="allow-scripts allow-same-origin"
                                />
                            ) : (
                                <div className="prose prose-rose dark:prose-invert max-w-none">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeKatex, rehypeRaw]}
                                        components={{
                                            code({ node, inline, className, children, ...props }: any) {
                                                const match = /language-(\w+)/.exec(className || '');
                                                return !inline && match ? (
                                                    <SyntaxHighlighter
                                                        style={vscDarkPlus as any}
                                                        language={match[1]}
                                                        PreTag="div"
                                                        className="rounded-xl shadow-sm !my-4 !bg-slate-900 border border-slate-800"
                                                        {...props}
                                                    >
                                                        {String(children).replace(/\n$/, '')}
                                                    </SyntaxHighlighter>
                                                ) : (
                                                    <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-rose-500 dark:text-rose-400 font-mono text-sm" {...props}>
                                                        {children}
                                                    </code>
                                                );
                                            }
                                        }}
                                    >
                                        {text || '*Nothing to preview.*'}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>


                </div>
            </div>

            {/* Footer / Status Bar - Fixed at Bottom */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-slate-800 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                {/* Stats */}
                <div className="flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-900 px-4 py-2 rounded-xl w-full sm:w-auto justify-center">
                    <span>{stats.words.toLocaleString()} Words</span>
                    <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600"></div>
                    <span>{stats.characters.toLocaleString()} Chars</span>
                    <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600"></div>
                    <span>~{stats.readingTime} min read</span>
                </div>

                {/* Export Actions */}
                <div className="flex items-center justify-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 mr-2 shrink-0">Export as:</span>
                    <button
                        onClick={() => handleDownload('txt')}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-colors active:scale-95 shrink-0"
                    >
                        <FileText className="w-4 h-4" /> .TXT
                    </button>
                    <button
                        onClick={() => handleDownload('md')}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl font-semibold transition-colors active:scale-95 shrink-0"
                    >
                        <FileCode className="w-4 h-4" /> .MD
                    </button>
                    <button
                        onClick={() => handleDownload('html')}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold transition-colors shadow-md shadow-rose-500/20 active:scale-95 shrink-0"
                    >
                        <Download className="w-4 h-4" /> HTML
                    </button>
                </div>
            </div>
        </div>

    );
};

export default TextExporter;
