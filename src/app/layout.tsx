import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ALLOW_INDEXING } from "@/lib/seo";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Get Node",
  description: "Маркетплейс послуг та легка CRM для майстрів і салонів краси",
  // robots.txt only asks crawlers not to fetch; noindex is what actually keeps
  // pages out of the index (and drops already-indexed ones).
  ...(ALLOW_INDEXING
    ? {}
    : {
        robots: {
          index: false,
          follow: false,
          nocache: true,
          googleBot: { index: false, follow: false },
        },
      }),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body className={`${inter.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
