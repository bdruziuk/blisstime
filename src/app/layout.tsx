import type { Metadata } from "next";
import { Playfair_Display, Manrope, Geist_Mono } from "next/font/google";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BlissTime",
  description: "Букінг та CRM для майстрів і салонів краси",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body
        className={`${playfairDisplay.variable} ${manrope.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
