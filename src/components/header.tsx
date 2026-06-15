"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button, Typography, Menu } from "antd";
import { LogoutOutlined, HistoryOutlined, SearchOutlined, BarChartOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === "/login";

  if (isAuthPage) {
    return (
      <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-center">
        <Title level={4} className="!mb-0">
          双色球记录系统
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

  return (
    <div className="bg-white shadow-sm px-6 py-2 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Title level={4} className="!mb-0 whitespace-nowrap">
          双色球记录系统
        </Title>
        <Menu
          mode="horizontal"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
          className="!border-b-0"
          style={{ minWidth: 600 }}
        />
      </div>
      <Button icon={<LogoutOutlined />} onClick={handleLogout} type="text">
        退出登录
      </Button>
    </div>
  );
}
