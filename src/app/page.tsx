"use client";

import { useRouter } from "next/navigation";
import { Card, Typography } from "antd";
import { HistoryOutlined, ControlOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface Project {
  key: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  path: string;
}

const projects: Project[] = [
  // {
  //   key: "lottery",
  //   name: "双色球 Lottery",
  //   description: "历史记录、指标筛选与统计分析",
  //   icon: <HistoryOutlined />,
  //   path: "/dashboard",
  // },
  {
    key: "plc",
    name: "PLC",
    description: "PLC 项目管理入口",
    icon: <ControlOutlined />,
    path: "/plc/notes",
  },
];

export default function ProjectsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Title level={2} className="!mb-1">
            项目中心
          </Title>
          <Text type="secondary">选择一个项目开始使用</Text>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {projects.map((project) => (
            <Card
              key={project.key}
              hoverable
              onClick={() => router.push(project.path)}
              className="text-center"
              styles={{ body: { padding: "40px 24px" } }}
            >
              <div className="text-5xl text-blue-500 mb-5">{project.icon}</div>
              <Title level={4} className="!mb-2">
                {project.name}
              </Title>
              <Text type="secondary">{project.description}</Text>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
