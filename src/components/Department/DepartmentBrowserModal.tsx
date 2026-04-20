import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pagination,
  Tag,
  Typography,
  Avatar,
} from "antd";
import {
  BookText,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/services/store/store";
import { fetchClassesByCourse } from "@/services/features/admin/classSlice";

const { Text } = Typography;

interface DepartmentBrowserModalProps {
  open: boolean;
  department: {
    departmentId: number;
    departmentCode: string;
    departmentName: string;
  } | null;
  courses: Array<{
    courseId: number;
    courseCode: string;
    courseName: string;
    isActive: boolean;
  }>;
  coursesByDept: Record<
    number,
    Array<{
      courseId: number;
      courseCode: string;
      courseName: string;
      isActive: boolean;
    }>
  >;
  apiClasses: Array<any>;
  enrolledClassIds: number[];
  classLoading: boolean;
  classPagination: Record<number, { total?: number; totalPages?: number }>;
  onClose: () => void;
  onEnroll: (classItem: ClassItem) => void;
}

export interface ClassItem {
  classId: number;
  classCode: string;
  className: string;
  instructorName: string;
  enrollmentCount: number;
  maxStudents?: number;
  schedule: string;
  status: "active" | "inactive";
  endDate: string;
}

const BRAND_GRADIENT = "linear-gradient(135deg, #1da9e6 0%, #6966fe 100%)";

const DepartmentBrowserModal: React.FC<DepartmentBrowserModalProps> = ({
  open,
  department,
  courses,
  coursesByDept,
  apiClasses,
  enrolledClassIds,
  classLoading,
  classPagination,
  onClose,
  onEnroll,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [coursePageMap, setCoursePageMap] = useState<Record<number, number>>({});

  const deptCourses = department
    ? coursesByDept[department.departmentId] || []
    : [];
  const selectedCourse = selectedCourseId
    ? courses.find((c) => c.courseId === selectedCourseId)
    : null;

  useEffect(() => {
    if (!open) {
      setSelectedCourseId(null);
      setCoursePageMap({});
    }
  }, [open]);

  const allClassesMap = useMemo(() => {
    const map: Record<number, ClassItem[]> = {};
    apiClasses.forEach((c: any) => {
      const cid = c.course?.courseId;
      if (!cid) return;
      const item: ClassItem = {
        classId: c.classId,
        classCode: c.classCode || "",
        className: c.className || "",
        instructorName: c.instructors?.length
          ? c.instructors
            .map((i: any) => `${i.firstName || ""} ${i.lastName || ""}`.trim())
            .filter(Boolean)
            .join(", ")
          : "Chưa có giảng viên",
        enrollmentCount: c.enrollmentCount ?? 0,
        maxStudents: c.maxStudents,
        schedule: `${new Date(c.startDate).toLocaleDateString("vi-VN")} – ${new Date(c.endDate).toLocaleDateString("vi-VN")}`,
        status: c.status === "active" ? "active" : "inactive",
        endDate: c.endDate || "",
      };
      if (!map[cid]) map[cid] = [];
      map[cid].push(item);
    });
    return map;
  }, [apiClasses]);

  const courseClasses = selectedCourseId
    ? allClassesMap[selectedCourseId] || []
    : [];

  const isEnrolled = (classId: number) => enrolledClassIds.includes(classId);
  const isLoadingClasses =
    !!selectedCourseId && classLoading && courseClasses.length === 0;

  const handleSelectCourse = (courseId: number) => {
    setSelectedCourseId(courseId);
    dispatch(
      fetchClassesByCourse({
        courseId,
        page: coursePageMap[courseId] || 1,
        limit: 10,
      }),
    );
  };

  const handleClassPageChange = (courseId: number, page: number) => {
    setCoursePageMap((prev) => ({ ...prev, [courseId]: page }));
    dispatch(fetchClassesByCourse({ courseId, page, limit: 10 }));
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={920}
      destroyOnHidden
      styles={{
        content: {
          borderRadius: 16,
          padding: 0,
          overflow: "hidden",
          fontFamily: "'Poppins', sans-serif",
        },
        header: { display: "none" },
      }}
    >
      {department && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              background: BRAND_GRADIENT,
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <GraduationCap style={{ width: 18, height: 18, color: "white" }} />
            </div>
            <div>
              <Text
                strong
                style={{ color: "white", fontSize: 16 }}
              >
                {department.departmentName}
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: 12,
                  display: "block",
                }}
              >
                {department.departmentCode} · {deptCourses.length} khóa học
              </Text>
            </div>
          </div>

          <div style={{ display: "flex", height: "64vh" }}>
            <div
              style={{
                width: 168,
                flexShrink: 0,
                borderRight: "1px solid #E5E7EB",
                background: "#fff",
                padding: "16px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div
                onClick={() => setSelectedCourseId(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  background: !selectedCourseId
                    ? "linear-gradient(135deg,rgba(29,169,230,0.12) 0%,rgba(105,102,254,0.12) 100%)"
                    : "transparent",
                  color: !selectedCourseId ? "#6966fe" : "#6B7280",
                  transition: "all 0.15s",
                  borderLeft: !selectedCourseId
                    ? "3px solid #6966fe"
                    : "3px solid transparent",
                }}
              >
                <BookText style={{ width: 15, height: 15, flexShrink: 0 }} />
                Khóa học
              </div>

              {selectedCourseId && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: 13,
                    background:
                      "linear-gradient(135deg,rgba(29,169,230,0.12) 0%,rgba(105,102,254,0.12) 100%)",
                    color: "#6966fe",
                    borderLeft: "3px solid #6966fe",
                  }}
                >
                  <GraduationCap
                    style={{ width: 15, height: 15, flexShrink: 0 }}
                  />
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {selectedCourse?.courseCode ?? "Lớp học"}
                  </span>
                </div>
              )}
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                background: "#F9FAFB",
              }}
            >
              {!selectedCourseId ? (
                classLoading ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 14,
                    }}
                  >
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        style={{
                          height: 160,
                          background: "#F3F4F6",
                          borderRadius: 10,
                          border: "1px solid #E5E7EB",
                        }}
                      />
                    ))}
                  </div>
                ) : deptCourses.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <Text style={{ color: "#9CA3AF" }}>
                      Không có khóa học trong bộ môn này
                    </Text>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 14,
                    }}
                  >
                    {deptCourses.map((course) => (
                      <div
                        key={course.courseId}
                        onClick={() => handleSelectCourse(course.courseId)}
                        style={{
                          background: "white",
                          borderRadius: 10,
                          border: "1px solid #E5E7EB",
                          overflow: "hidden",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        }}
                        className="hover:shadow-md hover:-translate-y-0.5"
                      >
                        <div
                          style={{
                            background: BRAND_GRADIENT,
                            height: 80,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "white",
                              letterSpacing: 0.5,
                            }}
                          >
                            {course.courseCode}
                          </span>
                        </div>
                        <div style={{ padding: "12px 14px" }}>
                          <Text
                            strong
                            style={{
                              fontSize: 13,
                              color: "#1F2937",
                              display: "block",
                              lineHeight: 1.4,
                              marginBottom: 10,
                              minHeight: 38,
                            }}
                          >
                            {course.courseName}
                          </Text>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Tag
                              style={{
                                borderRadius: 20,
                                fontSize: 10,
                                padding: "1px 8px",
                                background: course.isActive ? "#D1FAE5" : "#F3F4F6",
                                border: course.isActive
                                  ? "1px solid #A7F3D0"
                                  : "1px solid #E5E7EB",
                                color: course.isActive ? "#059669" : "#9CA3AF",
                                fontWeight: 600,
                              }}
                            >
                              {course.isActive ? "Đang mở" : "Đã đóng"}
                            </Tag>
                            <Text style={{ fontSize: 10, color: "#9CA3AF" }}>
                              Khóa học
                            </Text>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div>
                  {isLoadingClasses ? (
                    <div style={{ textAlign: "center", padding: "32px 0" }}>
                      <Text style={{ color: "#9CA3AF" }}>
                        Đang tải lớp học...
                      </Text>
                    </div>
                  ) : courseClasses.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 0" }}>
                      <Text style={{ color: "#9CA3AF" }}>
                        Chưa có lớp học nào
                      </Text>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: "white",
                        borderRadius: 10,
                        border: "1px solid #E5E7EB",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "160px 1fr 180px 120px 140px",
                          padding: "10px 16px",
                          background: "#F9FAFB",
                          borderBottom: "1px solid #E5E7EB",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#6B7280",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        <span>Mã lớp</span>
                        <span>Giảng viên</span>
                        <span>Ngày kết thúc</span>
                        <span>Trạng thái</span>
                        <span style={{ textAlign: "right" }}>Hành động</span>
                      </div>

                      {courseClasses.map((c, idx) => {
                        const enrolled = isEnrolled(c.classId);
                        const isActive = c.status === "active";
                        return (
                          <div
                            key={c.classId}
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "160px 1fr 180px 120px 140px",
                              padding: "14px 16px",
                              alignItems: "center",
                              borderBottom:
                                idx < courseClasses.length - 1
                                  ? "1px solid #F3F4F6"
                                  : "none",
                              background: enrolled ? "#F0FDF4" : "white",
                              cursor: "pointer",
                              transition: "background 0.15s",
                            }}
                            className="hover:bg-slate-50"
                            onClick={() => {
                              if (enrolled)
                                navigate(`/student/class/${c.classId}`);
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  background: enrolled
                                    ? "rgba(16,185,129,0.1)"
                                    : "rgba(99,102,241,0.08)",
                                  border: `1px solid ${
                                    enrolled
                                      ? "rgba(16,185,129,0.2)"
                                      : "rgba(99,102,241,0.15)"
                                  }`,
                                  borderRadius: 8,
                                  padding: "4px 12px",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 800,
                                    color: enrolled ? "#10B981" : "#6366F1",
                                    letterSpacing: 0.5,
                                  }}
                                >
                                  {c.classCode}
                                </span>
                                {enrolled && (
                                  <ShieldCheck
                                    style={{
                                      width: 14,
                                      height: 14,
                                      color: "#10B981",
                                    }}
                                  />
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {c.instructorName !== "Chưa có giảng viên" ? (
                                <>
                                  <Avatar
                                    size={30}
                                    style={{
                                      background: enrolled
                                        ? "#D1FAE5"
                                        : "#EEF2FF",
                                      color: enrolled ? "#10B981" : "#6366F1",
                                      fontSize: 11,
                                      fontWeight: 700,
                                      border: `2px solid ${
                                        enrolled ? "#A7F3D0" : "#C7D2FE"
                                      }`,
                                      flexShrink: 0,
                                    }}
                                  >
                                    {c.instructorName
                                      .split(" ")
                                      .slice(0, 2)
                                      .map((n: string) => n[0])
                                      .join("")
                                      .toUpperCase()}
                                  </Avatar>
                                  <span
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 500,
                                      color: "#374151",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {c.instructorName}
                                  </span>
                                </>
                              ) : (
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: "#9CA3AF",
                                    fontStyle: "italic",
                                  }}
                                >
                                  Chưa có giảng viên
                                </span>
                              )}
                            </div>

                            <div>
                              <span style={{ fontSize: 12, color: "#6B7280" }}>
                                {new Date(c.endDate).toLocaleDateString("vi-VN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>

                            <div>
                              <Tag
                                style={{
                                  borderRadius: 20,
                                  fontSize: 10,
                                  padding: "2px 10px",
                                  border: 0,
                                  fontWeight: 600,
                                  background: enrolled
                                    ? "#D1FAE5"
                                    : isActive
                                      ? "#DBEAFE"
                                      : "#F3F4F6",
                                  color: enrolled
                                    ? "#059669"
                                    : isActive
                                      ? "#2563EB"
                                      : "#9CA3AF",
                                }}
                              >
                                {enrolled
                                  ? "Đã ghi danh"
                                  : isActive
                                    ? "Đang mở"
                                    : "Đã đóng"}
                              </Tag>
                            </div>

                            <div style={{ textAlign: "right" }}>
                              {enrolled ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/student/class/${c.classId}`);
                                  }}
                                  style={{
                                    padding: "6px 14px",
                                    borderRadius: 8,
                                    border: "1px solid #10B981",
                                    background: "#10B981",
                                    color: "white",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    fontFamily: "'Poppins', sans-serif",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  <CheckCircle2
                                    style={{ width: 13, height: 13 }}
                                  />
                                  Vào lớp
                                </button>
                              ) : isActive ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEnroll(c);
                                  }}
                                  style={{
                                    padding: "6px 14px",
                                    borderRadius: 8,
                                    border: "none",
                                    background: BRAND_GRADIENT,
                                    color: "white",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    fontFamily: "'Poppins', sans-serif",
                                    boxShadow:
                                      "0 2px 6px rgba(29,169,230,0.3)",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  <KeyRound style={{ width: 13, height: 13 }} />
                                  Ghi danh
                                </button>
                              ) : (
                                <Tag
                                  style={{
                                    borderRadius: 8,
                                    fontSize: 11,
                                    padding: "4px 10px",
                                    background: "#F3F4F6",
                                    border: "1px solid #E5E7EB",
                                    color: "#9CA3AF",
                                    fontWeight: 600,
                                  }}
                                >
                                  Đã đóng
                                </Tag>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {(classPagination[selectedCourseId!]?.totalPages || 0) >
                    1 && (
                    <div style={{ padding: "12px 0", textAlign: "center" }}>
                      <Pagination
                        size="small"
                        current={coursePageMap[selectedCourseId!] || 1}
                        pageSize={10}
                        total={classPagination[selectedCourseId!]?.total || 0}
                        onChange={(page) =>
                          handleClassPageChange(selectedCourseId!, page)
                        }
                        showSizeChanger={false}
                        showTotal={(total) => `Tổng ${total} lớp`}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default DepartmentBrowserModal;
