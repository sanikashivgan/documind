type PdfPageText = {
  num: number;
  text: string;
};

export function formatPdfPages(pages: PdfPageText[], totalPages: number) {
  const pageTextByNumber = new Map(
    pages.map(({ num, text }) => [num, text.trim()]),
  );

  return Array.from(
    { length: totalPages },
    (_, index) => `[Page ${index + 1}]\n${pageTextByNumber.get(index + 1) ?? ""}`,
  ).join("\n\n");
}
