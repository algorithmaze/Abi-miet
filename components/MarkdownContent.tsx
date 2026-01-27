import React, { useMemo } from 'react';
import { marked } from 'marked';
import katex from 'katex';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = "" }) => {
  const htmlContent = useMemo(() => {
    if (!content) return "";

    // Replace LaTeX block math: $$ formula $$
    let processedContent = content.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
      try {
        return katex.renderToString(formula, { displayMode: true, throwOnError: false });
      } catch (e) {
        return match;
      }
    });

    // Replace LaTeX inline math: $ formula $
    processedContent = processedContent.replace(/\$([^$]+?)\$/g, (match, formula) => {
      try {
        return katex.renderToString(formula, { displayMode: false, throwOnError: false });
      } catch (e) {
        return match;
      }
    });

    // Render remaining Markdown
    return marked.parse(processedContent);
  }, [content]);

  return (
    <div 
      className={`prose prose-slate max-w-none prose-math ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};