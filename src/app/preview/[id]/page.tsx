import { redirect } from "next/navigation";

import { getAllPreviewEntryIds } from "@/lib/contentful";
import type { SearchParams } from "@/lib/previewQuery";

type PreviewDetailRedirectPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export async function generateStaticParams() {
  const ids = await getAllPreviewEntryIds();
  return ids.map((id) => ({ id }));
}

export default async function PreviewDetailRedirectPage({
  params,
  searchParams,
}: PreviewDetailRedirectPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const nextParams = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    const normalized = firstValue(value);
    if (normalized) {
      nextParams.set(key, normalized);
    }
  }

  const queryString = nextParams.toString();
  redirect(queryString ? `/${id}?${queryString}` : `/${id}`);
}
