"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  Button,
  Card,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  message,
  Popconfirm,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

interface Brand {
  id: number;
  name: string;
  logo: string | null;
  description: string | null;
  deviceTypeIds: number[];
  createdAt: string;
}

interface DeviceType {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}

export default function BrandPage() {
  const router = useRouter();
  const [list, setList] = useState<Brand[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [form] = Form.useForm();

  const deviceTypeMap = useMemo(
    () => new Map(deviceTypes.map((dt) => [dt.id, dt.name])),
    [deviceTypes]
  );

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/plc/brands");
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

  const fetchDeviceTypes = useCallback(async () => {
    try {
      const res = await fetch("/api/plc/device-types");
      if (res.ok) {
        const data = await res.json();
        setDeviceTypes(data.data || []);
      }
    } catch {
      // 忽略：设备类型表可能尚未创建
    }
  }, []);

  useEffect(() => {
    fetchList();
    fetchDeviceTypes();
  }, [fetchList, fetchDeviceTypes]);

  const openAddModal = () => {
    setEditing(null);
    setLogoUrl(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (record: Brand) => {
    setEditing(record);
    setLogoUrl(record.logo);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      deviceTypeIds: record.deviceTypeIds,
    });
    setModalOpen(true);
  };

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append("file", file as File);
    try {
      const res = await fetch("/api/plc/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setLogoUrl(data.url);
        onSuccess?.(data);
      } else {
        onError?.(new Error(data.error || "上传失败"));
        message.error(data.error || "上传失败");
      }
    } catch {
      onError?.(new Error("网络错误"));
      message.error("网络错误");
    }
  };

  const handleSubmit = async (values: {
    name: string;
    description?: string;
    deviceTypeIds?: number[];
  }) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        deviceTypeIds: values.deviceTypeIds || [],
        logo: logoUrl,
      };
      const url = editing ? `/api/plc/brands/${editing.id}` : "/api/plc/brands";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      const res = await fetch(`/api/plc/brands/${id}`, { method: "DELETE" });
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
      title: "LOGO",
      dataIndex: "logo",
      key: "logo",
      width: 80,
      render: (v: string | null) =>
        v ? (
          <img src={v} alt="logo" className="w-10 h-10 object-contain" />
        ) : (
          "-"
        ),
    },
    {
      title: "品牌名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "设备类型",
      dataIndex: "deviceTypeIds",
      key: "deviceTypeIds",
      render: (ids: number[]) => {
        if (!ids || ids.length === 0) return "-";
        return ids.map((id) => deviceTypeMap.get(id) ?? String(id)).join("、");
      },
    },
    {
      title: "品牌简介",
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
      render: (_: any, record: Brand) => (
        <div className="flex gap-2">
          <Button type="link" size="small" onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除该品牌？"
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
          <span className="text-base font-medium">品牌</span>
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
        title={editing ? "编辑品牌" : "新增品牌"}
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
            label="品牌名称"
            rules={[{ required: true, message: "请输入品牌名称" }]}
          >
            <Input placeholder="请输入品牌名称" maxLength={100} />
          </Form.Item>
          <Form.Item label="品牌 LOGO">
            <Upload
              listType="picture-card"
              maxCount={1}
              showUploadList={false}
              accept="image/*"
              customRequest={handleUpload}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-gray-400">
                  <PlusOutlined />
                  <div className="mt-1">上传 LOGO</div>
                </div>
              )}
            </Upload>
          </Form.Item>
          <Form.Item name="deviceTypeIds" label="设备类型">
            <Select
              mode="multiple"
              placeholder="请选择设备类型"
              allowClear
              showSearch
              optionFilterProp="label"
              options={deviceTypes.map((dt) => ({ label: dt.name, value: dt.id }))}
            />
          </Form.Item>
          <Form.Item name="description" label="品牌简介">
            <Input.TextArea placeholder="请输入品牌简介" rows={3} maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
