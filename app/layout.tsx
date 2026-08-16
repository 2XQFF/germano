import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WORTWEG | 오프라인 독일어 학습",
  description: "인터넷 없이 독일어 단어를 학습하고 명사의 성과 복수형, 동사의 주요 변화를 확인하세요.",
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
