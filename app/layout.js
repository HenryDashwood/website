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
