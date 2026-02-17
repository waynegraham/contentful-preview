import Link from "next/link";
import { notFound } from "next/navigation";

import { alMadarDisplayField, alMadarFields } from "@/lib/alMadarModel";
import {
  PAGE_SIZE,
  getEditorUrl,
  getEntryContentStatus,
  getFieldValueByLocale,
  getPreviewEntry,
  getPreviewEntries,
  getSingleFieldValue,
} from "@/lib/contentful";
import {
  type SearchParams,
  buildPreviewQueryString,
  normalizePreviewQuery,
} from "@/lib/previewQuery";

type DetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};

function editorialPillClass(status: string): string {
  switch (status) {
    case "Reviewed":
      return "bg-emerald-100 text-emerald-800";
    case "Needs Review":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function contentStatusPillClass(status: string): string {
  switch (status) {
    case "Published":
      return "bg-teal-100 text-teal-800";
    case "Changed":
      return "bg-orange-100 text-orange-800";
    case "Draft":
      return "bg-violet-100 text-violet-800";
    case "Archived":
      return "bg-zinc-200 text-zinc-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function withFallback(value: string): string {
  return value || "-";
}

export default async function PreviewDetailPage({ params, searchParams }: DetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const { page, search, editorialStatus: queryEditorialStatus, sort } = normalizePreviewQuery(resolvedSearchParams);
  const currentQueryString = buildPreviewQueryString({ page, search, editorialStatus: queryEditorialStatus, sort });

  let entry;
  try {
    entry = await getPreviewEntry(id);
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      notFound();
    }

    throw error;
  }

  const title = withFallback(
    getFieldValueByLocale(
      entry.fields[alMadarDisplayField],
      entry.localeConfig.englishLocale,
      entry.localeConfig.defaultLocale,
    ),
  );

  const entryEditorialStatus = withFallback(getSingleFieldValue(entry.fields.editorialStatus));
  const contentStatus = getEntryContentStatus(entry);
  const listResponse = await getPreviewEntries({ page, search, editorialStatus: queryEditorialStatus, sort });
  const entryIndex = listResponse.items.findIndex((item) => item.id === id);
  const totalPages = Math.max(1, Math.ceil(listResponse.total / PAGE_SIZE));

  let previousEntry = entryIndex > 0 ? listResponse.items[entryIndex - 1] : undefined;
  let nextEntry =
    entryIndex >= 0 && entryIndex < listResponse.items.length - 1 ? listResponse.items[entryIndex + 1] : undefined;
  let previousPage = page;
  let nextPage = page;

  if (!previousEntry && entryIndex === 0 && page > 1) {
    const previousPageResponse = await getPreviewEntries({
      page: page - 1,
      search,
      editorialStatus: queryEditorialStatus,
      sort,
    });
    previousEntry = previousPageResponse.items[previousPageResponse.items.length - 1];
    previousPage = page - 1;
  }

  if (!nextEntry && entryIndex === listResponse.items.length - 1 && page < totalPages) {
    const nextPageResponse = await getPreviewEntries({
      page: page + 1,
      search,
      editorialStatus: queryEditorialStatus,
      sort,
    });
    nextEntry = nextPageResponse.items[0];
    nextPage = page + 1;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-10 sm:px-8">
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Entry ID</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">{title}</h1>
            <p className="mt-1 text-xs text-slate-500">{entry.id}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${editorialPillClass(entryEditorialStatus)}`}>
              {entryEditorialStatus}
            </span>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${contentStatusPillClass(contentStatus)}`}>
              {contentStatus}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <Link className="text-sky-700 hover:underline" href={`/preview${currentQueryString}`}>
            Back to list
          </Link>
          {previousEntry ? (
            <Link
              className="text-sky-700 hover:underline"
              href={`/preview/${previousEntry.id}${buildPreviewQueryString({
                page: previousPage,
                search,
                editorialStatus: queryEditorialStatus,
                sort,
              })}`}
            >
              Previous item
            </Link>
          ) : (
            <span className="text-slate-400">Previous item</span>
          )}
          {nextEntry ? (
            <Link
              className="text-sky-700 hover:underline"
              href={`/preview/${nextEntry.id}${buildPreviewQueryString({
                page: nextPage,
                search,
                editorialStatus: queryEditorialStatus,
                sort,
              })}`}
            >
              Next item
            </Link>
          ) : (
            <span className="text-slate-400">Next item</span>
          )}
          <a className="text-sky-700 hover:underline" href={getEditorUrl(entry.id)} rel="noreferrer" target="_blank">
            Edit in Contentful
          </a>
          <span className="text-slate-500">Updated {formatDate(entry.sys.updatedAt)}</span>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
          <div className="px-4 py-3">Field</div>
          <div className="px-4 py-3">English</div>
          <div className="px-4 py-3" dir="rtl">
            العربية
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {alMadarFields.map((field) => {
            const rawValue = entry.fields[field.id];

            const englishValue = field.localized
              ? getFieldValueByLocale(rawValue, entry.localeConfig.englishLocale, entry.localeConfig.defaultLocale)
              : getSingleFieldValue(rawValue);

            const arabicValue = field.localized
              ? getFieldValueByLocale(rawValue, entry.localeConfig.arabicLocale, entry.localeConfig.defaultLocale)
              : getSingleFieldValue(rawValue);

            return (
              <div className="grid grid-cols-[1.2fr_1fr_1fr] text-sm" key={field.id}>
                <div className="px-4 py-3 text-slate-700">
                  <p className="font-medium text-slate-900">{field.name}</p>
                  <p className="text-xs text-slate-500">{field.id}</p>
                </div>
                <div className="px-4 py-3 text-slate-700">{withFallback(englishValue)}</div>
                <div className="px-4 py-3 text-slate-700" dir="rtl">
                  {withFallback(arabicValue)}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
