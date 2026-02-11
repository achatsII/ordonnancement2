import React from 'react';

// Simple regex-based markdown parser
// Supports: **bold**, *italic*, ### Headers, - Lists, `code`
export default function MarkdownLite({ text }: { text: string }) {
    if (!text) return null;

    // specialized simplistic parser to avoid heavy dependencies
    const parseText = (input: string) => {
        const lines = input.split('\n');
        return lines.map((line, idx) => {
            // Headers
            if (line.startsWith('### ')) {
                return <h3 key={idx} className="text-sm font-bold mt-2 mb-1">{parseInline(line.replace('###', ''))}</h3>;
            }
            if (line.startsWith('## ')) {
                return <h2 key={idx} className="text-base font-bold mt-3 mb-2">{parseInline(line.replace('##', ''))}</h2>;
            }
            // List items
            if (line.trim().startsWith('- ')) {
                return (
                    <li key={idx} className="ml-4 list-disc marker:text-slate-400">
                        {parseInline(line.replace('- ', ''))}
                    </li>
                );
            }
            // Code blocks (naive single line)
            if (line.startsWith('```')) {
                return null; // Skip fence lines for now or handle blocks better if needed
            }

            // Standard Paragraph
            if (line.trim() === '') return <div key={idx} className="h-2" />;

            return <p key={idx} className="min-h-[1.2em]">{parseInline(line)}</p>;
        });
    };

    const parseInline = (text: string) => {
        // Split by bold markers
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            // Simple italic
            const italicParts = part.split(/(\*.*?\*)/g);
            return italicParts.map((subPart, j) => {
                if (subPart.startsWith('*') && subPart.endsWith('*') && subPart.length > 2) { // avoid matching just *
                    return <em key={`${i}-${j}`}>{subPart.slice(1, -1)}</em>;
                }
                // inline code
                const codeParts = subPart.split(/(`.*?`)/g);
                return codeParts.map((cp, k) => {
                    if (cp.startsWith('`') && cp.endsWith('`')) {
                        return <code key={`${i}-${j}-${k}`} className="bg-slate-100 px-1 py-0.5 rounded textxs font-mono text-pink-600">{cp.slice(1, -1)}</code>;
                    }
                    return cp;
                })
            })
        });
    };

    return <div className="space-y-0.5">{parseText(text)}</div>;
}
