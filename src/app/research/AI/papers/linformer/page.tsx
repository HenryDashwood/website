import ResearchPage from "@/components/ResearchPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Linformer",
  description: "",
  other: {
    slug: "AI/papers/linformer",
    created: "2026-01-26",
    lastUpdated: "2026-01-26",
    tags: ["AI"],
  },
};

export default function Page() {
  return <ResearchPage metadata={metadata} />;
}
