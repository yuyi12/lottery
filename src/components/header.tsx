"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button, Typography, Menu } from "antd";
import { LogoutOutlined, HistoryOutlined, SearchOutlined, BarChartOutlined, AppstoreOutlined, CloudUploadOutlined, FileTextOutlined, FolderOpenOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function Header({ title }: { title: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === "/login";

  const isLotteryPage = ["/dashboard", "/search", "/stats"].some((p) =>
    pathname.startsWith(p)
  );

  const isPlcPage = pathname.startsWith("/plc");

  if (isAuthPage) {
    return (
      <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-center">
        <Title level={4} className="!mb-0">
          {title}
        </Title>
      </div>
    );
  }

  const handleLogout = () => {
    document.cookie = "token=; path=/; max-age=0";
    router.push("/login");
  };

  const menuItems = [
    {
      key: "/dashboard",
      icon: <HistoryOutlined />,
      label: "历史记录",
    },
    {
      key: "/search",
      icon: <SearchOutlined />,
      label: "指标筛选",
    },
    {
      key: "/stats",
      icon: <BarChartOutlined />,
      label: "统计分析",
    },
  ];

  const plcMenuItems = [
    {
      key: "/plc/notes",
      icon: <FileTextOutlined />,
      label: "笔记管理",
    },
    {
      key: "/plc/device-document",
      icon: <FolderOpenOutlined />,
      label: "设备文档",
    },
    {
      key: "/plc/device-upgrade",
      icon: <CloudUploadOutlined />,
      label: "设备升级",
    },
    {
      key: "device-management",
      icon: <AppstoreOutlined />,
      label: "设备管理",
      children: [
        { key: "/plc/brand", label: "品牌" },
        { key: "/plc/device-type", label: "设备类型" },
        { key: "/plc/device-model", label: "设备型号" },
      ],
    },
  ];

  return (
    <div className="bg-white shadow-sm px-6 py-2 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Title level={4} className="!mb-0 whitespace-nowrap">
          {title}
        </Title>
        {(isLotteryPage || isPlcPage) && (
          <Menu
            key={isPlcPage ? "plc" : "lottery"}
            mode="horizontal"
            selectedKeys={[pathname]}
            items={isPlcPage ? plcMenuItems : menuItems}
            onClick={({ key }) => router.push(key)}
            className="!border-b-0"
            style={{ minWidth: 600 }}
          />
        )}
      </div>
      <Button icon={<LogoutOutlined />} onClick={handleLogout} type="text">
        退出登录
      </Button>
    </div>
  );
}
