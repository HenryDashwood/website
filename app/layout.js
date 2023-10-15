import "./globals.css";
import "katex/dist/katex.min.css";
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  title: "Henry Dashwood",
};

function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

export default RootLayout;
