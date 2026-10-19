"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Button,
  Drawer,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Tag,
  Empty,
  List,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
  MinusCircleOutlined,
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

interface DeviceDocument {
  id: number;
  deviceModelId: number;
  description: string | null;
  docPath: string;
  createdAt: string;
}

interface AddFormValues {
  deviceModelId: number;
  documents: { description?: string; path?: string }[];
}

interface EditFormValues {
  description?: string;
  path: string;
}

const HELPER_URL = process.env.NEXT_PUBLIC_PLC_HELPER_URL || "http://127.0.0.1:43110";
const HELPER_TOKEN = process.env.NEXT_PUBLIC_PLC_HELPER_TOKEN || "";

export default function DeviceDocumentPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [deviceModels, setDeviceModels] = useState<DeviceModel[]>([]);
  const [list, setList] = useState<DeviceDocument[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedDeviceTypeId, setSelectedDeviceTypeId] = useState<number | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<DeviceDocument | null>(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

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
      const res = await fetch("/api/plc/device-documents");
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

  // 打开抽屉后初始化表单（抽屉使用 destroyOnClose，需等表单挂载后再赋值）
  useEffect(() => {
    if (!drawerOpen) return;
    if (editing) {
      editForm.setFieldsValue({
        description: editing.description ?? "",
        path: editing.docPath,
      });
    } else {
      addForm.resetFields();
      addForm.setFieldsValue({ documents: [{}] });
    }
  }, [drawerOpen, editing, addForm, editForm]);

  const visibleDeviceTypes = useMemo(() => {
    if (selectedBrandId === null) return deviceTypes;
    const brand = brands.find((b) => b.id === selectedBrandId);
    if (!brand) return [];
    const ids = new Set(brand.deviceTypeIds || []);
    return deviceTypes.filter((dt) => ids.has(dt.id));
  }, [selectedBrandId, brands, deviceTypes]);

  const filteredList = useMemo(() => {
    const result: { doc: DeviceDocument; model: DeviceModel }[] = [];
    for (const doc of list) {
      const model = deviceModelMap.get(doc.deviceModelId);
      if (!model) continue;
      if (selectedBrandId !== null && model.brandId !== selectedBrandId) continue;
      if (
        selectedDeviceTypeId !== null &&
        model.deviceTypeId !== selectedDeviceTypeId
      ) {
        continue;
      }
      result.push({ doc, model });
    }
    return result;
  }, [list, deviceModelMap, selectedBrandId, selectedDeviceTypeId]);

  const handleBrandSelect = (id: number | null) => {
    setSelectedBrandId(id);
    setSelectedDeviceTypeId(null);
  };

  const handleOpen = async (doc: DeviceDocument) => {
    if (!doc.docPath) {
      message.warning("未填写文档路径");
      return;
    }
    try {
      const res = await fetch(`${HELPER_URL}/open`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PLC-Token": HELPER_TOKEN,
        },
        body: JSON.stringify({ path: doc.docPath, mode: "file" }),
      });
      const d = await res.json();
      if (!res.ok) {
        message.error(d.error || "打开失败");
        return;
      }
      message.success("已打开文档");
    } catch {
      message.error("本地助手未启动，请先在本机启动助手（npm run helper）");
    }
  };

  const openAddDrawer = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (doc: DeviceDocument) => {
    setEditing(doc);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(null);
  };

  const handleAddSubmit = async (values: AddFormValues) => {
    const documents = (values.documents || [])
      .map((d) => ({
        description: d?.description?.trim() || null,
        path: d?.path?.trim() || "",
      }))
      .filter((d) => d.path);

    if (documents.length === 0) {
      message.error("请至少填写一条文档路径");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/plc/device-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceModelId: values.deviceModelId, documents }),
      });
      const d = await res.json();
      if (!res.ok) {
        message.error(d.error || "新增失败");
        return;
      }
      message.success("新增成功");
      closeDrawer();
      fetchList();
    } catch {
      message.error("网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (values: EditFormValues) => {
    if (!editing) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/plc/device-documents/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: values.description?.trim() || null,
          path: values.path.trim(),
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        message.error(d.error || "更新失败");
        return;
      }
      message.success("更新成功");
      closeDrawer();
      fetchList();
    } catch {
      message.error("网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/plc/device-documents/${id}`, {
        method: "DELETE",
      });
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
          <span className="text-base font-medium">设备文档</span>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddDrawer}>
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

      <Card>
        <Spin spinning={loading}>
          <List
            dataSource={filteredList}
            locale={{ emptyText: <Empty description="暂无设备文档" /> }}
            renderItem={({ doc, model }) => (
              <List.Item
                actions={[
                  <Button
                    key="view"
                    type="link"
                    icon={<FolderOpenOutlined />}
                    onClick={() => handleOpen(doc)}
                  >
                    查看
                  </Button>,
                  <Button
                    key="edit"
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => openEditDrawer(doc)}
                  >
                    编辑
                  </Button>,
                  <Popconfirm
                    key="delete"
                    title="确认删除该文档？"
                    onConfirm={() => handleDelete(doc.id)}
                    okText="删除"
                    cancelText="取消"
                  >
                    <Button type="link" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <div className="w-full">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-base">{model.name}</span>
                    <Tag color="blue">{brandMap.get(model.brandId) ?? "-"}</Tag>
                    <Tag color="green">
                      {deviceTypeMap.get(model.deviceTypeId) ?? "-"}
                    </Tag>
                  </div>
                  {doc.description && (
                    <div className="text-gray-600 text-sm mb-1">
                      {doc.description}
                    </div>
                  )}
                  <div className="text-gray-400 text-xs break-all">
                    路径：{doc.docPath}
                  </div>
                </div>
              </List.Item>
            )}
          />
        </Spin>
      </Card>

      <Drawer
        title={editing ? "编辑文档" : "新增设备文档"}
        placement="right"
        width={720}
        open={drawerOpen}
        onClose={closeDrawer}
        destroyOnClose
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={closeDrawer}>取消</Button>
            <Button
              type="primary"
              loading={submitting}
              onClick={() => (editing ? editForm.submit() : addForm.submit())}
            >
              确认
            </Button>
          </div>
        }
      >
        {editing ? (
          <Form
            form={editForm}
            layout="vertical"
            className="pt-4"
            onFinish={handleEditSubmit}
          >
            <Form.Item name="description" label="简介">
              <Input.TextArea
                placeholder="请输入文档简介"
                rows={3}
                maxLength={500}
              />
            </Form.Item>
            <Form.Item
              name="path"
              label="文档路径"
              rules={[
                { required: true, whitespace: true, message: "请输入文档路径" },
              ]}
            >
              <Input placeholder="请输入文档在本机的完整路径，如 D:\docs\手册.pdf" />
            </Form.Item>
          </Form>
        ) : (
          <Form
            form={addForm}
            layout="vertical"
            className="pt-4"
            initialValues={{ documents: [{}] }}
            onFinish={handleAddSubmit}
          >
            <Form.Item
              name="deviceModelId"
              label="设备型号"
              rules={[{ required: true, message: "请选择设备型号" }]}
            >
              <Select
                placeholder="请选择设备型号"
                showSearch
                optionFilterProp="label"
                options={deviceModels.map((m) => ({
                  label: `${m.name}（${brandMap.get(m.brandId) ?? "-"} / ${
                    deviceTypeMap.get(m.deviceTypeId) ?? "-"
                  }）`,
                  value: m.id,
                }))}
              />
            </Form.Item>

            <Form.List name="documents">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }, index) => (
                    <div
                      key={key}
                      className="border border-gray-200 rounded-md p-3 mb-3 bg-gray-50/60"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">
                          文档 {index + 1}
                        </span>
                        {fields.length > 1 && (
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<MinusCircleOutlined />}
                            onClick={() => remove(name)}
                          >
                            移除
                          </Button>
                        )}
                      </div>
                      <Form.Item
                        {...restField}
                        name={[name, "description"]}
                        label="简介"
                      >
                        <Input.TextArea
                          placeholder="请输入文档简介"
                          rows={2}
                          maxLength={500}
                        />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, "path"]}
                        label="文档路径"
                        rules={[
                          {
                            required: true,
                            whitespace: true,
                            message: "请输入文档路径",
                          },
                        ]}
                        className="!mb-0"
                      >
                        <Input placeholder="请输入文档在本机的完整路径，如 D:\docs\手册.pdf" />
                      </Form.Item>
                    </div>
                  ))}
                  <Button
                    type="dashed"
                    block
                    icon={<PlusOutlined />}
                    onClick={() => add({ description: "", path: "" })}
                  >
                    新增一条文档
                  </Button>
                </>
              )}
            </Form.List>
          </Form>
        )}
      </Drawer>
    </div>
  );
}
