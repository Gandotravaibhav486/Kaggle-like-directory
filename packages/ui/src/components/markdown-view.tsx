import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../format';

function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

const components: Components = {
  a({ href, children, ...props }) {
    const url = href ?? '';
    const external = isExternal(url);
    return (
      <a
        href={url}
        rel="nofollow ugc noopener noreferrer"
        target={external ? '_blank' : undefined}
        {...props}
      >
        {children}
      </a>
    );
  },
  // Images are rendered as links only; no remote image loading (ARCHITECTURE.md §7).
  img({ src, alt }) {
    const url = typeof src === 'string' ? src : '';
    return (
      <a href={url} rel="nofollow ugc noopener noreferrer" target="_blank" className="text-accent underline underline-offset-[3px]">
        {alt && alt.length > 0 ? alt : url}
      </a>
    );
  },
  table({ children, ...props }) {
    return (
      <div role="region" tabIndex={0} className="relative overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[480px] border-collapse text-small" {...props}>
          {children}
        </table>
      </div>
    );
  },
};

export interface MarkdownViewProps {
  markdown: string;
  className?: string;
}

/** Renders untrusted markdown safely: skipHtml, no rehype-raw, sanitised links. */
export function MarkdownView({ markdown, className }: MarkdownViewProps) {
  return (
    <div data-testid="markdown-view" className={cn('prose-mi', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
