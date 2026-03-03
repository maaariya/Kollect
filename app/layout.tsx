import type { Metadata } from "next";
import "./globals.css";
import NavbarWrapper from "@/app/components/navbarWrapper";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Kollect",
  description: "A cute K-Pop photocard trading app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* ⭐ Google Font: Righteous */}
        <link
          href="https://fonts.googleapis.com/css2?family=Righteous&display=swap"
          rel="stylesheet"
        />
      </head>

      <body className="antialiased font-righteous">
        {/* ✅ Server-side navbar that reads cookies */}
        <NavbarWrapper />

        {/* Floating hearts */}
        <div className="heart"></div>
        <div className="heart"></div>
        <div className="heart"></div>
        <div className="heart"></div>

        {children}
      </body>
    </html>
  );
}