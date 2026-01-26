import ResearchPage from "@/components/ResearchPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How transformer-based language models got longer context windows",
  description: "",
  other: {
    slug: "AI/questions/longer-contexts",
    created: "2026-01-26",
    lastUpdated: "2026-01-26",
    tags: ["AI"],
  },
};

export default function Page() {
  return <ResearchPage metadata={metadata} />;
}
