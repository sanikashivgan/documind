export const DEFAULT_DOCUMENT_PAGE_SIZE = 20;
export const MAX_DOCUMENT_PAGE_SIZE = 50;

export type DocumentListParams = {
  offset: number;
  limit: number;
  search: string;
};

export function parseDocumentListParams(
  params: URLSearchParams,
): DocumentListParams | null {
  const rawOffset = params.get("offset") ?? "0";
  const rawLimit = params.get("limit") ?? String(DEFAULT_DOCUMENT_PAGE_SIZE);
  const search = (params.get("search") ?? "").trim();

  if (!/^\d+$/u.test(rawOffset) || !/^\d+$/u.test(rawLimit)) {
    return null;
  }

  const offset = Number(rawOffset);
  const requestedLimit = Number(rawLimit);

  if (
    !Number.isSafeInteger(offset) ||
    !Number.isSafeInteger(requestedLimit) ||
    requestedLimit < 1 ||
    offset + Math.min(requestedLimit, MAX_DOCUMENT_PAGE_SIZE) >
      Number.MAX_SAFE_INTEGER ||
    search.length > 100
  ) {
    return null;
  }

  return {
    offset,
    limit: Math.min(requestedLimit, MAX_DOCUMENT_PAGE_SIZE),
    search,
  };
}

export function escapeLikeSearchTerm(search: string) {
  return search.replace(/[\\%_]/gu, "\\$&");
}

export function createDocumentSearchFilter(search: string) {
  const term = escapeLikeSearchTerm(search).replace(/["(),]/gu, "\\$&");
  return `name.ilike."%${term}%",file_type.ilike."%${term}%"`;
}

export function hasMoreDocuments(
  offset: number,
  loadedCount: number,
  totalCount: number,
) {
  return offset + loadedCount < totalCount;
}
