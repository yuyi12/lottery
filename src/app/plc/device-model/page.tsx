"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  message,
  Popconfirm,
  Tag,
  Empty,
  Spin,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

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

interface DeviceModel {
  id: number;
  name: string;
  brandId: number;
  deviceTypeId: number;
  description: string | null;
  image: string | null;
  createdAt: string;
}

export default function DeviceModelPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [list, setList] = useState<DeviceModel[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedDeviceTypeId, setSelectedDeviceTypeId] = useState<number | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<DeviceModel | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [formBrandId, setFormBrandId] = useState<number | null>(null);
  const [form] = Form.useForm();

  const brandMap = useMemo(() => new Map(brands.map((b) => [b.id, b.name])), [brands]);
  const deviceTypeMap = useMemo(
    () => new Map(deviceTypes.map((dt) => [dt.id, dt.name])),
    [deviceTypes]
  );

  const fetchBrands = useCallback(async () => {
    try {
      const res = await fetch("/api/plc/brands");
      if (res.ok) {
        const data = await res.json();
        setBrands(data.data || []);
      }
    } catch {
      // 忽略
    }
  }, []);

  const fetchDeviceTypes = useCallback(async () => {
    try {
      const res = await fetch("/api/plc/device-types");
      if (res.ok) {
        const data = await res.json();
        setDeviceTypes(data.data || []);
      }
    } catch {
      // 忽略
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/plc/device-models");
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
    fetchBrands();
    fetchDeviceTypes();
    fetchList();
  }, [fetchBrands, fetchDeviceTypes, fetchList]);

  // 筛选行：品牌 → 该品牌下的设备类型
  const visibleDeviceTypes = useMemo(() => {
    if (selectedBrandId === null) return deviceTypes;
    const brand = brands.find((b) => b.id === selectedBrandId);
    if (!brand) return [];
    const ids = new Set(brand.deviceTypeIds || []);
    return deviceTypes.filter((dt) => ids.has(dt.id));
  }, [selectedBrandId, brands, deviceTypes]);

  const filteredModels = useMemo(
    () =>
      list.filter(
        (m) =>
          (selectedBrandId === null || m.brandId === selectedBrandId) &&
          (selectedDeviceTypeId === null || m.deviceTypeId === selectedDeviceTypeId)
      ),
    [list, selectedBrandId, selectedDeviceTypeId]
  );

  // 弹窗内：根据所选品牌联动设备类型
  const formDeviceTypes = useMemo(() => {
    if (!formBrandId) return deviceTypes;
    const brand = brands.find((b) => b.id === formBrandId);
    if (!brand) return deviceTypes;
    const ids = new Set(brand.deviceTypeIds || []);
    return deviceTypes.filter((dt) => ids.has(dt.id));
  }, [formBrandId, brands, deviceTypes]);

  const handleBrandSelect = (id: number | null) => {
    setSelectedBrandId(id);
    setSelectedDeviceTypeId(null);
  };

  const openAddModal = () => {
    setEditing(null);
    setImageUrl(null);
    setFormBrandId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (record: DeviceModel) => {
    setEditing(record);
    setImageUrl(record.image);
    setFormBrandId(record.brandId);
    form.setFieldsValue({
      name: record.name,
      brandId: record.brandId,
      deviceTypeId: record.deviceTypeId,
      description: record.description,
    });
    setModalOpen(true);
  };

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append("file", file as File);
    formData.append("bucket", "device-model-images");
    try {
      const res = await fetch("/api/plc/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setImageUrl(data.url);
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
    brandId: number;
    deviceTypeId: number;
    description?: string;
  }) => {
    setSubmitting(true);
    try {
      const payload = { ...values, image: imageUrl };
      const url = editing
        ? `/api/plc/device-models/${editing.id}`
        : "/api/plc/device-models";
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
      const res = await fetch(`/api/plc/device-models/${id}`, { method: "DELETE" });
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-base font-medium">设备型号</span>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
            新增
          </Button>
        </div>

        {/* 第一行：品牌 */}
        <div className="mb-3">
          <span className="mr-2 text-gray-500">品牌：</span>
          <div className="inline-flex flex-wrap gap-2 align-middle">
            <Tag.CheckableTag
              checked={selectedBrandId === null}
              onChange={() => handleBrandSelect(null)}
            >
              全部
            </Tag.CheckableTag>
            {brands.map((b) => (
              <Tag.CheckableTag
                key={b.id}
                checked={selectedBrandId === b.id}
                onChange={() => handleBrandSelect(b.id)}
              >
                {b.name}
              </Tag.CheckableTag>
            ))}
          </div>
        </div>

        {/* 第二行：设备类型 */}
        <div>
          <span className="mr-2 text-gray-500">设备类型：</span>
          <div className="inline-flex flex-wrap gap-2 align-middle">
            <Tag.CheckableTag
              checked={selectedDeviceTypeId === null}
              onChange={() => setSelectedDeviceTypeId(null)}
            >
              全部
            </Tag.CheckableTag>
            {visibleDeviceTypes.map((dt) => (
              <Tag.CheckableTag
                key={dt.id}
                checked={selectedDeviceTypeId === dt.id}
                onChange={() => setSelectedDeviceTypeId(dt.id)}
              >
                {dt.name}
              </Tag.CheckableTag>
            ))}
          </div>
        </div>
      </Card>

      <Spin spinning={loading}>
        {filteredModels.length === 0 ? (
          <Card>
            <Empty description="暂无设备型号" />
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredModels.map((m) => (
              <Card
                key={m.id}
                hoverable
                cover={
                  m.image ? (
                    <img
                      src={m.image}
                      alt={m.name}
                      className="h-40 w-full object-cover"
                    />
                  ) : null
                }
                actions={[
                  <EditOutlined key="edit" onClick={() => openEditModal(m)} />,
                  <Popconfirm
                    key="delete"
                    title="确认删除该设备型号？"
                    onConfirm={() => handleDelete(m.id)}
                    okText="删除"
                    cancelText="取消"
                  >
                    <DeleteOutlined />
                  </Popconfirm>,
                ]}
              >
                <Card.Meta
                  title={m.name}
                  description={
                    <div>
                      <div className="mb-1">
                        <Tag color="blue">{brandMap.get(m.brandId) ?? "-"}</Tag>
                        <Tag color="green">{deviceTypeMap.get(m.deviceTypeId) ?? "-"}</Tag>
                      </div>
                      {m.description && (
                        <div className="text-gray-500">{m.description}</div>
                      )}
                    </div>
                  }
                />
              </Card>
            ))}
          </div>
        )}
      </Spin>

      <Modal
        title={editing ? "编辑设备型号" : "新增设备型号"}
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
            label="设备名称"
            rules={[{ required: true, message: "请输入设备名称" }]}
          >
            <Input placeholder="请输入设备名称" maxLength={100} />
          </Form.Item>
          <Form.Item
            name="brandId"
            label="品牌"
            rules={[{ required: true, message: "请选择品牌" }]}
          >
            <Select
              placeholder="请选择品牌"
              options={brands.map((b) => ({ label: b.name, value: b.id }))}
              onChange={(value) => {
                setFormBrandId(value);
                form.setFieldValue("deviceTypeId", undefined);
              }}
            />
          </Form.Item>
          <Form.Item
            name="deviceTypeId"
            label="设备类型"
            rules={[{ required: true, message: "请选择设备类型" }]}
          >
            <Select
              placeholder="请选择设备类型"
              options={formDeviceTypes.map((dt) => ({ label: dt.name, value: dt.id }))}
            />
          </Form.Item>
          <Form.Item label="图片">
            <Upload
              listType="picture-card"
              maxCount={1}
              showUploadList={false}
              accept="image/*"
              customRequest={handleUpload}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="图片"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-gray-400">
                  <PlusOutlined />
                  <div className="mt-1">上传图片</div>
                </div>
              )}
            </Upload>
          </Form.Item>
          <Form.Item name="description" label="简介">
            <Input.TextArea placeholder="请输入简介" rows={3} maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
