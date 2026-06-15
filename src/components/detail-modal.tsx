"use client";

import { Modal, Table, Descriptions, Empty, Divider } from "antd";
import { RedBalls, BlueBall } from "@/components/ball";

interface DetailModalProps {
  open: boolean;
  record: RecordItem | null;
  onClose: () => void;
}

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
  prizegrades?: Array<{ type: number; typenum: string; typemoney: string }>;
  content?: string;
  poolmoney?: string;
}

const PRIZE_NAMES: Record<number, string> = {
  1: "一等奖",
  2: "二等奖",
  3: "三等奖",
  4: "四等奖",
  5: "五等奖",
  6: "六等奖",
  7: "其它",
};

export default function DetailModal({ open, record, onClose }: DetailModalProps) {
  if (!record) return null;

  const prizeColumns = [
    {
      title: "奖项",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type: number) => PRIZE_NAMES[type] || `未知(${type})`,
    },
    {
      title: "中奖注数",
      dataIndex: "typenum",
      key: "typenum",
      width: 120,
      align: "center" as const,
      render: (v: string) => v || "-",
    },
    {
      title: "单注奖金(元)",
      dataIndex: "typemoney",
      key: "typemoney",
      width: 150,
      align: "right" as const,
      render: (v: string) => (v ? Number(v).toLocaleString() : "-"),
    },
  ];

  return (
    <Modal
      title={`期号 ${record.code} 详情`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      destroyOnClose
    >
      <div className="py-2">
        {/* 基础信息 */}
        <Descriptions column={2} size="small" bordered className="mb-4">
          <Descriptions.Item label="期号">{record.code}</Descriptions.Item>
          <Descriptions.Item label="开奖日期">{record.drawDate}</Descriptions.Item>
          <Descriptions.Item label="红球">
            <RedBalls
              numbers={[
                record.red1, record.red2, record.red3,
                record.red4, record.red5, record.red6,
              ]}
              size="small"
            />
          </Descriptions.Item>
          <Descriptions.Item label="蓝球">
            <BlueBall number={record.blue} size="small" />
          </Descriptions.Item>
          <Descriptions.Item label="和值">{record.sumValue}</Descriptions.Item>
          <Descriptions.Item label="跨度">{record.span}</Descriptions.Item>
          <Descriptions.Item label="大小比">{record.bigSmallRatio}</Descriptions.Item>
          <Descriptions.Item label="奇偶比">{record.oddEvenRatio}</Descriptions.Item>
          <Descriptions.Item label="三区比">{record.threeZoneRatio}</Descriptions.Item>
          <Descriptions.Item label="AC值">{record.acValue}</Descriptions.Item>
          <Descriptions.Item label="012路比" span={2}>{record.route012Ratio}</Descriptions.Item>
        </Descriptions>

        {/* 一等奖中奖情况 */}
        {record.content && (
          <>
            <Divider orientation="left" className="!my-3 !text-sm">
              一等奖中奖情况
            </Divider>
            <p className="text-gray-700 mb-3 text-sm">{record.content}</p>
          </>
        )}

        {/* 奖池金额 */}
        {record.poolmoney && (
          <>
            <Divider orientation="left" className="!my-3 !text-sm">
              下期一等奖奖池累计金额
            </Divider>
            <p className="text-red-500 font-bold text-lg mb-3">
              ¥ {Number(record.poolmoney).toLocaleString()} 元
            </p>
          </>
        )}

        {/* 中奖情况表格 */}
        <Divider orientation="left" className="!my-3 !text-sm">
          中奖情况
        </Divider>
        {record.prizegrades && Array.isArray(record.prizegrades) && record.prizegrades.length > 0 ? (
          <Table
            dataSource={record.prizegrades}
            columns={prizeColumns}
            rowKey="type"
            pagination={false}
            size="small"
            bordered
          />
        ) : (
          <Empty description="暂无中奖详情" />
        )}
      </div>
    </Modal>
  );
}
