import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

interface Props {
  children: string;
}

export function MarkdownOutput({ children }: Props) {
  return (
    <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-strong:font-semibold prose-p:text-ink prose-li:text-ink prose-headings:text-ink prose-strong:text-ink leading-relaxed">
      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{children}</ReactMarkdown>
    </div>
  );
}
