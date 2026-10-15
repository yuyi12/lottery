"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Table, Button, Card, Modal, Form, Input, message, Popconfirm } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

interface DeviceType {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}

export default function DeviceTypePage() {
  const router = useRouter();
  const [list, setList] = useState<DeviceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<DeviceType | null>(null);
  const [form] = Form.useForm();

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/plc/device-types");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setList(data.data);
      } else {
        message.error(data.error || "查询失败");
      }
    } catch {
      message.error("网络错误");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openAddModal = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (record: DeviceType) => {
    setEditing(record);
    form.setFieldsValue({ name: record.name, description: record.description });
    setModalOpen(true);
  };

  const handleSubmit = async (values: { name: string; description?: string }) => {
    setSubmitting(true);
    try {
      const url = editing
        ? `/api/plc/device-types/${editing.id}`
        : "/api/plc/device-types";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        message.error(data.error || (editing ? "更新失败" : "新增失败"));
        return;
      }
      message.success(editing ? "更新成功" : "新增成功");
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      fetchList();
    } catch {
      message.error("网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/plc/device-types/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        message.error(data.error || "删除失败");
        return;
      }
      message.success("删除成功");
      fetchList();
    } catch {
      message.error("网络错误");
    }
  };

  const columns = [
    {
      title: "设备类型",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "设备简介",
      dataIndex: "description",
      key: "description",
      render: (v: string | null) => v || "-",
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (v: string) => (v ? dayjs(v).format("YYYY-MM-DD HH:mm:ss") : "-"),
    },
    {
      title: "操作",
      key: "action",
      width: 160,
      render: (_: any, record: DeviceType) => (
        <div className="flex gap-2">
          <Button type="link" size="small" onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除该设备类型？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button type="link" danger size="small">
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-base font-medium">设备类型</span>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
            新增
          </Button>
        </div>
      </Card>

      <Card>
        <Table
          dataSource={list}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ showTotal: (t) => `共 ${t} 条记录` }}
        />
      </Card>

      <Modal
        title={editing ? "编辑设备类型" : "新增设备类型"}
        open={modalOpen}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        confirmLoading={submitting}
        okText="确认"
        cancelText="取消"
        forceRender
      >
        <Form form={form} layout="vertical" className="pt-4" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="设备类型"
            rules={[{ required: true, message: "请输入设备类型" }]}
          >
            <Input placeholder="请输入设备类型" maxLength={100} />
          </Form.Item>
          <Form.Item name="description" label="设备简介">
            <Input.TextArea placeholder="请输入设备简介" rows={3} maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
