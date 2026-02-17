import type { Metadata } from "next";

import "./globals.css";

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
      <body className="antialiased">{children}</body>
    </html>
  );
}
