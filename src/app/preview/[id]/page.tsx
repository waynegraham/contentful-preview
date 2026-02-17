import { redirect } from "next/navigation";

import { getAllPreviewEntryIds } from "@/lib/contentful";

type PreviewDetailRedirectPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  const ids = await getAllPreviewEntryIds();
  return ids.map((id) => ({ id }));
}

export default async function PreviewDetailRedirectPage({
  params,
}: PreviewDetailRedirectPageProps) {
  const { id } = await params;
  redirect(`/${id}`);
}
