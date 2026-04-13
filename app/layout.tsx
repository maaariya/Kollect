import type { Metadata } from "next";
import "./globals.css";
import NavbarWrapper from "@/app/components/navbarWrapper";
import PayPalProvider from "@/app/providers/PayPalProvider";

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
        <link
          href="https://fonts.googleapis.com/css2?family=Righteous&display=swap"
          rel="stylesheet"
        />
      </head>

      <body className="antialiased font-righteous">
        <PayPalProvider>
          <NavbarWrapper />

          <div className="heart"></div>
          <div className="heart"></div>
          <div className="heart"></div>
          <div className="heart"></div>

          {children}
        </PayPalProvider>
      </body>
    </html>
  );
}