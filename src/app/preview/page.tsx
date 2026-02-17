import PreviewListPage from "./preview-list-page";

type SearchParams = Record<string, string | string[] | undefined>;

export default function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return <PreviewListPage searchParams={searchParams} />;
}
