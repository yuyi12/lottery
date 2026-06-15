"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  Button,
  Input,
  DatePicker,
  Space,
  message,
  Popconfirm,
  Typography,
  Card,
} from "antd";
import { PlusOutlined, LogoutOutlined, SearchOutlined } from "@ant-design/icons";
import { RedBalls, BlueBall } from "@/components/ball";
import AddRecordModal from "@/components/add-record-modal";
import dayjs from "dayjs";

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface RecordItem {
  id: number;
  code: string;
  drawDate: string;
  red1: number;
  red2: number;
  red3: number;
  red4: number;
  red5: number;
  red6: number;
  blue: number;
  sumValue: number;
  bigSmallRatio: string;
  oddEvenRatio: string;
  span: number;
  threeZoneRatio: string;
  acValue: number;
  route012Ratio: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // 筛选条件
  const [searchCode, setSearchCode] = useState("");
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (searchCode) params.set("code", searchCode);
      if (dateRange) {
        params.set("dateFrom", dateRange[0]);
        params.set("dateTo", dateRange[1]);
      }

      const res = await fetch(`/api/records?${params.toString()}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setRecords(data.data);
        setTotal(data.total);
      } else {
        message.error(data.error || "查询失败");
      }
    } catch {
      message.error("网络错误");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchCode, dateRange, router]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleLogout = () => {
    document.cookie = "token=; path=/; max-age=0";
    router.push("/login");
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/records/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        message.success("删除成功");
        fetchRecords();
      } else {
        message.error(data.error || "删除失败");
      }
    } catch {
      message.error("网络错误");
    }
  };

  const columns = [
    {
      title: "期号",
      dataIndex: "code",
      key: "code",
      width: 100,
    },
    {
      title: "开奖日期",
      dataIndex: "drawDate",
      key: "drawDate",
      width: 120,
    },
    {
      title: "红球",
      key: "reds",
      width: 200,
      render: (_: any, record: RecordItem) => (
        <RedBalls
          numbers={[
            record.red1,
            record.red2,
            record.red3,
            record.red4,
            record.red5,
            record.red6,
          ]}
        />
      ),
    },
    {
      title: "蓝球",
      key: "blue",
      width: 70,
      render: (_: any, record: RecordItem) => <BlueBall number={record.blue} />,
    },
    {
      title: "和值",
      dataIndex: "sumValue",
      key: "sumValue",
      width: 70,
      align: "center" as const,
    },
    {
      title: "大小比",
      dataIndex: "bigSmallRatio",
      key: "bigSmallRatio",
      width: 80,
      align: "center" as const,
    },
    {
      title: "奇偶比",
      dataIndex: "oddEvenRatio",
      key: "oddEvenRatio",
      width: 80,
      align: "center" as const,
    },
    {
      title: "跨度",
      dataIndex: "span",
      key: "span",
      width: 70,
      align: "center" as const,
    },
    {
      title: "三区比",
      dataIndex: "threeZoneRatio",
      key: "threeZoneRatio",
      width: 90,
      align: "center" as const,
    },
    {
      title: "AC值",
      dataIndex: "acValue",
      key: "acValue",
      width: 70,
      align: "center" as const,
    },
    {
      title: "012路比",
      dataIndex: "route012Ratio",
      key: "route012Ratio",
      width: 90,
      align: "center" as const,
    },
    {
      title: "操作",
      key: "action",
      width: 80,
      fixed: "right" as const,
      render: (_: any, record: RecordItem) => (
        <Popconfirm
          title="确认删除"
          description={`确定删除期号 ${record.code} 的记录吗？`}
          onConfirm={() => handleDelete(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" danger size="small">
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶栏 */}
      <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <Title level={4} className="!mb-0">
          双色球历史中奖记录
        </Title>
        <Button
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          type="text"
        >
          退出登录
        </Button>
      </div>

      <div className="p-6">
        <Card className="mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Input
              placeholder="搜索期号"
              prefix={<SearchOutlined />}
              value={searchCode}
              onChange={(e) => {
                setSearchCode(e.target.value);
                setPage(1);
              }}
              style={{ width: 180 }}
              allowClear
            />
            <RangePicker
              placeholder={["开始日期", "结束日期"]}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([
                    dates[0].format("YYYY-MM-DD"),
                    dates[1].format("YYYY-MM-DD"),
                  ]);
                } else {
                  setDateRange(null);
                }
                setPage(1);
              }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalOpen(true)}
            >
              新增记录
            </Button>
          </div>
        </Card>

        <Card>
          <Table
            dataSource={records}
            columns={columns}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1400 }}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条记录`,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
          />
        </Card>
      </div>

      <AddRecordModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          fetchRecords();
        }}
      />
    </div>
  );
}
