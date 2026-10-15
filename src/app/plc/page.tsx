"use client";

import { Card, Typography } from "antd";

const { Title, Text } = Typography;

export default function PlcPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <Card>
          <Title level={3} className="!mb-2">
            PLC 项目
          </Title>
          <Text type="secondary">PLC 项目页面开发中，敬请期待。</Text>
        </Card>
      </div>
    </div>
  );
}
