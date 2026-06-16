"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Table, Button, InputNumber, Select, Card, Row, Col, Space,
  Tooltip, message, Tag, Typography,
} from "antd";
import { SearchOutlined, ReloadOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { RedBalls } from "@/components/ball";

const { Title } = Typography;

interface SearchRecord {
  id: number;
  red1: number; red2: number; red3: number;
  red4: number; red5: number; red6: number;
  sumValue: number;
  bigSmallRatio: string;
  oddEvenRatio: string;
  span: number;
  threeZoneRatio: string;
  acValue: number;
  route012Ratio: string;
}

// 固定选项列表（有序）
const BIG_SMALL_OPTIONS = ["3:3", "4:2", "2:4", "5:1", "1:5", "0:6", "6:0"];
const ODD_EVEN_OPTIONS = ["3:3", "4:2", "2:4", "5:1", "1:5", "0:6", "6:0"];
const THREE_ZONE_OPTIONS = [
  "0:0:6", "0:1:5", "0:2:4", "0:3:3", "0:4:2", "0:5:1", "0:6:0",
  "1:0:5", "1:1:4", "1:2:3", "1:3:2", "1:4:1", "1:5:0",
  "2:0:4", "2:1:3", "2:2:2", "2:3:1", "2:4:0",
  "3:0:3", "3:1:2", "3:2:1", "3:3:0",
  "4:0:2", "4:1:1", "4:2:0",
  "5:0:1", "5:1:0",
  "6:0:0",
];
const ROUTE_012_OPTIONS = [
  "0:0:6", "0:1:5", "0:2:4", "0:3:3", "0:4:2", "0:5:1", "0:6:0",
  "1:0:5", "1:1:4", "1:2:3", "1:3:2", "1:4:1", "1:5:0",
  "2:0:4", "2:1:3", "2:2:2", "2:3:1", "2:4:0",
  "3:0:3", "3:1:2", "3:2:1", "3:3:0",
  "4:0:2", "4:1:1", "4:2:0",
  "5:0:1", "5:1:0",
  "6:0:0",
];

const INDICATOR_TIPS: Record<string, string> = {
  sum: "6个红球之和，范围21-183，75-130 (常见区间)",
  big_small: "大号(17-33):小号(01-16)",
  odd_even: "奇数:偶数",
  span: "最大号-最小号，范围5-32，20-30 (常见)",
  three_zone: "一区(01-11):二区(12-22):三区(23-33)",
  ac: "号码离散度指标，范围0-10，常见区间6-10",
  route_012: "除3余0:除3余1:除3余2",
};

const selectProps = {
  mode: "multiple" as const,
  allowClear: true,
  maxTagCount: 3,
  style: { minWidth: 200 },
  size: "small" as const,
  placeholder: "请选择",
};

export default function SearchPage() {
  const router = useRouter();
  const [records, setRecords] = useState<SearchRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [loading, setLoading] = useState(false);
  const initialLoaded = useRef(false);

  // 筛选条件 — 初始默认值
  const [sumMin, setSumMin] = useState<number | null>(75);
  const [sumMax, setSumMax] = useState<number | null>(130);
  const [spanMin, setSpanMin] = useState<number | null>(20);
  const [spanMax, setSpanMax] = useState<number | null>(30);
  const [acMin, setAcMin] = useState<number | null>(6);
  const [acMax, setAcMax] = useState<number | null>(10);
  const [bigSmall, setBigSmall] = useState<string[]>(["3:3", "4:2", "2:4"]);
  const [oddEven, setOddEven] = useState<string[]>(["3:3", "4:2", "2:4"]);
  const [threeZone, setThreeZone] = useState<string[]>(["1:2:3", "1:3:2", "2:1:3", "2:2:2", "2:3:1", "3:1:2", "3:2:1"]);
  const [route012, setRoute012] = useState<string[]>(["1:2:3", "1:3:2", "2:1:3", "2:2:2", "2:3:1", "3:1:2", "3:2:1"]);

  // 初始化时自动查询一次
  useEffect(() => {
    if (!initialLoaded.current) {
      initialLoaded.current = true;
      doFetch(1, pageSize);
    }
  }, []);

  const doFetch = useCallback(async (p: number, ps: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("pageSize", String(ps));
      if (sumMin !== null) params.set("sum_min", String(sumMin));
      if (sumMax !== null) params.set("sum_max", String(sumMax));
      if (spanMin !== null) params.set("span_min", String(spanMin));
      if (spanMax !== null) params.set("span_max", String(spanMax));
      if (acMin !== null) params.set("ac_min", String(acMin));
      if (acMax !== null) params.set("ac_max", String(acMax));
      if (bigSmall.length > 0) params.set("big_small", bigSmall.join(","));
      if (oddEven.length > 0) params.set("odd_even", oddEven.join(","));
      if (threeZone.length > 0) params.set("three_zone", threeZone.join(","));
      if (route012.length > 0) params.set("route_012", route012.join(","));

      const res = await fetch(`/api/search?${params.toString()}`);
      if (res.status === 401) { router.push("/login"); return; }
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
  }, [sumMin, sumMax, spanMin, spanMax, acMin, acMax,
      bigSmall, oddEven, threeZone, route012, router]);

  const handleSearch = () => {
    setPage(1);
    doFetch(1, pageSize);
  };

  const handlePageChange = (p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
    doFetch(p, ps);
  };

  const handleReset = () => {
    setSumMin(75); setSumMax(130);
    setSpanMin(20); setSpanMax(30);
    setAcMin(6); setAcMax(10);
    setBigSmall(["3:3", "4:2", "2:4"]);
    setOddEven(["3:3", "4:2", "2:4"]);
    setThreeZone(["1:2:3", "1:3:2", "2:1:3", "2:2:2", "2:3:1", "3:1:2", "3:2:1"]);
    setRoute012(["1:2:3", "1:3:2", "2:1:3", "2:2:2", "2:3:1", "3:1:2", "3:2:1"]);
    setPage(1);
    doFetch(1, pageSize);
  };

  const labelWithTip = (label: string, tipKey: string) => (
    <span>
      {label}{" "}
      <Tooltip title={INDICATOR_TIPS[tipKey]}>
        <QuestionCircleOutlined className="text-gray-400 text-xs cursor-help" />
      </Tooltip>
    </span>
  );

  const columns = [
    { title: "序号", dataIndex: "id", key: "id", width: 80 },
    {
      title: "红球", key: "reds", width: 210,
      render: (_: any, r: SearchRecord) => (
        <RedBalls numbers={[r.red1, r.red2, r.red3, r.red4, r.red5, r.red6]} size="small" />
      ),
    },
    { title: "和值", dataIndex: "sumValue", key: "sumValue", width: 70, align: "center" as const },
    { title: "大小比", dataIndex: "bigSmallRatio", key: "bigSmallRatio", width: 80, align: "center" as const },
    { title: "奇偶比", dataIndex: "oddEvenRatio", key: "oddEvenRatio", width: 80, align: "center" as const },
    { title: "跨度", dataIndex: "span", key: "span", width: 70, align: "center" as const },
    { title: "三区比", dataIndex: "threeZoneRatio", key: "threeZoneRatio", width: 90, align: "center" as const },
    { title: "AC值", dataIndex: "acValue", key: "acValue", width: 70, align: "center" as const },
    { title: "012路比", dataIndex: "route012Ratio", key: "route012Ratio", width: 90, align: "center" as const },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 max-w-screen-2xl mx-auto">
        {/* 筛选面板 */}
        <Card
          size="small"
          className="mb-4"
          title={<span className="font-medium">技术指标筛选</span>}
          extra={
            <Space>
              <Button icon={<ReloadOutlined />} size="small" onClick={handleReset}>重置</Button>
              <Button type="primary" icon={<SearchOutlined />} size="small" onClick={handleSearch}>查询</Button>
            </Space>
          }
        >
          <Row gutter={[16, 12]}>
            {/* 和值 */}
            <Col xs={24} sm={12} lg={6}>
              <div className="mb-1">{labelWithTip("和值", "sum")}</div>
              <InputNumber placeholder="最小" min={21} max={183} value={sumMin}
                onChange={(v) => setSumMin(v)} style={{ width: 90 }} size="small" />
              <span className="mx-2 text-gray-400">-</span>
              <InputNumber placeholder="最大" min={21} max={183} value={sumMax}
                onChange={(v) => setSumMax(v)} style={{ width: 90 }} size="small" />
            </Col>

            {/* 跨度 */}
            <Col xs={24} sm={12} lg={6}>
              <div className="mb-1">{labelWithTip("跨度", "span")}</div>
              <InputNumber placeholder="最小" min={5} max={32} value={spanMin}
                onChange={(v) => setSpanMin(v)} style={{ width: 90 }} size="small" />
              <span className="mx-2 text-gray-400">-</span>
              <InputNumber placeholder="最大" min={5} max={32} value={spanMax}
                onChange={(v) => setSpanMax(v)} style={{ width: 90 }} size="small" />
            </Col>

            {/* AC值 */}
            <Col xs={24} sm={12} lg={6}>
              <div className="mb-1">{labelWithTip("AC值", "ac")}</div>
              <InputNumber placeholder="最小" min={0} max={10} value={acMin}
                onChange={(v) => setAcMin(v)} style={{ width: 90 }} size="small" />
              <span className="mx-2 text-gray-400">-</span>
              <InputNumber placeholder="最大" min={0} max={10} value={acMax}
                onChange={(v) => setAcMax(v)} style={{ width: 90 }} size="small" />
            </Col>

            {/* 大小比 */}
            <Col xs={24} sm={12} lg={6}>
              <div className="mb-1">{labelWithTip("大小比", "big_small")}</div>
              <Select
                {...selectProps}
                value={bigSmall}
                onChange={(v) => setBigSmall(v)}
                options={BIG_SMALL_OPTIONS.map((v) => ({ label: v, value: v }))}
              />
            </Col>

            {/* 奇偶比 */}
            <Col xs={24} sm={12} lg={6}>
              <div className="mb-1">{labelWithTip("奇偶比", "odd_even")}</div>
              <Select
                {...selectProps}
                value={oddEven}
                onChange={(v) => setOddEven(v)}
                options={ODD_EVEN_OPTIONS.map((v) => ({ label: v, value: v }))}
              />
            </Col>

            {/* 三区比 */}
            <Col xs={24} sm={12} lg={6}>
              <div className="mb-1">{labelWithTip("三区比", "three_zone")}</div>
              <Select
                {...selectProps}
                value={threeZone}
                onChange={(v) => setThreeZone(v)}
                options={THREE_ZONE_OPTIONS.map((v) => ({ label: v, value: v }))}
              />
            </Col>

            {/* 012路比 */}
            <Col xs={24} sm={12} lg={6}>
              <div className="mb-1">{labelWithTip("012路比", "route_012")}</div>
              <Select
                {...selectProps}
                value={route012}
                onChange={(v) => setRoute012(v)}
                options={ROUTE_012_OPTIONS.map((v) => ({ label: v, value: v }))}
              />
            </Col>
          </Row>
        </Card>

        {/* 结果表格 */}
        <Card size="small">
          <div className="flex items-center justify-between mb-3">
            <Title level={5} className="!mb-0">
              查询结果
              {total > 0 && (
                <Tag color="blue" className="ml-2">{total.toLocaleString()} 条</Tag>
              )}
            </Title>
          </div>
          <Table
            dataSource={records}
            columns={columns}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1000 }}
            size="small"
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: ["10", "30", "50", "100"],
              showTotal: (t) => `共 ${t.toLocaleString()} 条`,
              onChange: (p, ps) => handlePageChange(p, ps),
            }}
          />
        </Card>
      </div>
    </div>
  );
}
