import type { Metadata } from "next";
import { Libre_Franklin, Mada } from "next/font/google";

import "./globals.css";

const mada = Mada({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
});

const libreFranklin = Libre_Franklin({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-english",
});

export const metadata: Metadata = {
  title: "AlMadar Translation Preview",
  description: "Internal Contentful translation preview for editorial review.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${mada.variable} ${libreFranklin.variable} antialiased`}>{children}</body>
    </html>
  );
}
