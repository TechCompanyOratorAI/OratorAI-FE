import React from "react";
import { Card, Progress, Space, Statistic, Tag, Typography } from "antd";

const { Text } = Typography;

export type SummaryMetricTone = "blue" | "green" | "amber" | "purple" | "red";

export interface SummaryMetricItem {
    key: string;
    title: string;
    value: number | string;
    suffix?: string;
    icon?: React.ReactNode;
    tone?: SummaryMetricTone;
    loading?: boolean;
    deltaLabel?: string;
    deltaType?: "success" | "warning" | "error" | "default";
    progress?: number;
    description?: string;
}

interface SummaryMetricsProps {
    items: SummaryMetricItem[];
    columnsClassName?: string;
}

const toneClass: Record<SummaryMetricTone, { bg: string; text: string; ring: string }> = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-100" },
    green: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-100" },
    purple: { bg: "bg-violet-50", text: "text-violet-600", ring: "ring-violet-100" },
    red: { bg: "bg-rose-50", text: "text-rose-600", ring: "ring-rose-100" },
};

const SummaryMetrics: React.FC<SummaryMetricsProps> = ({
    items,
    columnsClassName = "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4",
}) => {
    return (
        <div className={columnsClassName}>
            {items.map((item) => {
                const tone = toneClass[item.tone || "blue"];
                const progressValue = typeof item.progress === "number" ? Math.max(0, Math.min(100, item.progress)) : undefined;

                return (
                    <Card
                        key={item.key}
                        size="small"
                        className="rounded-2xl border-slate-200 shadow-sm"
                        styles={{ body: { padding: 16 } }}
                    >
                        <Space direction="vertical" size={10} className="w-full">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <Text type="secondary" className="text-xs uppercase tracking-wide font-semibold">
                                        {item.title}
                                    </Text>
                                    <Statistic
                                        value={item.loading ? "..." : item.value}
                                        suffix={item.suffix}
                                        valueStyle={{ fontSize: 28, lineHeight: 1.1, fontWeight: 700 }}
                                    />
                                </div>

                                {item.icon && (
                                    <div className={`h-11 w-11 rounded-xl ${tone.bg} ${tone.text} ring-1 ${tone.ring} flex items-center justify-center shrink-0`}>
                                        {item.icon}
                                    </div>
                                )}
                            </div>

                            {(item.deltaLabel || item.description) && (
                                <div className="flex items-center justify-between gap-2">
                                    {item.deltaLabel ? (
                                        <Tag color={item.deltaType || "default"} className="!m-0 rounded-full text-[11px]">
                                            {item.deltaLabel}
                                        </Tag>
                                    ) : (
                                        <span />
                                    )}
                                    {item.description && (
                                        <Text type="secondary" className="text-xs text-right">
                                            {item.description}
                                        </Text>
                                    )}
                                </div>
                            )}

                            {typeof progressValue === "number" && (
                                <Progress percent={progressValue} showInfo={false} strokeLinecap="round" />
                            )}
                        </Space>
                    </Card>
                );
            })}
        </div>
    );
};

export default SummaryMetrics;
