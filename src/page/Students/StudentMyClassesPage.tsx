import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/lib/toast";
import { Input, Button, Typography, Segmented, Tag, ConfigProvider } from "antd";
import type { SegmentedProps } from "antd";
import { SearchOutlined, ReadOutlined, CopyOutlined, PlusOutlined } from "@ant-design/icons";
import { GraduationCap, CheckCircle2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchEnrolledClasses } from "@/services/features/enrollment/enrollmentSlice";
import StudentLayout from "@/components/StudentLayout/StudentLayout";
import EnrollModal from "@/components/Department/EnrollModal";

const { Title, Text } = Typography;

const BRAND_GRADIENT = "linear-gradient(135deg, #1da9e6 0%, #6966fe 100%)";

type FilterType = "all" | "active" | "inactive";

const StudentMyClassesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { enrolledClasses, loading, error } = useAppSelector(
    (state) => state.enrollment,
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [quickJoinOpen, setQuickJoinOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchEnrolledClasses());
  }, [dispatch]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Đã sao chép mã lớp: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredClasses = enrolledClasses.filter((cls) => {
    const className = cls.class.className?.toLowerCase() || "";
    const classCode = cls.class.classCode?.toLowerCase() || "";
    const courseName = cls.class.course?.courseName?.toLowerCase() || "";
    const courseCode = cls.class.course?.courseCode?.toLowerCase() || "";
    const instructorName =
      cls.class.instructors
        ?.map((i) => `${i.firstName} ${i.lastName}`.toLowerCase())
        .join(" ") || "";
    const searchLower = searchQuery.toLowerCase();

    const matchesSearch =
      !searchQuery ||
      className.includes(searchLower) ||
      classCode.includes(searchLower) ||
      courseName.includes(searchLower) ||
      courseCode.includes(searchLower) ||
      instructorName.includes(searchLower);

    const matchesFilter =
      filter === "all" ||
      (filter === "active" && cls.class.status === "active") ||
      (filter === "inactive" && cls.class.status !== "active");

    return matchesSearch && matchesFilter;
  });

  const totalClasses = enrolledClasses.length;
  const activeClasses = enrolledClasses.filter(
    (c) => c.class.status === "active",
  ).length;
  const inactiveClasses = totalClasses - activeClasses;

  const segmentedOptions: SegmentedProps["options"] = [
    { label: `Tất cả (${totalClasses})`, value: "all" },
    { label: `Đang mở (${activeClasses})`, value: "active" },
    { label: `Đã đóng (${inactiveClasses})`, value: "inactive" },
  ];

  return (
    <StudentLayout>
      <ConfigProvider componentSize="large">
        <div style={{ fontFamily: "'Poppins', sans-serif", background: "#fff", minHeight: "100vh" }}>
          <div style={{ maxWidth: 1480, margin: "0 auto", padding: "32px 24px" }}>

            {/* Page header */}
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1F2937", fontSize: 26 }}>
                  Lớp của tôi
                </Title>
                <Text style={{ color: "#6B7280", fontSize: 15 }}>
                  Quản lý các lớp học đã tham gia
                </Text>
              </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => setQuickJoinOpen(true)}
                style={{ borderRadius: 12, fontWeight: 700, height: 48, paddingInline: 24, background: "linear-gradient(135deg, #1da9e6 0%, #6966fe 100%)", border: "none", boxShadow: "0 4px 12px rgba(29,169,230,0.3)" }}
              >
                Tham gia nhanh
              </Button>
              <Button
                size="large"
                icon={<ReadOutlined />}
                onClick={() => navigate("/student/dashboard")}
                style={{ borderRadius: 12, fontWeight: 600, height: 48, paddingInline: 20, border: "1.5px solid #E5E7EB", color: "#6B7280" }}
              >
                Khám phá lớp học
              </Button>
            </div>
            </div>

            {/* Search + filter row */}
            <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 28, flexWrap: "wrap" }}>
              <Input
                size="large"
                placeholder="Tìm theo tên lớp, mã lớp, giảng viên..."
                prefix={<SearchOutlined style={{ color: "#1da9e6" }} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                allowClear
                style={{
                  borderRadius: 12,
                  height: 48,
                  border: "2px solid #1da9e6",
                  fontSize: 15,
                  boxShadow: "0 2px 8px rgba(29,169,230,0.08)",
                  flex: 1,
                  minWidth: 240,
                }}
              />
              <Segmented
                size="large"
                value={filter}
                onChange={(val) => setFilter(val as FilterType)}
                options={segmentedOptions}
                style={{
                  borderRadius: 12,
                  background: "#F3F4F6",
                  padding: "4px",
                }}
                className="[&_.ant-segmented-item]:!rounded-lg [&_.ant-segmented-item]:!px-4 [&_.ant-segmented-item]:!min-h-[40px]"
              />
            </div>

            {/* Loading skeletons */}
            {loading && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ height: 280, background: "#F9FAFB", borderRadius: 12, border: "1px solid #E5E7EB" }} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && filteredClasses.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 20px", background: "white", borderRadius: 14, border: "1px solid #E5E7EB" }}>
                <ReadOutlined style={{ fontSize: 40, color: "#D1D5DB", marginBottom: 10 }} />
                <Text style={{ fontSize: 14, color: "#9CA3AF", display: "block" }}>
                  {searchQuery ? "Không tìm thấy lớp phù hợp" : "Bạn chưa tham gia lớp nào"}
                </Text>
                {searchQuery ? (
                  <Button size="large" onClick={() => setSearchQuery("")} style={{ marginTop: 16, borderRadius: 12 }}>
                    Xóa tìm kiếm
                  </Button>
                ) : (
                  <Button type="primary" size="large" icon={<ReadOutlined />} onClick={() => navigate("/student/dashboard")} style={{ marginTop: 16, borderRadius: 12 }}>
                    Khám phá lớp học
                  </Button>
                )}
              </div>
            )}

            {/* Class cards grid */}
            {!loading && filteredClasses.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
                {filteredClasses.map((cls) => {
                  const isActive = cls.class.status === "active";
                  return (
                    <div
                      key={cls.enrollmentId}
                      onClick={() => navigate(`/student/class/${cls.classId}`)}
                      style={{
                        background: "white",
                        borderRadius: 12,
                        border: "1px solid #E5E7EB",
                        overflow: "hidden",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      }}
                      className="hover:shadow-lg hover:-translate-y-1"
                    >
                      {/* Card header with gradient */}
                      <div
                        style={{
                          background: BRAND_GRADIENT,
                          height: 160,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            background: isActive ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.2)",
                            backdropFilter: "blur(4px)",
                            borderRadius: 20,
                            padding: "2px 10px",
                            fontSize: 11,
                            fontWeight: 600,
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <CheckCircle2 style={{ width: 12, height: 12 }} />
                          {isActive ? "Đang mở" : "Đã đóng"}
                        </div>
                        <GraduationCap style={{ width: 36, height: 36, color: "rgba(255,255,255,0.7)" }} />
                        <span style={{ fontSize: 22, fontWeight: 800, color: "white", letterSpacing: 1 }}>
                          {cls.class.classCode}
                        </span>
                      </div>

                      {/* Card body */}
                      <div style={{ padding: "14px 16px 16px" }}>
                        <Text strong style={{ fontSize: 14, color: "#1F2937", display: "block", lineHeight: 1.45, marginBottom: 10, minHeight: 42 }}>
                          {cls.class.className}
                        </Text>

                        {/* Course tag */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                          <Tag style={{ borderRadius: 20, fontSize: 11, padding: "1px 10px", background: "#EEF2FF", border: "1px solid #C7D2FE", color: "#6366F1", fontWeight: 600, margin: 0 }}>
                            {cls.class.course?.courseCode || "—"}
                          </Tag>
                          <Text style={{ fontSize: 11, color: "#6B7280" }} className="truncate">
                            {cls.class.course?.courseName || "Chưa có khóa học"}
                          </Text>
                        </div>

                        {/* Enrolled date */}
                        {cls.enrolledAt && (
                          <Text style={{ fontSize: 11, color: "#9CA3AF", display: "block", marginBottom: 10 }}>
                            Tham gia: {new Date(cls.enrolledAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" })}
                          </Text>
                        )}

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Tag style={{ borderRadius: 20, fontSize: 11, padding: "2px 12px", background: "#D1FAE5", border: "1px solid #A7F3D0", color: "#059669", fontWeight: 600, margin: 0 }}>
                            Đã tham gia
                          </Tag>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopyCode(cls.class.classCode); }}
                            title="Sao chép mã lớp"
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              padding: "4px",
                              color: copiedCode === cls.class.classCode ? "#10B981" : "#9CA3AF",
                              display: "flex",
                              alignItems: "center",
                              transition: "color 0.15s",
                            }}
                          >
                            {copiedCode === cls.class.classCode ? (
                              <CheckCircle2 style={{ width: 16, height: 16 }} />
                            ) : (
                              <CopyOutlined style={{ fontSize: 14 }} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </ConfigProvider>

      {/* Quick Join Modal */}
      <EnrollModal
        open={quickJoinOpen}
        classData={null}
        onClose={() => {
          setQuickJoinOpen(false);
          dispatch(fetchEnrolledClasses());
        }}
      />
    </StudentLayout>
  );
};

export default StudentMyClassesPage;
