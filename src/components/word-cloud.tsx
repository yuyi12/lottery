"use client";

interface WordCloudItem {
  number: number;
  count: number;
  level: "hot" | "warm" | "cold";
  levelLabel: string;
  missing: number;
}

interface WordCloudProps {
  items: WordCloudItem[];
  type: "red" | "blue";
  title: string;
}

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  hot:  { bg: "#fff1f0", text: "#cf1322", border: "#ff4d4f" },
  warm: { bg: "#fff7e6", text: "#d46b08", border: "#fa8c16" },
  cold: { bg: "#e6f7ff", text: "#096dd9", border: "#1890ff" },
};

export default function WordCloud({ items, type, title }: WordCloudProps) {
  const maxCount = Math.max(...items.map((i) => i.count), 1);

  const getSize = (count: number) => {
    const ratio = count / maxCount;
    return 28 + ratio * 52; // 28px - 80px
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="font-medium text-sm">{title}</span>
        <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-600">热号</span>
        <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-600">温号</span>
        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-600">冷号</span>
      </div>
      <div className="flex flex-wrap gap-2 justify-center items-center p-3 bg-gray-50 rounded-lg min-h-[200px]">
        {items.map((item) => {
          const size = getSize(item.count);
          const colors = LEVEL_COLORS[item.level];
          return (
            <div
              key={item.number}
              className="flex flex-col items-center justify-center rounded-full border-2 cursor-default transition-transform hover:scale-110"
              style={{
                width: size,
                height: size,
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              }}
              title={`${item.number}: 出现${item.count}次, 遗漏${item.missing}期 (${item.levelLabel})`}
            >
              <span
                className="font-bold leading-none"
                style={{ fontSize: size * 0.38 }}
              >
                {String(item.number).padStart(2, "0")}
              </span>
              <span
                className="leading-none opacity-70"
                style={{ fontSize: size * 0.22 }}
              >
                {item.count}次
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
