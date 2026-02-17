import Link from "next/link";
import { notFound } from "next/navigation";

import { alMadarDisplayField, alMadarFields } from "@/lib/alMadarModel";
import {
  PAGE_SIZE,
  type PreviewEntryResponse,
  getAllPreviewEntryIds,
  getEditorUrl,
  getEntryContentStatus,
  getFieldValueByLocale,
  getPreviewEntries,
  getPreviewEntry,
  getSingleFieldValue,
} from "@/lib/contentful";
import { looksLikeHtml, sanitizeBasicHtml } from "@/lib/sanitizeHtml";

type DetailPageProps = {
  params: Promise<{ id: string }>;
};

type ViewMode = "fields" | "template";
type TemplateLanguage = "en" | "ar";

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

function buildDetailQueryString(query: {
  page: number;
  search?: string;
  editorialStatus?: string;
  sort?: string;
  viewMode?: ViewMode;
  templateLanguage?: TemplateLanguage;
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

  if (query.viewMode === "template") {
    params.set("view", "template");
  }

  if (query.templateLanguage === "ar") {
    params.set("lang", "ar");
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

function getEntryFieldValue(
  entry: PreviewEntryResponse,
  fieldId: string,
  templateLanguage: TemplateLanguage,
): string {
  const rawValue = entry.fields[fieldId];
  const field = alMadarFields.find((item) => item.id === fieldId);

  if (field?.localized) {
    const locale =
      templateLanguage === "ar" ? entry.localeConfig.arabicLocale : entry.localeConfig.englishLocale;
    return getFieldValueByLocale(rawValue, locale, entry.localeConfig.defaultLocale);
  }

  return getSingleFieldValue(rawValue);
}

function renderFieldValue(value: string, type: string, dir?: "rtl" | "ltr") {
  if (!value) {
    return <span>-</span>;
  }

  if (type === "Text") {
    if (looksLikeHtml(value)) {
      return (
        <div
          className="leading-6 [&_a]:text-sky-700 [&_a]:underline [&_li]:ml-4 [&_p]:mb-2"
          dir={dir}
          dangerouslySetInnerHTML={{ __html: sanitizeBasicHtml(value) }}
        />
      );
    }

    return (
      <div className="whitespace-pre-line leading-6" dir={dir}>
        {value}
      </div>
    );
  }

  return <span dir={dir}>{value}</span>;
}

export async function generateStaticParams() {
  const ids = await getAllPreviewEntryIds();
  return ids.map((id) => ({ id }));
}

export default async function PreviewDetailPage({ params }: DetailPageProps) {
  const { id } = await params;
  const viewMode: ViewMode = "fields";
  const templateLanguage: TemplateLanguage = "en";
  const page = 1;
  const search = "";
  const queryEditorialStatus = "";
  const sort = "updated-desc";
  const currentQueryString = "";

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
  const listResponse = await getPreviewEntries({
    page,
    search,
    editorialStatus: queryEditorialStatus,
    sort,
  });

  const entryIndex = listResponse.items.findIndex((item) => item.id === id);
  const totalPages = Math.max(1, Math.ceil(listResponse.total / PAGE_SIZE));

  let previousEntry = entryIndex > 0 ? listResponse.items[entryIndex - 1] : undefined;
  let nextEntry =
    entryIndex >= 0 && entryIndex < listResponse.items.length - 1
      ? listResponse.items[entryIndex + 1]
      : undefined;
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

  const templateTitle = withFallback(getEntryFieldValue(entry, "title", templateLanguage));
  const templateOrigin = withFallback(getEntryFieldValue(entry, "origin", templateLanguage));
  const templateHijriDate = getEntryFieldValue(entry, "hijriDate", templateLanguage);
  const templateGregorianDate = getEntryFieldValue(entry, "gregorianDate", templateLanguage);
  const templateDate = withFallback([templateHijriDate, templateGregorianDate].filter(Boolean).join(" / "));
  const templateMaterials = withFallback(getEntryFieldValue(entry, "material", templateLanguage));
  const templateDimensions = withFallback(getEntryFieldValue(entry, "dimension", templateLanguage));
  const templateCurator = withFallback(getEntryFieldValue(entry, "curator", templateLanguage));
  const templateWriters = withFallback(getEntryFieldValue(entry, "writers", templateLanguage));
  const templateDescription = getEntryFieldValue(entry, "description", templateLanguage);
  const templateFootnotes = getEntryFieldValue(entry, "footnotes", templateLanguage);
  const templateManuscriptDescription = getEntryFieldValue(entry, "manuscriptDescription", templateLanguage);
  const templateObjectRelatedInformation = getEntryFieldValue(entry, "objectRelatedInformation", templateLanguage);

  const templateDir = templateLanguage === "ar" ? "rtl" : "ltr";

  const templateLabels =
    templateLanguage === "ar"
      ? {
          origin: "المنشأ",
          date: "التاريخ",
          materials: "المواد",
          dimensions: "الأبعاد",
          curator: "القيّم",
          context: "السياق",
          by: "بقلم",
          manuscriptDescription: "وصف المخطوطة",
          objectRelatedInformation: "معلومات متعلقة بالقطعة",
          footnotes: "المراجع",
        }
      : {
          origin: "Origin",
          date: "Date",
          materials: "Materials",
          dimensions: "Dimensions",
          curator: "Curator(s)",
          context: "Context",
          by: "by",
          manuscriptDescription: "Manuscript Description",
          objectRelatedInformation: "Object Related Information",
          footnotes: "Footnote Reference",
        };

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
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${editorialPillClass(
                entryEditorialStatus,
              )}`}
            >
              {entryEditorialStatus}
            </span>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${contentStatusPillClass(
                contentStatus,
              )}`}
            >
              {contentStatus}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <Link className="text-sky-700 hover:underline" href={`/${currentQueryString}`}>
            Back to list
          </Link>
          {previousEntry ? (
            <Link
              className="text-sky-700 hover:underline"
              href={`/${previousEntry.id}${buildDetailQueryString({
                page: previousPage,
                search,
                editorialStatus: queryEditorialStatus,
                sort,
                viewMode,
                templateLanguage,
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
              href={`/${nextEntry.id}${buildDetailQueryString({
                page: nextPage,
                search,
                editorialStatus: queryEditorialStatus,
                sort,
                viewMode,
                templateLanguage,
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

      <section className="mb-4 flex flex-wrap gap-2">
        <Link
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            viewMode === "fields" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
          href={`/${entry.id}${buildDetailQueryString({
            page,
            search,
            editorialStatus: queryEditorialStatus,
            sort,
            viewMode: "fields",
            templateLanguage,
          })}`}
        >
          Field view
        </Link>

        <Link
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            viewMode === "template" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
          href={`/${entry.id}${buildDetailQueryString({
            page,
            search,
            editorialStatus: queryEditorialStatus,
            sort,
            viewMode: "template",
            templateLanguage,
          })}`}
        >
          Template view
        </Link>
      </section>

      {viewMode === "fields" ? (
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
                  <div className="px-4 py-3 text-slate-700">{renderFieldValue(englishValue, field.type, "ltr")}</div>
                  <div className="px-4 py-3 text-slate-700" dir="rtl">
                    {renderFieldValue(arabicValue, field.type, "rtl")}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section
          className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${
            templateLanguage === "ar" ? "font-arabic" : "font-english"
          }`}
          dir={templateDir}
        >
          <div className="grid gap-8 p-6 lg:grid-cols-[1.5fr_1fr]">
            <div dir={templateDir}>
              <h2 className="text-4xl font-semibold uppercase tracking-tight text-slate-900">{templateTitle}</h2>

              <div className="mt-6 flex flex-wrap gap-2">
                {["Citation", "Save", "Share", "View Curated Story", "View on contributor website"].map((label) => (
                  <button
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                    key={label}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>

              <section className="mt-8">
                <div className="mb-3 flex flex-wrap items-end gap-3">
                  <h3 className="text-3xl font-semibold uppercase tracking-wide text-slate-900">{templateLabels.context}</h3>
                  <p className="text-lg text-slate-600">
                    {templateLabels.by}: {templateWriters}
                  </p>
                </div>
                <div className="text-lg text-slate-800">{renderFieldValue(templateDescription, "Text", templateDir)}</div>
              </section>

              {templateManuscriptDescription && (
                <section className="mt-8">
                  <h3 className="mb-3 text-3xl font-semibold uppercase tracking-wide text-slate-900">
                    {templateLabels.manuscriptDescription}
                  </h3>
                  <div className="text-lg text-slate-800">
                    {renderFieldValue(templateManuscriptDescription, "Text", templateDir)}
                  </div>
                </section>
              )}

              {templateObjectRelatedInformation && (
                <section className="mt-8">
                  <h3 className="mb-3 text-3xl font-semibold uppercase tracking-wide text-slate-900">
                    {templateLabels.objectRelatedInformation}
                  </h3>
                  <div className="text-lg text-slate-800">
                    {renderFieldValue(templateObjectRelatedInformation, "Text", templateDir)}
                  </div>
                </section>
              )}

              <section className="mt-8">
                <h3 className="mb-3 text-3xl font-semibold uppercase tracking-wide text-slate-900">
                  {templateLabels.footnotes}
                </h3>
                <div className="text-lg text-slate-800">{renderFieldValue(templateFootnotes, "Text", templateDir)}</div>
              </section>
            </div>

            <aside>
              <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-sm">
                <Link
                  className={`rounded-md px-3 py-1.5 font-medium ${
                    templateLanguage === "en"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  href={`/${entry.id}${buildDetailQueryString({
                    page,
                    search,
                    editorialStatus: queryEditorialStatus,
                    sort,
                    viewMode: "template",
                    templateLanguage: "en",
                  })}`}
                >
                  English
                </Link>
                <Link
                  className={`rounded-md px-3 py-1.5 font-medium ${
                    templateLanguage === "ar"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  href={`/${entry.id}${buildDetailQueryString({
                    page,
                    search,
                    editorialStatus: queryEditorialStatus,
                    sort,
                    viewMode: "template",
                    templateLanguage: "ar",
                  })}`}
                >
                  العربية
                </Link>
              </div>

              <dl className="divide-y divide-slate-200 rounded-xl border border-slate-200">
                <div className="grid grid-cols-[0.9fr_1.4fr] gap-3 px-4 py-3">
                  <dt className="text-slate-500">{templateLabels.origin}</dt>
                  <dd className="font-medium text-slate-900" dir={templateDir}>
                    {templateOrigin}
                  </dd>
                </div>
                <div className="grid grid-cols-[0.9fr_1.4fr] gap-3 px-4 py-3">
                  <dt className="text-slate-500">{templateLabels.date}</dt>
                  <dd className="font-medium text-slate-900" dir={templateDir}>
                    {templateDate}
                  </dd>
                </div>
                <div className="grid grid-cols-[0.9fr_1.4fr] gap-3 px-4 py-3">
                  <dt className="text-slate-500">{templateLabels.materials}</dt>
                  <dd className="font-medium text-slate-900" dir={templateDir}>
                    {templateMaterials}
                  </dd>
                </div>
                <div className="grid grid-cols-[0.9fr_1.4fr] gap-3 px-4 py-3">
                  <dt className="text-slate-500">{templateLabels.dimensions}</dt>
                  <dd className="font-medium text-slate-900" dir={templateDir}>
                    {templateDimensions}
                  </dd>
                </div>
                <div className="grid grid-cols-[0.9fr_1.4fr] gap-3 px-4 py-3">
                  <dt className="text-slate-500">{templateLabels.curator}</dt>
                  <dd className="font-medium text-slate-900" dir={templateDir}>
                    {templateCurator}
                  </dd>
                </div>
              </dl>
            </aside>
          </div>
        </section>
      )}
    </main>
  );
}
