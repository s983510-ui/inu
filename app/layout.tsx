import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

// 한글 글꼴. 한글 글자는 화면에 필요한 부분만 나눠서 불러와요.
const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  weight: "variable",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "조인우 | 한국자산관리공사",
  description: "한국자산관리공사 국유재산관리 실무자 조인우의 프로필",
};

export const viewport: Viewport = {
  themeColor: "#123c8c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
