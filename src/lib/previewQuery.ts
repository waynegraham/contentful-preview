export type SearchParams = Record<string, string | string[] | undefined>;

export type PreviewQuery = {
  page: number;
  search: string;
  editorialStatus: string;
  sort: string;
};

function asString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function parsePage(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

export function normalizePreviewQuery(params: SearchParams): PreviewQuery {
  return {
    page: parsePage(asString(params.page)),
    search: asString(params.q).trim(),
    editorialStatus: asString(params.editorialStatus).trim(),
    sort: asString(params.sort).trim() || "updated-desc",
  };
}

export function buildPreviewQueryString(query: {
  page: number;
  search?: string;
  editorialStatus?: string;
  sort?: string;
}): string {
  const params = new URLSearchParams();

  if (query.page > 1) {
    params.set("page", String(query.page));
  }

  if (query.search) {
    params.set("q", query.search);
  }

  if (query.editorialStatus && query.editorialStatus !== "all") {
    params.set("editorialStatus", query.editorialStatus);
  }

  if (query.sort && query.sort !== "updated-desc") {
    params.set("sort", query.sort);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}
