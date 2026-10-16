import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WorkCell Twin — Shop-Floor Improvement Simulator",
  description:
    "Compare layout changes, extra equipment, and transport robots before investing in your shop floor.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] antialiased">
        {children}
      </body>
    </html>
  );
}
