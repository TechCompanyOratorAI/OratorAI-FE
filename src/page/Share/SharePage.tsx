import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Alert, Card, Segmented, Typography } from "antd";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  FileText,
  ShieldCheck,
  User,
} from "lucide-react";
import {
  BarChartOutlined,
  ExclamationCircleOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchSharedPresentation } from "@/services/features/share/shareSlice";
import PresentationPlayer from "@/components/Presentation/PresentationPlayer";

const { Text, Title } = Typography;

const PALETTE = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  purple: "#8B5CF6",
  white: "#FFFFFF",
  slate: "#64748B",
  infoLight: "#DBEAFE",
  purpleLight: "#EDE9FE",
};

const SharePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const dispatch = useAppDispatch();
  const { sharedPresentation: presentation, sharedLoading, sharedError } =
    useAppSelector((s) => s.share);

  const [reportTab, setReportTab] = useState<"transcript" | "ai">(
    "transcript",
  );
  const [playerCurrentTime, setPlayerCurrentTime] = useState(0);

  useEffect(() => {
    if (token) {
      dispatch(fetchSharedPresentation(token));
    }
  }, [token, dispatch]);

  const criteriaScores = useMemo(() => {
    if (!presentation?.aiReport?.criterionScores) return [];
    return Object.values(presentation.aiReport.criterionScores).sort(
      (a, b) => a.criteriaId - b.criteriaId,
    );
  }, [presentation]);

  if (sharedLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#F8FAFC",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Đang tải bài thuyết trình...</p>
        </div>
      </div>
    );
  }

  if (sharedError || !presentation) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#F8FAFC",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">
              Không thể truy cập
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              {sharedError || "Link chia sẻ không hợp lệ hoặc đã hết hạn."}
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const studentName = presentation.presentation.student
    ? `${presentation.presentation.student.firstName || ""} ${presentation.presentation.student.lastName || ""}`.trim() ||
      "Student"
    : "Unknown";

  const transcriptSegments = [
    ...(presentation.presentation.transcript?.segments || []),
  ].sort((a, b) => a.segmentNumber - b.segmentNumber);

  const reportSegmentOptions = [
    { label: "Transcript", value: "transcript" },
    { label: "AI đánh giá", value: "ai" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <div
        style={{
          background: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldCheck size={16} color="#10B981" />
          <span style={{ fontSize: 12, color: "#64748B" }}>
            Đang xem bài thuyết trình được chia sẻ
          </span>
        </div>
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 14,
            color: PALETTE.primary,
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={16} />
          Về trang chủ
        </Link>
      </div>

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "20px 8px 32px",
        }}
      >
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Card
            style={{
              borderRadius: 20,
              border: "none",
              boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
            }}
            styles={{ body: { padding: "24px" } }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <Title level={2} style={{ margin: 0, fontWeight: 700, fontSize: 22 }}>
                  {presentation.presentation.title}
                </Title>
                {presentation.presentation.description && (
                  <Text
                    style={{
                      display: "block",
                      marginTop: 8,
                      color: PALETTE.slate,
                      fontSize: 14,
                    }}
                  >
                    {presentation.presentation.description}
                  </Text>
                )}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    borderRadius: 999,
                    background: "#EFF6FF",
                    padding: "8px 12px",
                    fontSize: 14,
                    color: PALETTE.primary,
                    fontWeight: 500,
                  }}
                >
                  <User size={14} />
                  {studentName}
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    borderRadius: 999,
                    background: "#ECFDF5",
                    padding: "8px 12px",
                    fontSize: 14,
                    color: "#047857",
                    fontWeight: 500,
                  }}
                >
                  <BookOpen size={14} />
                  {presentation.presentation.topic?.topicName || "Chưa có chủ đề"}
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    borderRadius: 999,
                    background: "#F1F5F9",
                    padding: "8px 12px",
                    fontSize: 14,
                    color: "#334155",
                    fontWeight: 500,
                  }}
                >
                  <FileText size={14} />
                  {presentation.aiReport ? "Có kết quả AI" : "Chưa có kết quả AI"}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{ marginTop: 16 }}
        >
          <PresentationPlayer
            slides={presentation.presentation.slides || []}
            audioRecord={presentation.presentation.audioRecord || null}
            title={presentation.presentation.title}
            description={presentation.presentation.description}
            status={presentation.presentation.status}
            studentName={studentName}
            createdAt={presentation.presentation.createdAt}
            showHeader={false}
            onTimeUpdate={setPlayerCurrentTime}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: 16 }}
        >
          <Card
            style={{
              borderRadius: 20,
              border: "none",
              boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
            }}
            styles={{ body: { padding: "24px 24px 20px" } }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: `${PALETTE.primary}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BarChartOutlined
                    style={{ fontSize: 18, color: PALETTE.primary }}
                  />
                </div>
                <div>
                  <Title
                    level={4}
                    style={{ margin: 0, fontWeight: 700, fontSize: 18 }}
                  >
                    Kết quả đánh giá
                  </Title>
                  {presentation.aiReport?.generatedAt && (
                    <Text style={{ fontSize: 12, color: PALETTE.slate }}>
                      {new Date(presentation.aiReport.generatedAt).toLocaleString(
                        "vi-VN",
                      )}
                    </Text>
                  )}
                </div>
              </div>
              <Segmented
                options={reportSegmentOptions}
                value={reportTab}
                onChange={(val) => setReportTab(val as "transcript" | "ai")}
                size="large"
              />
            </div>

            {reportTab === "transcript" ? (
              transcriptSegments.length ? (
                <div style={{ maxHeight: 520, overflowY: "auto", paddingRight: 4 }}>
                  {transcriptSegments.map((seg) => {
                    const speakerColors = [
                      PALETTE.primary,
                      PALETTE.success,
                      PALETTE.warning,
                      PALETTE.danger,
                      PALETTE.purple,
                    ];
                    const speakerIndex = seg.speaker?.aiSpeakerLabel
                      ? parseInt(
                          seg.speaker.aiSpeakerLabel.replace("SPEAKER_", ""),
                          10,
                        ) || 0
                      : 0;
                    const color = speakerColors[speakerIndex % speakerColors.length];
                    const mins = Math.floor(seg.startTimestamp / 60);
                    const secs = Math.floor(seg.startTimestamp % 60);
                    const timestamp = `${mins}:${String(secs).padStart(2, "0")}`;
                    const isActive =
                      playerCurrentTime >= seg.startTimestamp &&
                      playerCurrentTime < seg.endTimestamp;
                    const isPast = playerCurrentTime >= seg.endTimestamp;

                    return (
                      <div
                        key={seg.segmentId}
                        style={{
                          display: "flex",
                          gap: 12,
                          marginBottom: 4,
                          alignItems: "flex-start",
                          borderRadius: 10,
                          padding: "10px 8px",
                          transition: "background 0.25s",
                          background: isActive ? `${color}18` : "transparent",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          const videoEl =
                            document.querySelector<HTMLVideoElement>("video");
                          const audioEl =
                            document.querySelector<HTMLAudioElement>("audio");
                          if (videoEl) videoEl.currentTime = seg.startTimestamp;
                          else if (audioEl)
                            audioEl.currentTime = seg.startTimestamp;
                        }}
                      >
                        <div
                          style={{
                            flexShrink: 0,
                            width: 36,
                            paddingTop: 2,
                            textAlign: "right",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              color: isActive ? color : "#94A3B8",
                              fontWeight: isActive ? 700 : 400,
                            }}
                          >
                            {timestamp}
                          </Text>
                        </div>
                        <div
                          style={{
                            flexShrink: 0,
                            width: 3,
                            borderRadius: 2,
                            background: isActive ? color : "#E2E8F0",
                            alignSelf: "stretch",
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 11,
                              color,
                              fontWeight: 700,
                              display: "block",
                              marginBottom: 4,
                              opacity: isActive ? 1 : 0.65,
                            }}
                          >
                            {seg.speaker?.isMapped && seg.speaker.mappedStudent
                              ? `${seg.speaker.mappedStudent.firstName} ${seg.speaker.mappedStudent.lastName}`.trim()
                              : `Diễn giả ${speakerIndex + 1}`}
                          </Text>
                          {(() => {
                            const words = seg.segmentText.trim().split(/\s+/);
                            const segDuration =
                              seg.endTimestamp - seg.startTimestamp;
                            const progressRatio =
                              isActive && segDuration > 0
                                ? Math.min(
                                    1,
                                    Math.max(
                                      0,
                                      (playerCurrentTime - seg.startTimestamp) /
                                        segDuration,
                                    ),
                                  )
                                : isPast
                                  ? 1
                                  : 0;
                            const litCount = Math.ceil(
                              progressRatio * words.length,
                            );

                            return (
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 14,
                                  lineHeight: 1.75,
                                  wordBreak: "break-word",
                                }}
                              >
                                {words.map((word, wi) => (
                                  <span
                                    key={wi}
                                    style={{
                                      color:
                                        wi < litCount
                                          ? isActive
                                            ? color
                                            : PALETTE.slate
                                          : "#94A3B8",
                                      fontWeight:
                                        wi < litCount && isActive ? 500 : 400,
                                      transition: "color 0.12s",
                                    }}
                                  >
                                    {word}
                                    {wi < words.length - 1 ? " " : ""}
                                  </span>
                                ))}
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Alert
                  message="Chưa có transcript cho bài thuyết trình này."
                  type="info"
                  showIcon
                  style={{ borderRadius: 12 }}
                />
              )
            ) : presentation.aiReport ? (
              <motion.div
                key="ai-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div
                  style={{
                    borderRadius: 16,
                    background: `linear-gradient(135deg, ${PALETTE.infoLight} 0%, ${PALETTE.purpleLight} 100%)`,
                    border: `1px solid ${PALETTE.infoLight}`,
                    marginBottom: 16,
                    padding: "20px 24px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 20,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.primaryDark})`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: `0 8px 24px ${PALETTE.primary}40`,
                      }}
                    >
                      <RobotOutlined
                        style={{ fontSize: 28, color: PALETTE.white }}
                      />
                    </div>
                    <div>
                      <Text
                        style={{
                          fontSize: 13,
                          color: PALETTE.slate,
                          fontWeight: 500,
                          display: "block",
                          marginBottom: 4,
                        }}
                      >
                        Điểm tổng (AI)
                      </Text>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 10,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 42,
                            lineHeight: 1,
                            fontWeight: 800,
                            color: PALETTE.primaryDark,
                          }}
                        >
                          {(Number(presentation.aiReport.overallScore) * 100).toFixed(
                            0,
                          )}
                        </span>
                        <Text
                          style={{
                            fontSize: 18,
                            color: PALETTE.slate,
                            fontWeight: 600,
                          }}
                        >
                          / 100
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {criteriaScores.map((criterion) => (
                    <div
                      key={criterion.criteriaId}
                      className="rounded-2xl border border-slate-200 p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900">
                          {criterion.criteriaName}
                        </h3>
                        <span className="text-sm font-semibold text-sky-700">
                          {criterion.score}/{criterion.maxScore}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">
                        {criterion.comment}
                      </p>
                      {criterion.suggestions?.length > 0 && (
                        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                          {criterion.suggestions.map((suggestion, index) => (
                            <li key={`${criterion.criteriaId}-${index}`}>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <Alert
                message="Bài thuyết trình này chưa có kết quả đánh giá AI."
                type="info"
                showIcon
                icon={<ExclamationCircleOutlined />}
                style={{ borderRadius: 12 }}
              />
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default SharePage;
