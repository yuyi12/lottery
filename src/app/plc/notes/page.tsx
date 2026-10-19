"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import RichTextEditor from "@/components/rich-text-editor";

interface Brand {
  id: number;
  name: string;
  deviceTypeIds: number[];
}

interface DeviceType {
  id: number;
  name: string;
}

interface DeviceModel {
  id: number;
  name: string;
  brandId: number;
  deviceTypeId: number;
}

interface Note {
  id: number;
  title: string;
  deviceModelId: number | null;
  content: string | null;
  createdAt: string;
  updatedAt: string;
}

const PAGE_SIZE = 20;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function NotesPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [deviceModels, setDeviceModels] = useState<DeviceModel[]>([]);

  const [notes, setNotes] = useState<Note[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedDeviceTypeId, setSelectedDeviceTypeId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [viewing, setViewing] = useState<Note | null>(null);
  const [contentHtml, setContentHtml] = useState("");
  const [form] = Form.useForm();

  const sentinelRef = useRef<HTMLDivElement>(null);

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

  const fetchNotes = useCallback(
    async (
      p: number,
      brandId: number | null,
      deviceTypeId: number | null,
      kw: string,
      reset: boolean
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(p),
          pageSize: String(PAGE_SIZE),
        });
        if (brandId !== null) params.set("brandId", String(brandId));
        if (deviceTypeId !== null) params.set("deviceTypeId", String(deviceTypeId));
        if (kw) params.set("keyword", kw);

        const res = await fetch(`/api/plc/notes?${params.toString()}`);
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const d = await res.json();
        if (res.ok) {
          setNotes((prev) => (reset ? d.data : [...prev, ...d.data]));
          setTotal(d.total);
          setPage(p);
          setHasMore(p * PAGE_SIZE < d.total);
        } else {
          message.error(d.error || "查询失败");
        }
      } catch {
        message.error("网络错误");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    fetchBrands();
    fetchDeviceTypes();
    fetchDeviceModels();
  }, [fetchBrands, fetchDeviceTypes, fetchDeviceModels]);

  useEffect(() => {
    fetchNotes(1, selectedBrandId, selectedDeviceTypeId, keyword, true);
  }, [selectedBrandId, selectedDeviceTypeId, keyword, fetchNotes]);

  // 无限滚动：哨兵进入视口即加载下一页
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchNotes(page + 1, selectedBrandId, selectedDeviceTypeId, keyword, false);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, page, selectedBrandId, selectedDeviceTypeId, keyword, fetchNotes]);

  const visibleDeviceTypes = useMemo(() => {
    if (selectedBrandId === null) return deviceTypes;
    const brand = brands.find((b) => b.id === selectedBrandId);
    if (!brand) return [];
    const ids = new Set(brand.deviceTypeIds || []);
    return deviceTypes.filter((dt) => ids.has(dt.id));
  }, [selectedBrandId, brands, deviceTypes]);

  const handleBrandSelect = (id: number | null) => {
    setSelectedBrandId(id);
    setSelectedDeviceTypeId(null);
  };

  const openAddModal = () => {
    setEditing(null);
    setContentHtml("");
    form.resetFields();
    setDrawerOpen(true);
  };

  const openViewModal = (note: Note) => {
    setViewing(note);
  };

  const openEditModal = (note: Note) => {
    setEditing(note);
    setContentHtml(note.content || "");
    form.setFieldsValue({
      title: note.title,
      deviceModelId: note.deviceModelId ?? undefined,
    });
    setDrawerOpen(true);
  };

  const handleSubmit = async (values: { title: string; deviceModelId?: number }) => {
    setSubmitting(true);
    try {
      const payload = {
        title: values.title,
        deviceModelId: values.deviceModelId ?? null,
        content: contentHtml || null,
      };
      const url = editing ? `/api/plc/notes/${editing.id}` : "/api/plc/notes";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) {
        message.error(d.error || (editing ? "更新失败" : "新增失败"));
        return;
      }
      message.success(editing ? "更新成功" : "新增成功");
      setDrawerOpen(false);
      setEditing(null);
      fetchNotes(1, selectedBrandId, selectedDeviceTypeId, keyword, true);
    } catch {
      message.error("网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/plc/notes/${id}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) {
        message.error(d.error || "删除失败");
        return;
      }
      message.success("删除成功");
      fetchNotes(1, selectedBrandId, selectedDeviceTypeId, keyword, true);
    } catch {
      message.error("网络错误");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-base font-medium">笔记管理</span>
          <div className="flex items-center gap-3">
            <Input.Search
              placeholder="搜索标题"
              allowClear
              onSearch={(v) => setKeyword(v.trim())}
              style={{ width: 240 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
              新增
            </Button>
          </div>
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
        <List
          dataSource={notes}
          loading={loading && notes.length === 0}
          locale={{ emptyText: <Empty description="暂无笔记" /> }}
          renderItem={(note) => {
            const model =
              note.deviceModelId != null
                ? deviceModelMap.get(note.deviceModelId)
                : undefined;
            return (
              <List.Item
                actions={[
                  <Button
                    key="view"
                    type="text"
                    title="查看"
                    icon={<EyeOutlined />}
                    onClick={() => openViewModal(note)}
                  />,
                  <Button
                    key="edit"
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => openEditModal(note)}
                  />,
                  <Popconfirm
                    key="del"
                    title="确认删除该笔记？"
                    onConfirm={() => handleDelete(note.id)}
                    okText="删除"
                    cancelText="取消"
                  >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]}
              >
                <div className="w-full">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-base">{note.title}</span>
                    {model && (
                      <>
                        <Tag color="blue">{brandMap.get(model.brandId) ?? "-"}</Tag>
                        <Tag color="green">
                          {deviceTypeMap.get(model.deviceTypeId) ?? "-"}
                        </Tag>
                        <Tag>{model.name}</Tag>
                      </>
                    )}
                  </div>
                  <div className="text-gray-400 text-xs mb-1">
                    {dayjs(note.createdAt).format("YYYY-MM-DD HH:mm")}
                  </div>
                  {note.content && (
                    <div className="text-gray-600 text-sm line-clamp-2">
                      {stripHtml(note.content)}
                    </div>
                  )}
                </div>
              </List.Item>
            );
          }}
        />
        <div
          ref={sentinelRef}
          className="h-10 flex items-center justify-center text-gray-400 text-sm"
        >
          {loading && notes.length > 0 ? (
            <Spin size="small" />
          ) : hasMore ? (
            "下拉加载更多"
          ) : notes.length > 0 ? (
            "已加载全部"
          ) : null}
        </div>
      </Card>

      <Drawer
        title={editing ? "编辑笔记" : "新增笔记"}
        placement="right"
        width="80%"
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
        }}
        destroyOnClose
        footer={
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setDrawerOpen(false);
                setEditing(null);
              }}
            >
              取消
            </Button>
            <Button type="primary" loading={submitting} onClick={() => form.submit()}>
              确认
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" className="pt-4" onFinish={handleSubmit}>
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: "请输入标题" }]}
          >
            <Input placeholder="请输入标题" maxLength={200} />
          </Form.Item>
          <Form.Item name="deviceModelId" label="设备型号">
            <Select
              placeholder="请选择设备型号（可选）"
              showSearch
              allowClear
              optionFilterProp="label"
              options={deviceModels.map((m) => ({ label: m.name, value: m.id }))}
            />
          </Form.Item>
          <Form.Item label="内容">
            <RichTextEditor initialContent={contentHtml} onChange={setContentHtml} />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="查看笔记"
        placement="right"
        width="80%"
        open={viewing !== null}
        onClose={() => setViewing(null)}
        destroyOnClose
        footer={
          <div className="flex justify-end">
            <Button onClick={() => setViewing(null)}>关闭</Button>
          </div>
        }
      >
        {viewing && (
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-medium text-lg">{viewing.title}</span>
              {(() => {
                const model =
                  viewing.deviceModelId != null
                    ? deviceModelMap.get(viewing.deviceModelId)
                    : undefined;
                if (!model) return null;
                return (
                  <>
                    <Tag color="blue">{brandMap.get(model.brandId) ?? "-"}</Tag>
                    <Tag color="green">
                      {deviceTypeMap.get(model.deviceTypeId) ?? "-"}
                    </Tag>
                    <Tag>{model.name}</Tag>
                  </>
                );
              })()}
            </div>
            <div className="text-gray-400 text-xs mb-4">
              创建：{dayjs(viewing.createdAt).format("YYYY-MM-DD HH:mm")}
              {viewing.updatedAt &&
                viewing.updatedAt !== viewing.createdAt &&
                ` ｜ 更新：${dayjs(viewing.updatedAt).format("YYYY-MM-DD HH:mm")}`}
            </div>
            {viewing.content ? (
              <RichTextEditor
                key={viewing.id}
                initialContent={viewing.content}
                readOnly
              />
            ) : (
              <Empty description="暂无内容" />
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
