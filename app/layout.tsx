import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Utavoca - Japanese Vocabulary Learning",
  description: "Learn Japanese vocabulary through your favorite songs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {children}
      </body>
    </html>
  );
}
