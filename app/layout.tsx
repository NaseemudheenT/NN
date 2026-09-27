import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nero Noren",
  description: "Nero Noren Private Limited.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
