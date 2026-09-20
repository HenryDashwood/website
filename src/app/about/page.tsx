import { Metadata } from "next";

import NavContentWrapper from "@/components/NavContentWrapper";

import AboutContent from "./post.mdx";

export const metadata: Metadata = {
  title: "About Me",
  description: "About me",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=About%20Me`,
      },
    ],
  },
};

export default function About() {
  return (
    <NavContentWrapper>
      <AboutContent />
    </NavContentWrapper>
  );
}
