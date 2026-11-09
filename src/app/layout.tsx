import { Analytics } from "@vercel/analytics/react";
import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import { JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import localFont from "next/font/local";

import "./globals.css";

const sourceSerif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-source-serif",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-code",
});

const arizonaFlare = localFont({
  src: "./assets/arizona-flare-regular.woff2",
  variable: "--font-arizona-flare",
});

const malloryBook = localFont({
  src: [
    {
      path: "./assets/mallory-book-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./assets/mallory-book-italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "./assets/mallory-book-bold.woff2",
      weight: "700",
      style: "bold",
    },
  ],
  variable: "--font-mallory-book",
});

export const metadata: Metadata = {
  title: "Henry Dashwood",
  description: "Henry Dashwood's personal website",
  alternates: {
    types: {
      "application/rss+xml": `${process.env.WEBSITE_URL}/feed.xml`,
    },
  },
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og`,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sourceSerif.variable} ${arizonaFlare.variable} ${malloryBook.variable} ${jetbrainsMono.variable}`}
    >
      <body suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
