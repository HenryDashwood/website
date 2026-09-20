import type { Metadata } from "next";

import ResearchPage from "@/components/ResearchPage";

export const metadata: Metadata = {
  title: "What is a CUDA kernel?",
  description: "",
  other: {
    slug: "AI/questions/cuda-kernels",
    created: "2026-01-27",
    lastUpdated: "2026-01-27",
    tags: ["AI"],
  },
};

export default function Page() {
  return <ResearchPage metadata={metadata} />;
}
