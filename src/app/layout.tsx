import type { Metadata } from "next";
// import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import "katex/dist/katex.min.css";
import localFont from "next/font/local";
import "./globals.css";

const arizonaFlare = localFont({
  src: "./assets/arizona-flare-regular.woff2",
  variable: "--font-arizona-flare",
});

const martinaPlantijn = localFont({
  src: [
    {
      path: "./assets/martina-plantijn-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./assets/martina-plantijn-italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-martina-plantijn",
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
    <html lang="en" className={`${martinaPlantijn.variable} ${arizonaFlare.variable} ${malloryBook.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
