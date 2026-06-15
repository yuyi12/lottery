"use client";

import { useState } from "react";
import { Modal, Input, message } from "antd";

const { TextArea } = Input;

interface AddRecordModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function AddRecordModal({
  open,
  onCancel,
  onSuccess,
}: AddRecordModalProps) {
  const [jsonText, setJsonText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    if (!jsonText.trim()) {
      message.warning("请输入 JSON 数据");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: jsonText.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        message.error(data.error || "新增失败");
        return;
      }

      message.success(`期号 ${data.code} 新增成功`);
      setJsonText("");
      onSuccess();
    } catch {
      message.error("网络错误");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setJsonText("");
    onCancel();
  };

  return (
    <Modal
      title="新增中奖记录"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="确认新增"
      cancelText="取消"
      width={600}
      destroyOnClose
    >
      <div className="py-4">
        <p className="text-gray-500 mb-3 text-sm">
          粘贴原始 JSON 数据，支持以下格式：
        </p>
        <ul className="text-gray-400 text-xs mb-3 list-disc pl-4 space-y-1">
          <li>直接格式: &#123;&quot;code&quot;:&quot;2026067&quot;,&quot;date&quot;:&quot;2026-06-14&quot;,&quot;red&quot;:&quot;04,19,27,29,30,32&quot;,&quot;blue&quot;:&quot;13&quot;&#125;</li>
          <li>封装格式: 含 result 数组的完整响应 JSON</li>
        </ul>
        <TextArea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder='{"code":"2026067","date":"2026-06-14","red":"04,19,27,29,30,32","blue":"13"}'
          rows={8}
          className="font-mono text-sm"
        />
      </div>
    </Modal>
  );
}
