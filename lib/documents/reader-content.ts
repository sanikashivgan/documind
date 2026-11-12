export type ReaderBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "page"; number: number };

function isHeading(line: string) {
  if (line.length > 120 || /[.!?]$/u.test(line)) return false;

  return (
    /^(?:(?:chapter|section)\s+)?\d+(?:\.\d+){0,4}\s*[.)]?\s+\p{L}/iu.test(
      line,
    ) ||
    (/\p{L}/u.test(line) &&
      line === line.toLocaleUpperCase() &&
      line.split(/\s+/u).length <= 12) ||
    /^(abstract|introduction|background|literature review|methodology|method|implementation|results|discussion|conclusion|references|appendix)\b/iu.test(
      line,
    )
  );
}

function listLine(line: string) {
  const match = /^(?:([-*•‣▪])|(\d+)[.)])\s+(.+)$/u.exec(line);
  if (!match) return null;

  return {
    ordered: Boolean(match[2]),
    text: match[3],
  };
}

export function formatDocumentContent(text: string): ReaderBlock[] {
  const blocks: ReaderBlock[] = [];
  let paragraphLines: string[] = [];
  let listItems: string[] = [];
  let listOrdered = false;

  function flushParagraph() {
    const content = paragraphLines.join(" ").replace(/\s+/gu, " ").trim();
    paragraphLines = [];
    if (content) blocks.push({ type: "paragraph", text: content });
  }

  function flushList() {
    if (listItems.length > 0) {
      blocks.push({ type: "list", ordered: listOrdered, items: listItems });
      listItems = [];
    }
  }

  for (const rawLine of text.replace(/\r\n?/gu, "\n").split("\n")) {
    const line = rawLine.trim();
    const pageMarker = /^\[Page\s+(\d+)\]$/iu.exec(line);

    if (!line || pageMarker) {
      flushParagraph();
      flushList();
      if (pageMarker) {
        blocks.push({ type: "page", number: Number(pageMarker[1]) });
      }
      continue;
    }

    const item = listLine(line);
    if (item) {
      flushParagraph();
      if (listItems.length > 0 && listOrdered !== item.ordered) flushList();
      listOrdered = item.ordered;
      listItems.push(item.text);
      continue;
    }

    flushList();
    if (isHeading(line)) {
      flushParagraph();
      blocks.push({ type: "heading", text: line });
      continue;
    }

    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}
