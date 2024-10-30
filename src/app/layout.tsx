import type { Metadata } from "next";
// import localFont from "next/font/local";
import "./globals.css";
import "katex/dist/katex.min.css";
import { Analytics } from "@vercel/analytics/react";

// import Script from "next/script";

// const geistSans = localFont({
//   src: "./fonts/GeistVF.woff",
//   variable: "--font-geist-sans",
//   weight: "100 900",
// });
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });

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
    <html lang="en">
      <body
      // className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
