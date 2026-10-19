import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import Header from "@/components/header";
import "./globals.css";

export const metadata: Metadata = {
  title: "工控自动化",
  description: "",
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
          <Header title="" />
          {children}
        </AntdRegistry>
      </body>
    </html>
  );
}
