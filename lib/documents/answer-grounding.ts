export type ExtractiveClaim = {
  text: string;
  sourceId: number;
};

export type GroundedAnswer =
  | { supported: false }
  | { supported: true; answer: string; sourceIds: number[] };

export function groundExtractiveClaims(
  claims: ExtractiveClaim[],
  passages: Array<{ id: number; passage: string }>,
): GroundedAnswer {
  if (claims.length === 0) return { supported: false };

  const passageById = new Map(
    passages.map(({ id, passage }) => [id, passage]),
  );
  const sourceIds: number[] = [];

  for (const claim of claims) {
    const source = passageById.get(claim.sourceId);
    const quote = claim.text.trim();
    if (
      !source ||
      !quote ||
      !source
        .replace(/\s+/gu, " ")
        .includes(quote.replace(/\s+/gu, " "))
    ) {
      return { supported: false };
    }
    sourceIds.push(claim.sourceId);
  }

  return {
    supported: true,
    answer: claims.map(({ text }) => `“${text.trim()}”`).join("\n\n"),
    sourceIds: [...new Set(sourceIds)],
  };
}
