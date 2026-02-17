import Link from "next/link";

import { PAGE_SIZE, getEditorUrl, getPreviewEntries } from "@/lib/contentful";
import {
  type SearchParams,
  buildPreviewQueryString,
  normalizePreviewQuery,
} from "@/lib/previewQuery";

type PreviewListPageProps = {
  searchParams?: Promise<SearchParams>;
};

const SORT_OPTIONS = [
  { value: "updated-desc", label: "Updated (newest)" },
  { value: "updated-asc", label: "Updated (oldest)" },
  { value: "title-asc", label: "Title (A-Z)" },
  { value: "title-desc", label: "Title (Z-A)" },
  { value: "status-asc", label: "Editorial Status (A-Z)" },
  { value: "status-desc", label: "Editorial Status (Z-A)" },
];

const KNOWN_EDITORIAL_STATUSES = ["Needs Review", "Reviewed"];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

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

export default async function PreviewListPage({ searchParams }: PreviewListPageProps) {
  const params = searchParams ? await searchParams : {};
  const { page, search, editorialStatus, sort } = normalizePreviewQuery(params);
  const currentQueryString = buildPreviewQueryString({ page, search, editorialStatus, sort });

  const response = await getPreviewEntries({
    page,
    search,
    editorialStatus,
    sort,
  });

  const totalPages = Math.max(1, Math.ceil(response.total / PAGE_SIZE));
  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);

  const editorialStatusOptions = [...new Set([...KNOWN_EDITORIAL_STATUSES, editorialStatus].filter(Boolean))];

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-10 sm:px-8">
      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">AlMadar Translation Preview</h1>
        <p className="mt-2 text-sm text-slate-600">
          Internal read-only preview for editorial review. Showing {response.items.length} of {response.total} entries.
        </p>

        <form className="mt-6 grid gap-3 md:grid-cols-5" action="/preview" method="get">
          <input
            type="text"
            name="q"
            defaultValue={search}
            placeholder="Search titles and metadata"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-offset-2 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />

          <select
            name="editorialStatus"
            defaultValue={editorialStatus || "all"}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-offset-2 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <option value="all">All editorial statuses</option>
            {editorialStatusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            name="sort"
            defaultValue={sort}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-offset-2 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Apply
          </button>

          <Link
            href="/preview"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Reset filters
          </Link>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Editorial Status</th>
                <th className="px-4 py-3">Content Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {response.items.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={5}>
                    No entries match the current filters.
                  </td>
                </tr>
              )}

              {response.items.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <Link className="hover:underline" href={`/preview/${entry.id}${currentQueryString}`}>
                      {entry.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${editorialPillClass(entry.editorialStatus)}`}>
                      {entry.editorialStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${contentStatusPillClass(entry.contentStatus)}`}>
                      {entry.contentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatDate(entry.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <a
                        className="text-sky-700 hover:underline"
                        href={getEditorUrl(entry.id)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Edit in Contentful
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <nav className="mt-5 flex items-center justify-between text-sm">
        <Link
          className={`rounded-lg border px-3 py-2 ${
            page <= 1
              ? "pointer-events-none border-slate-200 text-slate-400"
              : "border-slate-300 text-slate-700 hover:bg-slate-100"
          }`}
          href={`/preview${buildPreviewQueryString({ page: prevPage, search, editorialStatus, sort })}`}
        >
          Previous
        </Link>

        <span className="text-slate-600">
          Page {page} of {totalPages}
        </span>

        <Link
          className={`rounded-lg border px-3 py-2 ${
            page >= totalPages
              ? "pointer-events-none border-slate-200 text-slate-400"
              : "border-slate-300 text-slate-700 hover:bg-slate-100"
          }`}
          href={`/preview${buildPreviewQueryString({ page: nextPage, search, editorialStatus, sort })}`}
        >
          Next
        </Link>
      </nav>
    </main>
  );
}
