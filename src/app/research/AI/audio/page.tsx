import type { Metadata } from "next";

import ResearchPage from "@/components/ResearchPage";

export const metadata: Metadata = {
  title: "Audio",
  description: "",
  other: {
    slug: "AI/audio",
    created: "2026-09-23",
    lastUpdated: "2026-09-23",
    tags: ["AI"],
  },
};

export default function Page() {
  return <ResearchPage metadata={metadata} />;
}
