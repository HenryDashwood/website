import "../styles/globals.css";
import "katex/dist/katex.min.css";
import { Analytics } from "@vercel/analytics/react";
import { Open_Sans } from "next/font/google";

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Henry Dashwood",
  metadataBase: new URL(process.env.WEBSITE_URL),
  alternates: {
    canonical: "/",
    languages: {
      "en-UK": "/en-UK",
    },
    types: {
      "application/rss+xml": `${process.env.WEBSITE_URL}/feed.xml`,
    },
  },
  openGraph: {
    title: "Henry Dashwood",
    type: "website",
    url: process.env.WEBSITE_URL,
    site_name: "Henry Dashwood",
    images: [
      {
        url: "./favicon.ico",
        width: 1200,
        height: 630,
        alt: "Favicon",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Henry Dashwood",
    description: "My personal website",
    images: [
      {
        url: "./favicon.ico",
        width: 1200,
        height: 630,
        alt: "Favicon",
      },
    ],
  },
};

function RootLayout({ children }) {
  return (
    <html lang="en" className={openSans.className}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

export default RootLayout;
