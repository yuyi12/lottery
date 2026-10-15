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
  message,
  Popconfirm,
  Tag,
  Empty,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CloudUploadOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";

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

interface DeviceUpgrade {
  id: number;
  deviceModelId: number;
  softwarePath: string | null;
  firmwarePath: string | null;
  createdAt: string;
}

const HELPER_URL = process.env.NEXT_PUBLIC_PLC_HELPER_URL || "http://127.0.0.1:43110";
const HELPER_TOKEN = process.env.NEXT_PUBLIC_PLC_HELPER_TOKEN || "";

export default function DeviceUpgradePage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [deviceModels, setDeviceModels] = useState<DeviceModel[]>([]);
  const [list, setList] = useState<DeviceUpgrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedDeviceTypeId, setSelectedDeviceTypeId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<DeviceUpgrade | null>(null);
  const [form] = Form.useForm();

  const brandMap = useMemo(() => new Map(brands.map((b) => [b.id, b.name])), [brands]);
  const deviceTypeMap = useMemo(
    () => new Map(deviceTypes.map((dt) => [dt.id, dt.name])),
    [deviceTypes]
  );
  const deviceModelMap = useMemo(
    () => new Map(deviceModels.map((m) => [m.id, m])),
    [deviceModels]
  );

  const fetchBrands = useCallback(async () => {
    try {
      const res = await fetch("/api/plc/brands");
      if (res.ok) {
        const d = await res.json();
        setBrands(d.data || []);
      }
    } catch {
      // 忽略
    }
  }, []);

  const fetchDeviceTypes = useCallback(async () => {
    try {
      const res = await fetch("/api/plc/device-types");
      if (res.ok) {
        const d = await res.json();
        setDeviceTypes(d.data || []);
      }
    } catch {
      // 忽略
    }
  }, []);

  const fetchDeviceModels = useCallback(async () => {
    try {
      const res = await fetch("/api/plc/device-models");
      if (res.ok) {
        const d = await res.json();
        setDeviceModels(d.data || []);
      }
    } catch {
      // 忽略
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/plc/device-upgrades");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const d = await res.json();
      if (res.ok) {
        setList(d.data);
      } else {
        message.error(d.error || "查询失败");
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
    fetchDeviceModels();
    fetchList();
  }, [fetchBrands, fetchDeviceTypes, fetchDeviceModels, fetchList]);

  const visibleDeviceTypes = useMemo(() => {
    if (selectedBrandId === null) return deviceTypes;
    const brand = brands.find((b) => b.id === selectedBrandId);
    if (!brand) return [];
    const ids = new Set(brand.deviceTypeIds || []);
    return deviceTypes.filter((dt) => ids.has(dt.id));
  }, [selectedBrandId, brands, deviceTypes]);

  const filteredList = useMemo(() => {
    const result: { upgrade: DeviceUpgrade; model: DeviceModel }[] = [];
    for (const u of list) {
      const model = deviceModelMap.get(u.deviceModelId);
      if (!model) continue;
      if (selectedBrandId !== null && model.brandId !== selectedBrandId) continue;
      if (selectedDeviceTypeId !== null && model.deviceTypeId !== selectedDeviceTypeId) continue;
      result.push({ upgrade: u, model });
    }
    return result;
  }, [list, deviceModelMap, selectedBrandId, selectedDeviceTypeId]);

  const handleBrandSelect = (id: number | null) => {
    setSelectedBrandId(id);
    setSelectedDeviceTypeId(null);
  };

  const handleOpen = async (upgrade: DeviceUpgrade, mode: "file" | "folder") => {
    const path = mode === "file" ? upgrade.softwarePath : upgrade.firmwarePath;
    if (!path) {
      message.warning(mode === "file" ? "未填写升级软件路径" : "未填写升级固件路径");
      return;
    }
    try {
      const res = await fetch(`${HELPER_URL}/open`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PLC-Token": HELPER_TOKEN,
        },
        body: JSON.stringify({ path, mode }),
      });
      const d = await res.json();
      if (!res.ok) {
        message.error(d.error || "打开失败");
        return;
      }
      message.success(mode === "file" ? "已打开升级软件" : "已打开固件文件夹");
    } catch {
      message.error("本地助手未启动，请先在本机启动助手（npm run helper）");
    }
  };

  const openAddModal = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (record: DeviceUpgrade) => {
    setEditing(record);
    form.setFieldsValue({
      deviceModelId: record.deviceModelId,
      softwarePath: record.softwarePath,
      firmwarePath: record.firmwarePath,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: {
    deviceModelId: number;
    softwarePath?: string;
    firmwarePath?: string;
  }) => {
    setSubmitting(true);
    try {
      const url = editing
        ? `/api/plc/device-upgrades/${editing.id}`
        : "/api/plc/device-upgrades";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const d = await res.json();
      if (!res.ok) {
        message.error(d.error || (editing ? "更新失败" : "新增失败"));
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
      const res = await fetch(`/api/plc/device-upgrades/${id}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) {
        message.error(d.error || "删除失败");
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
          <span className="text-base font-medium">设备升级</span>
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
        {filteredList.length === 0 ? (
          <Card>
            <Empty description="暂无设备升级记录" />
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredList.map(({ upgrade, model }) => (
              <Card
                key={upgrade.id}
                hoverable
                cover={
                  model.image ? (
                    <img
                      src={model.image}
                      alt={model.name}
                      className="h-40 w-full object-cover"
                    />
                  ) : null
                }
                actions={[
                  <EditOutlined key="edit" onClick={() => openEditModal(upgrade)} />,
                  <Popconfirm
                    key="delete"
                    title="确认删除该设备升级？"
                    onConfirm={() => handleDelete(upgrade.id)}
                    okText="删除"
                    cancelText="取消"
                  >
                    <DeleteOutlined />
                  </Popconfirm>,
                ]}
              >
                <Card.Meta
                  title={model.name}
                  description={
                    <div>
                      <div className="mb-3">
                        <Tag color="blue">{brandMap.get(model.brandId) ?? "-"}</Tag>
                        <Tag color="green">
                          {deviceTypeMap.get(model.deviceTypeId) ?? "-"}
                        </Tag>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          type="primary"
                          icon={<CloudUploadOutlined />}
                          disabled={!upgrade.softwarePath}
                          title={upgrade.softwarePath || undefined}
                          onClick={() => handleOpen(upgrade, "file")}
                        >
                          升级软件
                        </Button>
                        <Button
                          icon={<FolderOpenOutlined />}
                          disabled={!upgrade.firmwarePath}
                          title={upgrade.firmwarePath || undefined}
                          onClick={() => handleOpen(upgrade, "folder")}
                        >
                          升级固件
                        </Button>
                      </div>
                    </div>
                  }
                />
              </Card>
            ))}
          </div>
        )}
      </Spin>

      <Modal
        title={editing ? "编辑设备升级" : "新增设备升级"}
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
            name="deviceModelId"
            label="设备型号"
            rules={[{ required: true, message: "请选择设备型号" }]}
          >
            <Select
              placeholder="请选择设备型号"
              showSearch
              optionFilterProp="label"
              options={deviceModels.map((m) => ({ label: m.name, value: m.id }))}
            />
          </Form.Item>
          <Form.Item name="softwarePath" label="升级软件">
            <Input placeholder="请输入升级软件在本机的完整路径" />
          </Form.Item>
          <Form.Item name="firmwarePath" label="升级固件">
            <Input placeholder="请输入固件所在文件夹路径" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
