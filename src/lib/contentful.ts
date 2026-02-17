import { alMadarContentTypeId, alMadarDisplayField } from "@/lib/alMadarModel";

type ContentfulSys = {
  id: string;
  updatedAt: string;
  createdAt: string;
  archivedVersion?: number;
  publishedVersion?: number;
  version?: number;
};

type ContentfulEntry = {
  sys: ContentfulSys;
  fields: Record<string, unknown>;
};

type ContentfulListResponse = {
  total: number;
  skip: number;
  limit: number;
  items: ContentfulEntry[];
};

type ContentfulIdListResponse = {
  total: number;
  skip: number;
  limit: number;
  items: Array<{ sys: { id: string } }>;
};

type ContentfulSingleResponse = ContentfulEntry;

type ContentfulLocale = {
  code: string;
  default: boolean;
};

type ContentfulLocalesResponse = {
  items: ContentfulLocale[];
};

export type ContentStatus = "Draft" | "Changed" | "Published" | "Archived";

export type PreviewListItem = {
  id: string;
  title: string;
  editorialStatus: string;
  contentStatus: ContentStatus;
  updatedAt: string;
};

export type PreviewListResponse = {
  items: PreviewListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type LocaleConfig = {
  defaultLocale: string;
  englishLocale: string;
  arabicLocale: string;
};

export type PreviewEntryResponse = {
  id: string;
  sys: ContentfulSys;
  fields: Record<string, unknown>;
  localeConfig: LocaleConfig;
};

export type ListQuery = {
  page: number;
  search?: string;
  editorialStatus?: string;
  sort?: string;
};

export const PAGE_SIZE = 50;

function envValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

const spaceId = envValue("CONTENTFUL_SPACE_ID") ?? "t7x0vaz0zty0";
const environment = envValue("CONTENTFUL_ENVIRONMENT") ?? "master";
const contentType = envValue("CONTENTFUL_CONTENT_TYPE_ID") ?? alMadarContentTypeId;
const previewToken = envValue("CONTENTFUL_PREVIEW_ACCESS_TOKEN");
const deliveryToken = envValue("CONTENTFUL_DELIVERY_ACCESS_TOKEN");
const accessToken = previewToken ?? deliveryToken ?? envValue("CONTENTFUL_ACCESS_TOKEN");

const host = previewToken ? "preview.contentful.com" : "cdn.contentful.com";
const baseUrl = `https://${host}/spaces/${spaceId}/environments/${environment}`;

let localeConfigPromise: Promise<LocaleConfig> | null = null;

function ensureAccessToken() {
  if (!accessToken) {
    throw new Error(
      "Missing Contentful token. Set CONTENTFUL_PREVIEW_ACCESS_TOKEN or CONTENTFUL_DELIVERY_ACCESS_TOKEN.",
    );
  }
}

async function contentfulFetch<T>(path: string, searchParams?: URLSearchParams): Promise<T> {
  ensureAccessToken();

  const query = searchParams && searchParams.size > 0 ? `?${searchParams}` : "";
  const requestUrl = `${baseUrl}${path}${query}`;
  const response = await fetch(requestUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    const responseText = await response.text();
    const details = responseText ? ` Response: ${responseText.slice(0, 240)}` : "";
    throw new Error(
      `Contentful request failed (${response.status} ${response.statusText}) for ${path}. URL: ${requestUrl}.${details}`,
    );
  }

  return (await response.json()) as T;
}

export function getEditorUrl(entryId: string): string {
  return `https://app.contentful.com/spaces/${spaceId}/environments/${environment}/entries/${entryId}`;
}

function toDisplayValue(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => (item === null || item === undefined ? "" : String(item)))
      .filter(Boolean)
      .join(", ");
  }

  return String(value);
}

function fromLocalizedValue(
  rawField: unknown,
  locale: string,
  fallbackLocale: string,
  allowAnyLocaleFallback = true,
): string {
  if (rawField === null || rawField === undefined) {
    return "";
  }

  if (typeof rawField === "object" && !Array.isArray(rawField)) {
    const localizedMap = rawField as Record<string, unknown>;

    if (locale in localizedMap) {
      return toDisplayValue(localizedMap[locale]);
    }

    if (fallbackLocale in localizedMap) {
      return toDisplayValue(localizedMap[fallbackLocale]);
    }

    if (allowAnyLocaleFallback) {
      const firstLocaleValue = Object.values(localizedMap).find(
        (value) => value !== null && value !== undefined && value !== "",
      );

      if (firstLocaleValue !== undefined) {
        return toDisplayValue(firstLocaleValue);
      }
    }

    return "";
  }

  return toDisplayValue(rawField);
}

function deriveContentStatus(sys: ContentfulSys): ContentStatus {
  if (typeof sys.archivedVersion === "number") {
    return "Archived";
  }

  if (typeof sys.publishedVersion !== "number") {
    return "Draft";
  }

  if (typeof sys.version === "number" && sys.version >= sys.publishedVersion + 2) {
    return "Changed";
  }

  return "Published";
}

function mapSort(sort?: string): string {
  switch (sort) {
    case "updated-asc":
      return "sys.updatedAt";
    case "title-asc":
      return `fields.${alMadarDisplayField}`;
    case "title-desc":
      return `-fields.${alMadarDisplayField}`;
    case "status-asc":
      return "fields.editorialStatus";
    case "status-desc":
      return "-fields.editorialStatus";
    case "updated-desc":
    default:
      return "-sys.updatedAt";
  }
}

export async function getLocaleConfig(): Promise<LocaleConfig> {
  if (!localeConfigPromise) {
    localeConfigPromise = (async () => {
      const localeResponse = await contentfulFetch<ContentfulLocalesResponse>("/locales");
      const locales = localeResponse.items;
      const defaultLocale = locales.find((locale) => locale.default)?.code ?? "en-US";
      const englishLocale =
        locales.find((locale) => locale.code.toLowerCase().startsWith("en"))?.code ?? defaultLocale;
      const arabicLocale =
        locales.find((locale) => locale.code.toLowerCase().startsWith("ar"))?.code ?? defaultLocale;

      return {
        defaultLocale,
        englishLocale,
        arabicLocale,
      };
    })();
  }

  return localeConfigPromise;
}

export async function getPreviewEntries(query: ListQuery): Promise<PreviewListResponse> {
  const localeConfig = await getLocaleConfig();
  const page = Math.max(1, query.page || 1);
  const searchParams = new URLSearchParams({
    content_type: contentType,
    limit: String(PAGE_SIZE),
    skip: String((page - 1) * PAGE_SIZE),
    locale: localeConfig.defaultLocale,
    order: mapSort(query.sort),
  });

  const search = query.search?.trim();
  if (search) {
    searchParams.set("query", search);
  }

  const editorialStatus = query.editorialStatus?.trim();
  if (editorialStatus && editorialStatus !== "all") {
    searchParams.set("fields.editorialStatus", editorialStatus);
  }

  const response = await contentfulFetch<ContentfulListResponse>("/entries", searchParams);

  return {
    items: response.items.map((item) => ({
      id: item.sys.id,
      title:
        fromLocalizedValue(item.fields[alMadarDisplayField], localeConfig.defaultLocale, localeConfig.defaultLocale) ||
        "Untitled",
      editorialStatus: toDisplayValue(item.fields.editorialStatus) || "Unknown",
      contentStatus: deriveContentStatus(item.sys),
      updatedAt: item.sys.updatedAt,
    })),
    total: response.total,
    page,
    pageSize: PAGE_SIZE,
  };
}

export async function getAllPreviewEntryIds(): Promise<string[]> {
  const localeConfig = await getLocaleConfig();
  const limit = 1000;
  let skip = 0;
  let total = 0;
  const ids: string[] = [];

  do {
    const searchParams = new URLSearchParams({
      content_type: contentType,
      locale: localeConfig.defaultLocale,
      select: "sys.id",
      limit: String(limit),
      skip: String(skip),
    });

    const response = await contentfulFetch<ContentfulIdListResponse>("/entries", searchParams);
    ids.push(...response.items.map((item) => item.sys.id));
    total = response.total;
    skip += response.items.length;
  } while (skip < total);

  return [...new Set(ids)];
}

export async function getPreviewEntry(entryId: string): Promise<PreviewEntryResponse> {
  const localeConfig = await getLocaleConfig();
  const response = await contentfulFetch<ContentfulSingleResponse>(
    `/entries/${entryId}`,
    new URLSearchParams({
      locale: "*",
    }),
  );

  return {
    id: response.sys.id,
    sys: response.sys,
    fields: response.fields,
    localeConfig,
  };
}

export function getFieldValueByLocale(
  rawField: unknown,
  locale: string,
  fallbackLocale: string,
): string {
  return fromLocalizedValue(rawField, locale, fallbackLocale);
}

export function getSingleFieldValue(rawField: unknown): string {
  if (rawField && typeof rawField === "object" && !Array.isArray(rawField)) {
    const objectValues = Object.values(rawField as Record<string, unknown>);
    const firstNonEmptyValue = objectValues.find(
      (value) => value !== null && value !== undefined && value !== "",
    );

    if (firstNonEmptyValue !== undefined) {
      return toDisplayValue(firstNonEmptyValue);
    }
  }

  return toDisplayValue(rawField);
}

export function getEntryContentStatus(entry: { sys: ContentfulSys }): ContentStatus {
  return deriveContentStatus(entry.sys);
}
