import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import Header from "@/components/header";
import "./globals.css";

export const metadata: Metadata = {
  title: "双色球记录查询",
  description: "双色球历史中奖记录查询与更新",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdRegistry>
          <Header />
          {children}
        </AntdRegistry>
      </body>
    </html>
  );
}
