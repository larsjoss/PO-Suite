import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

interface Props {
  children: string;
}

export function MarkdownOutput({ children }: Props) {
  return (
    <div className="prose prose-base max-w-none leading-relaxed prose-headings:font-semibold prose-headings:text-ink prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:text-ink prose-li:text-ink prose-strong:text-ink prose-strong:font-semibold prose-a:text-brand prose-a:no-underline hover:prose-a:underline prose-code:text-brand prose-code:bg-brand-light prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-normal prose-code:text-sm prose-blockquote:border-l-brand prose-blockquote:text-ink-secondary prose-hr:border-edge">
      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{children}</ReactMarkdown>
    </div>
  );
}
