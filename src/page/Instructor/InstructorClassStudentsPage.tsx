import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Tag,
  Space,
  Typography,
  Spin,
  Table,
  Tooltip,
  Empty,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ArrowLeft,
  Users,
  BarChart3,
  CheckCircle,
  Clock,
  RefreshCw,
  Presentation,
} from "lucide-react";
import { toast } from "react-toastify";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchClassScores, ClassScoreCriterion } from "@/services/features/classScore/classScoreSlice";

const { Text } = Typography;

const scoreColor = (score: number | null): string => {
  if (score === null) return "text-slate-400";
  if (score >= 80) return "text-emerald-700";
  if (score >= 60) return "text-amber-700";
  return "text-red-600";
};

const statusConfig: Record<string, { label: string; tag: string }> = {
  confirmed: { label: "Đã duyệt", tag: "green" },
  pending: { label: "Chờ duyệt", tag: "orange" },
  rejected: { label: "Từ chối", tag: "red" },
  processing: { label: "Đang xử lý", tag: "blue" },
  submitted: { label: "Đã nộp", tag: "purple" },
};

const presentationStatusConfig: Record<string, { label: string; tag: string }> = {
  submitted: { label: "Đã nộp", tag: "purple" },
  processing: { label: "Đang xử lý", tag: "blue" },
  completed: { label: "Hoàn thành", tag: "green" },
  failed: { label: "Thất bại", tag: "red" },
};

const ScoreBadge: React.FC<{ score: number | null; size?: "sm" | "md" }> = ({
  score,
  size = "sm",
}) => {
  if (score === null) return <Text type="secondary">—</Text>;
  return (
    <Tag
      color={score >= 80 ? "green" : score >= 60 ? "orange" : "red"}
      className={`font-bold ${size === "md" ? "text-sm" : "text-xs"}`}
    >
      {score.toFixed(1)}
    </Tag>
  );
};

const InstructorClassStudentsPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const parsed = classId ? parseInt(classId, 10) : NaN;
  const numericClassId = Number.isInteger(parsed) && parsed > 0 ? parsed : null;

  const { classScores, loading: loadingByClassId, error: errorByClassId } =
    useAppSelector((state) => state.classScore);
  const data = numericClassId != null ? classScores[numericClassId] : undefined;
  const scoresLoading =
    numericClassId != null ? Boolean(loadingByClassId[numericClassId]) : false;
  const scoresError =
    numericClassId != null ? errorByClassId[numericClassId] ?? null : null;

  useEffect(() => {
    if (numericClassId) {
      dispatch(fetchClassScores(numericClassId));
    }
  }, [dispatch, numericClassId]);

  useEffect(() => {
    if (scoresError) toast.error(scoresError);
  }, [scoresError]);

  const sortedCriteria: ClassScoreCriterion[] = useMemo(() => {
    if (!data?.criteria) return [];
    return [...data.criteria].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [data]);

  const overallClassAverage = useMemo(() => {
    if (!data?.students) return null;
    const scores = data.students.map((s) => s.instructorAverageScore).filter((v): v is number => v !== null);
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  }, [data]);

  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);

  if (numericClassId == null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card>
          <Empty description="Mã lớp không hợp lệ">
            <Button type="primary" onClick={() => navigate("/instructor/students")}>
              Quay lại danh sách lớp
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  if (scoresLoading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card>
          <Empty description={scoresError || "Không tìm thấy dữ liệu lớp học"}>
            <Space>
              <Button onClick={() => dispatch(fetchClassScores(numericClassId!))}>Thử lại</Button>
              <Button onClick={() => navigate("/instructor/students")}>Quay lại danh sách lớp</Button>
            </Space>
          </Empty>
        </Card>
      </div>
    );
  }

  const gradedCount = data.students.filter((s) => s.instructorAverageScore !== null).length;
  const ungradedCount = data.students.filter((s) => s.instructorAverageScore === null).length;

  // Build table columns
  const columns: ColumnsType<typeof data.students[0]> = [
    {
      title: "#",
      key: "index",
      width: 50,
      render: (_, __, idx) => <Text type="secondary">{idx + 1}</Text>,
    },
    {
      title: "Sinh viên",
      key: "student",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>
            {record.student.firstName} {record.student.lastName}
          </Text>
          <Text type="secondary" className="text-xs">{record.student.email}</Text>
        </Space>
      ),
    },
    ...sortedCriteria.map((c) => ({
      title: (
        <Tooltip title={`${c.criteriaName} (w:${c.weight}%)`}>
          <span>{c.criteriaName}</span>
        </Tooltip>
      ),
      key: `criteria-${c.classRubricCriteriaId}`,
      align: "center" as const,
      width: 80,
      render: (_: any, record: typeof data.students[0]) => {
        const rubricScore = record.rubricScores.find(
          (rs) => rs.classRubricCriteriaId === c.classRubricCriteriaId,
        );
        return <ScoreBadge score={rubricScore?.averageScore ?? null} />;
      },
    })),
    {
      title: "Điểm GV",
      key: "instructorScore",
      align: "center" as const,
      width: 80,
      render: (_, record) => <ScoreBadge score={record.instructorAverageScore} size="md" />,
    },
    {
      title: "Điểm AI",
      key: "aiScore",
      align: "center" as const,
      width: 80,
      render: (_, record) => (
        <ScoreBadge
          score={record.overallAverageScore !== null ? Number(record.overallAverageScore) * 10 : null}
          size="md"
        />
      ),
    },
    {
      title: "Bài TL",
      key: "presentations",
      align: "center" as const,
      width: 80,
      render: (_, record) => (
        <Tag>
          {record.totalReports} / {record.totalPresentations}
        </Tag>
      ),
    },
    {
      title: "",
      key: "expand",
      width: 50,
      render: (_, record) => (
        <Button
          type="text"
          size="small"
          icon={expandedStudent === record.enrollmentId ? <span>▲</span> : <span>▼</span>}
          onClick={() =>
            setExpandedStudent(expandedStudent === record.enrollmentId ? null : record.enrollmentId)
          }
        />
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarInstructor activeItem="students" />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Space>
              <Button icon={<ArrowLeft />} onClick={() => navigate("/instructor/students")}>
                Quay lại
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <Text strong className="text-lg">{data.class.classCode}</Text>
                  <div className="text-xs text-gray-500">
                    {data.totalStudents} sinh viên · {sortedCriteria.length} tiêu chí đánh giá
                  </div>
                </div>
              </div>
            </Space>
            <Button
              icon={<RefreshCw size={14} />}
              onClick={() => dispatch(fetchClassScores(numericClassId!))}
              loading={scoresLoading}
            >
              Làm mới
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card size="small">
              <Space>
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <Text type="secondary" className="text-xs">Tổng SV</Text>
                  <div className="text-xl font-bold">{data.totalStudents}</div>
                </div>
              </Space>
            </Card>
            <Card size="small">
              <Space>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <Text type="secondary" className="text-xs">Đã chấm</Text>
                  <div className="text-xl font-bold">{gradedCount}</div>
                </div>
              </Space>
            </Card>
            <Card size="small">
              <Space>
                <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <Text type="secondary" className="text-xs">Chưa chấm</Text>
                  <div className="text-xl font-bold">{ungradedCount}</div>
                </div>
              </Space>
            </Card>
            <Card size="small">
              <Space>
                <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <Text type="secondary" className="text-xs">Điểm TB lớp</Text>
                  <div className={`text-xl font-bold ${overallClassAverage !== null ? scoreColor(overallClassAverage) : ""}`}>
                    {overallClassAverage !== null ? `${overallClassAverage.toFixed(1)} / 10` : "—"}
                  </div>
                </div>
              </Space>
            </Card>
          </div>

          {/* Students Table */}
          <Card title="Điểm theo sinh viên">
            <Table
              columns={columns}
              dataSource={data.students}
              rowKey="enrollmentId"
              loading={scoresLoading}
              pagination={false}
              size="small"
              expandable={{
                expandedRowKeys: expandedStudent ? [expandedStudent] : [],
                onExpand: (expanded, record) => {
                  setExpandedStudent(expanded ? record.enrollmentId : null);
                },
                expandedRowRender: (record) => (
                  <div className="p-4 space-y-4 bg-blue-50/30">
                    {/* Presentations */}
                    <div>
                      <Text strong className="text-xs uppercase tracking-wide text-gray-600 flex items-center gap-1.5 mb-2">
                        <Presentation size={12} />
                        Bài thuyết trình ({record.totalPresentations})
                      </Text>
                      {record.presentations.length === 0 ? (
                        <Text type="secondary" italic>Chưa có bài thuyết trình nào.</Text>
                      ) : (
                        <Space direction="vertical" className="w-full" size={2}>
                          {record.presentations.map((p) => {
                            const reportCfg = statusConfig[p.reportStatus || ""] || { label: p.reportStatus || "—", tag: "default" };
                            const presCfg = presentationStatusConfig[p.status || ""] || { label: p.status || "—", tag: "default" };
                            return (
                              <Card key={p.presentationId} size="small">
                                <div className="flex items-center justify-between">
                                  <Space direction="vertical" size={2}>
                                    <Text strong className="text-sm">{p.title}</Text>
                                    <Space>
                                      <Tag color={presCfg.tag}>{presCfg.label}</Tag>
                                      <Tag color={reportCfg.tag}>{reportCfg.label}</Tag>
                                      {p.submittedAt && (
                                        <Text type="secondary" className="text-xs">
                                          Nộp: {new Date(p.submittedAt).toLocaleString("vi-VN")}
                                        </Text>
                                      )}
                                    </Space>
                                  </Space>
                                  <Space>
                                    {p.receivedGrade !== null ? (
                                      <Tag color="gold">{Number(p.receivedGrade).toFixed(1)} ({p.percentage}%)</Tag>
                                    ) : p.overallScore !== null ? (
                                      <ScoreBadge score={Number(p.overallScore) * 100} size="md" />
                                    ) : (
                                      <Text type="secondary">—</Text>
                                    )}
                                    {p.hasReport && (
                                      <Button
                                        type="link"
                                        size="small"
                                        onClick={() => navigate(`/instructor/presentation/${p.presentationId}`)}
                                      >
                                        Xem báo cáo →
                                      </Button>
                                    )}
                                  </Space>
                                </div>
                              </Card>
                            );
                          })}
                        </Space>
                      )}
                    </div>

                    {/* Rubric breakdown */}
                    <div>
                      <Text strong className="text-xs uppercase tracking-wide text-gray-600 flex items-center gap-1.5 mb-2">
                        <BarChart3 size={12} />
                        Chi tiết điểm rubric
                      </Text>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {record.rubricScores.map((rs) => (
                          <Card key={rs.classRubricCriteriaId} size="small">
                            <Space className="w-full justify-between">
                              <Text className="text-sm">{rs.criteriaName}</Text>
                              <ScoreBadge score={rs.averageScore} size="md" />
                            </Space>
                            <Text type="secondary" className="text-xs">/ {rs.maxScore} (w:{rs.weight}%)</Text>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                ),
              }}
            />
          </Card>
        </div>
      </main>
    </div>
  );
};

export default InstructorClassStudentsPage;