import { InlineMath, BlockMath } from 'react-katex';



interface Props {
  text: string;
  className?: string;
}

export function SmartMathText({ text, className }: Props) {
  if (!text) return null;

  // Regular expression to find text inside $ ... $
  const parts = text.split(/(\$.*?\$)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          // Remove the $ signs and render as Math
          const mathContent = part.substring(1, part.length - 1);
          return <InlineMath key={index} math={mathContent} />;
        }
        // Render as normal text
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}