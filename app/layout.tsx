import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "오프라인 독일어 단어사전",
  description: "한국어 뜻으로 독일어 명사의 성과 복수형, 동사의 주요 변화를 확인하는 오프라인 단어사전.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
