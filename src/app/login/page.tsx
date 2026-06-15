"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, Tabs, message, Card, Typography } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const endpoint =
        activeTab === "login" ? "/api/auth/login" : "/api/auth/register";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        message.error(data.error || "操作失败");
        return;
      }

      // 存 token 到 cookie
      document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}`;

      message.success(activeTab === "login" ? "登录成功" : "注册成功");
      router.push("/dashboard");
    } catch {
      message.error("网络错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-md">
        <Title level={3} className="text-center mb-6">
          双色球记录系统
        </Title>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as "login" | "register")}
          centered
          items={[
            { key: "login", label: "登录" },
            { key: "register", label: "注册" },
          ]}
        />

        <Form
          name="auth"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          autoComplete="off"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "请输入邮箱" },
              { type: "email", message: "邮箱格式不正确" },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="邮箱" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: "请输入密码" },
              { min: 6, message: "密码至少 6 位" },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {activeTab === "login" ? "登录" : "注册"}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
