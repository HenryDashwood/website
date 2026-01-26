import ResearchPage from "@/components/ResearchPage";
import { GetAllResearch, GetResearchByPath } from "@/lib/research";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  const allResearch = await GetAllResearch(false);
  return allResearch.map((item) => ({
    slug: item.path,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const research = await GetResearchByPath(slugPath, false);

  if (!research) {
    return {
      title: "Not Found",
    };
  }

  return {
    title: research.metadata.title,
    description: research.metadata.description,
    openGraph: {
      images: [
        {
          url: `${process.env.WEBSITE_URL}/api/og?title=${encodeURIComponent(String(research.metadata.title || "Research"))}`,
        },
      ],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const research = await GetResearchByPath(slugPath, false);

  if (!research) {
    notFound();
  }

  return <ResearchPage metadata={research.metadata} />;
}
