import { formatDocumentContent } from "@/lib/documents/reader-content";

type DocumentReaderProps = {
  text: string;
};

export default function DocumentReader({ text }: DocumentReaderProps) {
  const blocks = formatDocumentContent(text);

  if (!blocks.some((block) => block.type !== "page")) {
    return (
      <p
        className="rounded-lg px-4 py-10 text-center text-sm leading-6 text-slate-500"
        role="status"
        aria-live="polite"
      >
        No readable text was extracted from this document.
      </p>
    );
  }

  return (
    <article className="mx-auto max-w-3xl rounded-xl border border-slate-200/80 bg-white px-5 py-7 shadow-[0_4px_18px_-16px_rgba(15,23,42,0.3)] sm:px-10 sm:py-10">
      {blocks.map((block, index) => {
        if (block.type === "page") {
          return (
            <div
              key={`page-${block.number}-${index}`}
              className="my-8 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-teal-700 first:mt-0"
              role="separator"
              aria-label={`Page ${block.number}`}
            >
              <span className="h-px flex-1 bg-teal-100" aria-hidden="true" />
              <span>Page {block.number}</span>
              <span className="h-px flex-1 bg-teal-100" aria-hidden="true" />
            </div>
          );
        }

        if (block.type === "heading") {
          return (
            <h3
              key={`heading-${index}`}
              className="mb-3 mt-8 break-words text-lg font-semibold leading-snug tracking-tight text-slate-900 first:mt-0 sm:text-xl"
            >
              {block.text}
            </h3>
          );
        }

        if (block.type === "list") {
          const List = block.ordered ? "ol" : "ul";
          return (
            <List
              key={`list-${index}`}
              className={`mb-5 space-y-2 pl-6 text-base leading-7 text-slate-700 sm:text-[17px] sm:leading-8 ${
                block.ordered ? "list-decimal" : "list-disc"
              }`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${itemIndex}-${item}`} className="break-words [overflow-wrap:anywhere]">
                  {item}
                </li>
              ))}
            </List>
          );
        }

        return (
          <p
            key={`paragraph-${index}`}
            className="mb-5 whitespace-pre-wrap break-words text-base leading-7 text-slate-700 last:mb-0 [overflow-wrap:anywhere] sm:text-[17px] sm:leading-8"
          >
            {block.text}
          </p>
        );
      })}
    </article>
  );
}
