import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IBKR 交易账本",
  description: "按交易日汇总 IBKR Trade Confirmation Flex 股票与期权成交。",
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
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
