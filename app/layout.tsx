import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Enclave | U.S. National Debt",
  description: "Evidence-calibrated U.S. national debt tracking and fiscal scenario exploration."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
