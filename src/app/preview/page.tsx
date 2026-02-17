import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const nextParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    const normalized = firstValue(value);
    if (normalized) {
      nextParams.set(key, normalized);
    }
  }

  const queryString = nextParams.toString();
  redirect(queryString ? `/?${queryString}` : "/");
}
