"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card, Row, Col, DatePicker, Input, Button, Space, message, Typography, Tag, Spin,
  Radio, Statistic,
} from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, Legend,
} from "recharts";
import dayjs from "dayjs";
import WordCloud from "@/components/word-cloud";

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface Distribution {
  value?: number;
  label?: string;
  count: number;
}

interface StatsData {
  total: number;
  sumDistribution: Distribution[];
  spanDistribution: Distribution[];
  acDistribution: Distribution[];
  bigSmallDistribution: Distribution[];
  oddEvenDistribution: Distribution[];
  threeZoneDistribution: Distribution[];
  route012Distribution: Distribution[];
}

const RATIO_ORDER: Record<string, number> = {
  "0:6":1,"1:5":2,"2:4":3,"3:3":4,"4:2":5,"5:1":6,"6:0":7,
  "0:0:6":1,"0:1:5":2,"0:2:4":3,"0:3:3":4,"0:4:2":5,"0:5:1":6,"0:6:0":7,
  "1:0:5":8,"1:1:4":9,"1:2:3":10,"1:3:2":11,"1:4:1":12,"1:5:0":13,
  "2:0:4":14,"2:1:3":15,"2:2:2":16,"2:3:1":17,"2:4:0":18,
  "3:0:3":19,"3:1:2":20,"3:2:1":21,"3:3:0":22,
  "4:0:2":23,"4:1:1":24,"4:2:0":25,
  "5:0:1":26,"5:1:0":27,"6:0:0":28,
};

function sortRatio(a: Distribution, b: Distribution): number {
  const aKey = a.label || "";
  const bKey = b.label || "";
  return (RATIO_ORDER[aKey] || 99) - (RATIO_ORDER[bKey] || 99);
}

const lineColors = ["#1890ff", "#52c41a", "#fa8c16"];

export default function StatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);

  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [codeFrom, setCodeFrom] = useState("");
  const [codeTo, setCodeTo] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange) {
        params.set("dateFrom", dateRange[0]);
        params.set("dateTo", dateRange[1]);
      }
      if (codeFrom) params.set("codeFrom", codeFrom);
      if (codeTo) params.set("codeTo", codeTo);

      const res = await fetch(`/api/stats?${params.toString()}`);
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      } else {
        message.error(data.error || "查询失败");
      }
    } catch {
      message.error("网络错误");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleReset = () => {
    setDateRange(null);
    setCodeFrom("");
    setCodeTo("");
    setTimeout(() => fetchStats(), 0);
  };

  // ---- 冷热号 ----
  const [coldHot, setColdHot] = useState<any>(null);
  const [periods, setPeriods] = useState(30);

  const fetchColdHot = async (p?: number) => {
    const n = p ?? periods;
    try {
      const res = await fetch(`/api/stats/cold-hot?periods=${n}`);
      const data = await res.json();
      if (res.ok) setColdHot(data);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchColdHot(); }, []);
  // ------------------

  const chartHeight = 280;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 max-w-screen-2xl mx-auto">
        {/* 筛选栏 */}
        <Card size="small" className="mb-4"
          title={<span className="font-medium">筛选条件</span>}
          extra={
            <Space>
              <Button icon={<ReloadOutlined />} size="small" onClick={handleReset}>重置</Button>
              <Button type="primary" icon={<SearchOutlined />} size="small" onClick={fetchStats}>查询</Button>
            </Space>
          }
        >
          <Space wrap>
            <RangePicker
              size="small"
              placeholder={["开始日期", "结束日期"]}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0].format("YYYY-MM-DD"), dates[1].format("YYYY-MM-DD")]);
                } else {
                  setDateRange(null);
                }
              }}
            />
            <Input
              size="small" placeholder="起始期号" style={{ width: 120 }}
              value={codeFrom} onChange={(e) => setCodeFrom(e.target.value)}
            />
            <span className="text-gray-400">-</span>
            <Input
              size="small" placeholder="结束期号" style={{ width: 120 }}
              value={codeTo} onChange={(e) => setCodeTo(e.target.value)}
            />
          </Space>
        </Card>

        <Spin spinning={loading}>
          {stats && (
            <>
              {/* 总览 */}
              <Card size="small" className="mb-4">
                <Title level={5} className="!mb-0">
                  统计范围：<Tag color="blue">{stats.total} 条记录</Tag>
                </Title>
              </Card>

              {/* 曲线图：和值、跨度、AC值 */}
              <Row gutter={[12, 12]} className="mb-4">
                <Col xs={24} lg={8}>
                  <Card size="small" title="和值分布">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <LineChart data={stats.sumDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="value" fontSize={11} />
                        <YAxis fontSize={11} />
                        <ReTooltip />
                        <Line type="monotone" dataKey="count" stroke={lineColors[0]} dot={false} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
                <Col xs={24} lg={8}>
                  <Card size="small" title="跨度分布">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <LineChart data={stats.spanDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="value" fontSize={11} />
                        <YAxis fontSize={11} />
                        <ReTooltip />
                        <Line type="monotone" dataKey="count" stroke={lineColors[1]} dot={false} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
                <Col xs={24} lg={8}>
                  <Card size="small" title="AC值分布">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <LineChart data={stats.acDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="value" fontSize={11} />
                        <YAxis fontSize={11} />
                        <ReTooltip />
                        <Line type="monotone" dataKey="count" stroke={lineColors[2]} dot={false} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
              </Row>

              {/* 柱状图：大小比、奇偶比、三区比、012路比 */}
              <Row gutter={[12, 12]}>
                <Col xs={24} lg={12}>
                  <Card size="small" title="大小比分布">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <BarChart data={(stats.bigSmallDistribution || []).slice().sort(sortRatio)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" fontSize={11} />
                        <YAxis fontSize={11} />
                        <ReTooltip />
                        <Bar dataKey="count" fill="#1890ff" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card size="small" title="奇偶比分布">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <BarChart data={(stats.oddEvenDistribution || []).slice().sort(sortRatio)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" fontSize={11} />
                        <YAxis fontSize={11} />
                        <ReTooltip />
                        <Bar dataKey="count" fill="#52c41a" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card size="small" title="三区比分布">
                    <ResponsiveContainer width="100%" height={380}>
                      <BarChart data={(stats.threeZoneDistribution || []).slice().sort(sortRatio)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" fontSize={10} angle={-45} textAnchor="end" height={80} />
                        <YAxis fontSize={11} />
                        <ReTooltip />
                        <Bar dataKey="count" fill="#fa8c16" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card size="small" title="012路比分布">
                    <ResponsiveContainer width="100%" height={380}>
                      <BarChart data={(stats.route012Distribution || []).slice().sort(sortRatio)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" fontSize={10} angle={-45} textAnchor="end" height={80} />
                        <YAxis fontSize={11} />
                        <ReTooltip />
                        <Bar dataKey="count" fill="#722ed1" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
              </Row>

              {/* 冷热号分析 */}
              <Row gutter={[12, 12]} className="mt-4">
                <Col span={24}>
                  <Card
                    size="small"
                    title="冷温热号码分析"
                    extra={
                      <Space>
                        <Radio.Group
                          value={periods}
                          size="small"
                          onChange={(e) => {
                            const v = e.target.value;
                            setPeriods(v);
                            fetchColdHot(v);
                          }}
                        >
                          <Radio.Button value={20}>短期(20)</Radio.Button>
                          <Radio.Button value={50}>中期(50)</Radio.Button>
                          <Radio.Button value={100}>长期(100)</Radio.Button>
                        </Radio.Group>
                      </Space>
                    }
                  >
                    {coldHot && (
                      <>
                        <Row gutter={16} className="mb-4">
                          <Col>
                            <Statistic title="统计期数" value={coldHot.totalRecords} suffix="期" />
                          </Col>
                          <Col>
                            <Statistic title="最新期号" value={coldHot.latestCode} />
                          </Col>
                          <Col>
                            <Statistic title="红球理论均值" value={coldHot.redAvg} precision={1} suffix="次" />
                          </Col>
                          <Col>
                            <Statistic title="蓝球理论均值" value={coldHot.blueAvg} precision={1} suffix="次" />
                          </Col>
                        </Row>
                        <Row gutter={[16, 16]}>
                          <Col xs={24} lg={16}>
                            <WordCloud
                              items={coldHot.redStats || []}
                              type="red"
                              title="红球冷温热分布 (01-33)"
                            />
                          </Col>
                          <Col xs={24} lg={8}>
                            <WordCloud
                              items={coldHot.blueStats || []}
                              type="blue"
                              title="蓝球冷温热分布 (01-16)"
                            />
                          </Col>
                        </Row>
                      </>
                    )}
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Spin>
      </div>
    </div>
  );
}
