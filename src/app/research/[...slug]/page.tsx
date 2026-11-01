import { Metadata } from "next";
import { notFound } from "next/navigation";

import ResearchPage from "@/components/ResearchPage";
import ResearchTopicPage from "@/components/ResearchTopicPage";
import { getAllNotes, getAllTopics, getNavNode, getNote } from "@/lib/research";

export const revalidate = 3600;
export const dynamicParams = false;

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  const [notes, topics] = await Promise.all([getAllNotes(), getAllTopics()]);
  const paths = new Map<string, string[]>();
  for (const item of [...notes, ...topics]) paths.set(item.slug, item.path);
  return [...paths.values()].map((slug) => ({ slug }));
}

async function resolve(slug: string[]) {
  const slugPath = slug.map(decodeURIComponent).join("/");
  const note = await getNote(slugPath);
  if (note) return { note, topic: null };
  const topic = await getNavNode(slugPath);
  if (topic && topic.kind === "folder") return { note: null, topic };
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolve(slug);
  if (!resolved) return { title: "Not Found" };

  const item = resolved.note ?? resolved.topic!;
  return {
    title: item.title,
    description: resolved.note?.description ?? undefined,
    openGraph: {
      images: [{ url: `${process.env.WEBSITE_URL}/api/og?title=${encodeURIComponent(item.title)}` }],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const resolved = await resolve(slug);
  if (!resolved) notFound();

  return resolved.note ? <ResearchPage note={resolved.note} /> : <ResearchTopicPage node={resolved.topic!} />;
}
