import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Tag,
  Typography,
  Avatar,
  Button,
  Drawer,
  Input,
} from "antd";
import {
  BookText,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Search,
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
  courses: _courses,
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchKeyword, setSearchKeyword] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const deptCourses = department
    ? coursesByDept[department.departmentId] || []
    : [];

  useEffect(() => {
    if (!open) {
      setSelectedCourseId(null);
      setCoursePageMap({});
      setSearchKeyword("");
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
              .map((i: any) =>
                `${i.firstName || ""} ${i.lastName || ""}`.trim(),
              )
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
  const normalizedKeyword = searchKeyword.trim().toLowerCase();
  const filteredDeptCourses = useMemo(() => {
    if (!normalizedKeyword) return deptCourses;
    return deptCourses.filter(
      (course) =>
        course.courseCode.toLowerCase().includes(normalizedKeyword) ||
        course.courseName.toLowerCase().includes(normalizedKeyword),
    );
  }, [deptCourses, normalizedKeyword]);
  const filteredCourseClasses = useMemo(() => {
    if (!normalizedKeyword) return courseClasses;
    return courseClasses.filter(
      (cls) =>
        cls.classCode.toLowerCase().includes(normalizedKeyword) ||
        cls.className.toLowerCase().includes(normalizedKeyword) ||
        cls.instructorName.toLowerCase().includes(normalizedKeyword),
    );
  }, [courseClasses, normalizedKeyword]);

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
    <>
      {/* Mobile: Drawer slides from right */}
      {isMobile ? (
        <Drawer
          title={null}
          placement="right"
          width="100%"
          onClose={onClose}
          open={open}
          styles={{
            body: { padding: 0, overflow: "hidden" },
            wrapper: { maxWidth: "100vw" },
          }}
        >
          {department && (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              {/* Header */}
              <div
                style={{
                  background: BRAND_GRADIENT,
                  padding: "20px 20px 20px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <GraduationCap style={{ width: 20, height: 20, color: "white" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text strong style={{ color: "white", fontSize: 16, display: "block" }}>
                    {department.departmentName}
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
                    {department.departmentCode} · {deptCourses.length} khóa học
                  </Text>
                </div>
              </div>

              {/* Body: stacked layout */}
              <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                {/* Course sidebar as horizontal scroll */}
                <div
                  style={{
                    borderBottom: "1px solid #E5E7EB",
                    background: "#fff",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    overflowX: "auto",
                    flexShrink: 0,
                  }}
                >
                  <div
                    onClick={() => setSelectedCourseId(null)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 16px",
                      borderRadius: 20,
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 13,
                      whiteSpace: "nowrap",
                      background: !selectedCourseId
                        ? "linear-gradient(135deg,rgba(29,169,230,0.12) 0%,rgba(105,102,254,0.12) 100%)"
                        : "#F3F4F6",
                      color: !selectedCourseId ? "#6966fe" : "#6B7280",
                      border: !selectedCourseId ? "2px solid #6966fe" : "2px solid transparent",
                      transition: "all 0.15s",
                    }}
                  >
                    <BookText style={{ width: 14, height: 14 }} />
                    Tất cả
                  </div>
                  {deptCourses.map((course) => (
                    <div
                      key={course.courseId}
                      onClick={() => handleSelectCourse(course.courseId)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 16px",
                        borderRadius: 20,
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 13,
                        whiteSpace: "nowrap",
                        background:
                          selectedCourseId === course.courseId
                            ? "linear-gradient(135deg,rgba(29,169,230,0.12) 0%,rgba(105,102,254,0.12) 100%)"
                            : "#F3F4F6",
                        color: selectedCourseId === course.courseId ? "#6966fe" : "#6B7280",
                        border: selectedCourseId === course.courseId
                          ? "2px solid #6966fe"
                          : "2px solid transparent",
                        transition: "all 0.15s",
                      }}
                    >
                      <GraduationCap style={{ width: 14, height: 14 }} />
                      {course.courseCode}
                    </div>
                  ))}
                </div>

                {/* Class list — scrollable */}
                <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
                  <Input
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder={
                      selectedCourseId
                        ? "Tìm lớp theo mã, tên lớp hoặc giảng viên..."
                        : "Tìm khóa học theo mã hoặc tên..."
                    }
                    allowClear
                    prefix={<Search style={{ width: 14, height: 14, color: "#9CA3AF" }} />}
                    style={{ marginBottom: 12, borderRadius: 10 }}
                  />
                  {!selectedCourseId ? (
                    filteredDeptCourses.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <Text style={{ color: "#9CA3AF" }}>
                          {normalizedKeyword ? "Không tìm thấy khóa học phù hợp" : "Không có khóa học"}
                        </Text>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {filteredDeptCourses.map((course) => (
                          <div
                            key={course.courseId}
                            onClick={() => handleSelectCourse(course.courseId)}
                            style={{
                              background: "white",
                              borderRadius: 12,
                              border: "1px solid #E5E7EB",
                              padding: "14px 16px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                            }}
                          >
                            <div>
                              <Text strong style={{ fontSize: 14, color: "#1F2937", display: "block" }}>
                                {course.courseName}
                              </Text>
                              <Text style={{ fontSize: 12, color: "#9CA3AF" }}>{course.courseCode}</Text>
                            </div>
                            <Tag
                              style={{
                                borderRadius: 20,
                                fontSize: 11,
                                padding: "2px 10px",
                                background: course.isActive ? "#D1FAE5" : "#F3F4F6",
                                border: course.isActive ? "1px solid #A7F3D0" : "1px solid #E5E7EB",
                                color: course.isActive ? "#059669" : "#9CA3AF",
                                fontWeight: 600,
                              }}
                            >
                              {course.isActive ? "Đang mở" : "Đã đóng"}
                            </Tag>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <MobileClassList
                      courseClasses={filteredCourseClasses}
                      isLoadingClasses={isLoadingClasses}
                      isEnrolled={isEnrolled}
                      onEnroll={onEnroll}
                      onNavigate={navigate}
                      selectedCourseId={selectedCourseId}
                      classPagination={classPagination}
                      coursePageMap={coursePageMap}
                      handleClassPageChange={handleClassPageChange}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </Drawer>
      ) : (
        /* Desktop: Large modal with side-by-side layout */
        <Modal
          open={open}
          onCancel={onClose}
          footer={null}
          centered
          width={1100}
          destroyOnHidden
          styles={{
            content: {
              borderRadius: 16,
              padding: 0,
              overflow: "hidden",
              fontFamily: "'Poppins', sans-serif",
            },
            header: { display: "none" },
            mask: { backdropFilter: "blur(2px)" },
          }}
        >
          {department && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {/* Header */}
              <div
                style={{
                  background: BRAND_GRADIENT,
                  padding: "18px 28px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <GraduationCap style={{ width: 22, height: 22, color: "white" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <Text strong style={{ color: "white", fontSize: 18 }}>
                    {department.departmentName}
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, display: "block" }}>
                    {department.departmentCode} · {deptCourses.length} khóa học
                  </Text>
                </div>
              </div>

              {/* Body */}
              <div style={{ display: "flex", height: "72vh" }}>
                {/* Left sidebar */}
                <div
                  style={{
                    width: 200,
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
                      borderLeft: !selectedCourseId ? "3px solid #6966fe" : "3px solid transparent",
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
                        transition: "all 0.15s",
                        borderLeft: "3px solid #6966fe",
                      }}
                    >
                      <GraduationCap style={{ width: 15, height: 15, flexShrink: 0 }} />
                      Lớp
                    </div>
                  )}
                </div>

                {/* Right content */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "20px 24px",
                    background: "#F9FAFB",
                  }}
                >
                  <Input
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder={
                      selectedCourseId
                        ? "Tìm lớp theo mã, tên lớp hoặc giảng viên..."
                        : "Tìm khóa học theo mã hoặc tên..."
                    }
                    allowClear
                    prefix={<Search style={{ width: 14, height: 14, color: "#9CA3AF" }} />}
                    style={{ marginBottom: 14, borderRadius: 10 }}
                  />
                  {!selectedCourseId ? (
                    filteredDeptCourses.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <Text style={{ color: "#9CA3AF" }}>
                          {normalizedKeyword ? "Không tìm thấy khóa học phù hợp" : "Không có khóa học"}
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
                        {filteredDeptCourses.map((course) => (
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
                                    border: course.isActive ? "1px solid #A7F3D0" : "1px solid #E5E7EB",
                                    color: course.isActive ? "#059669" : "#9CA3AF",
                                    fontWeight: 600,
                                  }}
                                >
                                  {course.isActive ? "Đang mở" : "Đã đóng"}
                                </Tag>
                                <Text style={{ fontSize: 10, color: "#9CA3AF" }}>Khóa học</Text>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <DesktopClassTable
                      courseClasses={filteredCourseClasses}
                      isLoadingClasses={isLoadingClasses}
                      isEnrolled={isEnrolled}
                      onEnroll={onEnroll}
                      onNavigate={navigate}
                      selectedCourseId={selectedCourseId}
                      classPagination={classPagination}
                      coursePageMap={coursePageMap}
                      handleClassPageChange={handleClassPageChange}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}
    </>
  );
};

// ─── Desktop Class Table ───────────────────────────────────────────────────────
const DesktopClassTable: React.FC<{
  courseClasses: ClassItem[];
  isLoadingClasses: boolean;
  isEnrolled: (id: number) => boolean;
  onEnroll: (c: ClassItem) => void;
  onNavigate: ReturnType<typeof useNavigate>;
  selectedCourseId: number;
  classPagination: Record<number, { total?: number; totalPages?: number }>;
  coursePageMap: Record<number, number>;
  handleClassPageChange: (courseId: number, page: number) => void;
}> = ({ courseClasses, isLoadingClasses, isEnrolled, onEnroll, onNavigate }) => {
  if (isLoadingClasses) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ height: 64, background: "#F3F4F6", borderRadius: 10 }} />
        ))}
      </div>
    );
  }

  if (courseClasses.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0" }}>
        <Text style={{ color: "#9CA3AF", fontSize: 14 }}>Chưa có lớp học nào</Text>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          background: "white",
          borderRadius: 12,
          border: "1px solid #E5E7EB",
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "140px 1fr 140px 120px 130px",
            padding: "12px 20px",
            background: "#F4F5F7",
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
          <span>Kết thúc</span>
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
                gridTemplateColumns: "140px 1fr 140px 120px 130px",
                padding: "14px 20px",
                alignItems: "center",
                borderBottom: idx < courseClasses.length - 1 ? "1px solid #F3F4F6" : "none",
                background: enrolled ? "#F0FDF4" : "white",
                cursor: enrolled ? "pointer" : "default",
                transition: "background 0.15s",
              }}
              className="hover:bg-slate-50"
              onClick={() => { if (enrolled) onNavigate(`/student/class/${c.classId}`); }}
            >
              {/* Class code badge */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: enrolled ? "rgba(16,185,129,0.1)" : "rgba(99,102,241,0.08)",
                    border: `1px solid ${enrolled ? "rgba(16,185,129,0.2)" : "rgba(99,102,241,0.15)"}`,
                    borderRadius: 8,
                    padding: "4px 12px",
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 800, color: enrolled ? "#10B981" : "#6366F1", letterSpacing: 0.5 }}>
                    {c.classCode}
                  </span>
                  {enrolled && <ShieldCheck style={{ width: 14, height: 14, color: "#10B981" }} />}
                </div>
              </div>

              {/* Instructor */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                {c.instructorName !== "Chưa có giảng viên" ? (
                  <>
                    <Avatar
                      size={34}
                      style={{
                        background: enrolled ? "#D1FAE5" : "#EEF2FF",
                        color: enrolled ? "#10B981" : "#6366F1",
                        fontSize: 12,
                        fontWeight: 700,
                        border: `2px solid ${enrolled ? "#A7F3D0" : "#C7D2FE"}`,
                        flexShrink: 0,
                      }}
                    >
                      {c.instructorName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
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
                  <span style={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic" }}>
                    Chưa có giảng viên
                  </span>
                )}
              </div>

              {/* End date */}
              <div>
                <span style={{ fontSize: 12, color: "#6B7280" }}>
                  {new Date(c.endDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>

              {/* Status tag */}
              <div>
                <Tag
                  style={{
                    borderRadius: 20,
                    fontSize: 11,
                    padding: "2px 10px",
                    border: 0,
                    fontWeight: 600,
                    background: enrolled ? "#D1FAE5" : isActive ? "#DBEAFE" : "#F3F4F6",
                    color: enrolled ? "#059669" : isActive ? "#2563EB" : "#9CA3AF",
                  }}
                >
                  {enrolled ? "Đã ghi danh" : isActive ? "Đang mở" : "Đã đóng"}
                </Tag>
              </div>

              {/* Action button */}
              <div style={{ textAlign: "right" }}>
                {enrolled ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onNavigate(`/student/class/${c.classId}`); }}
                    style={{
                      padding: "7px 16px",
                      borderRadius: 8,
                      border: "none",
                      background: "#10B981",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'Poppins', sans-serif",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <CheckCircle2 style={{ width: 14, height: 14 }} />
                    Vào lớp
                  </button>
                ) : isActive ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEnroll(c); }}
                    style={{
                      padding: "7px 16px",
                      borderRadius: 8,
                      border: "none",
                      background: "linear-gradient(135deg, #1da9e6 0%, #6966fe 100%)",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'Poppins', sans-serif",
                      boxShadow: "0 2px 6px rgba(29,169,230,0.3)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <KeyRound style={{ width: 14, height: 14 }} />
                    Ghi danh
                  </button>
                ) : (
                  <Tag style={{ borderRadius: 8, fontSize: 11, padding: "4px 12px", background: "#F3F4F6", border: "1px solid #E5E7EB", color: "#9CA3AF", fontWeight: 600 }}>
                    Đã đóng
                  </Tag>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

// ─── Mobile Class List ────────────────────────────────────────────────────────
const MobileClassList: React.FC<{
  courseClasses: ClassItem[];
  isLoadingClasses: boolean;
  isEnrolled: (id: number) => boolean;
  onEnroll: (c: ClassItem) => void;
  onNavigate: ReturnType<typeof useNavigate>;
  selectedCourseId: number;
  classPagination: Record<number, { total?: number; totalPages?: number }>;
  coursePageMap: Record<number, number>;
  handleClassPageChange: (courseId: number, page: number) => void;
}> = ({ courseClasses, isLoadingClasses, isEnrolled, onEnroll, onNavigate }) => {
  if (isLoadingClasses) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: 80, background: "#F3F4F6", borderRadius: 10 }} />
        ))}
      </div>
    );
  }

  if (courseClasses.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <Text style={{ color: "#9CA3AF", fontSize: 14 }}>Chưa có lớp học nào</Text>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {courseClasses.map((c) => {
        const enrolled = isEnrolled(c.classId);
        const isActive = c.status === "active";
        return (
          <div
            key={c.classId}
            style={{
              background: "white",
              borderRadius: 12,
              border: `1px solid ${enrolled ? "#A7F3D0" : "#E5E7EB"}`,
              padding: "16px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: enrolled ? "#10B981" : "#6366F1" }}>
                    {c.classCode}
                  </span>
                  {enrolled && <ShieldCheck style={{ width: 14, height: 14, color: "#10B981" }} />}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {c.instructorName !== "Chưa có giảng viên" ? (
                    <Avatar size={22} style={{ background: enrolled ? "#D1FAE5" : "#EEF2FF", color: enrolled ? "#10B981" : "#6366F1", fontSize: 10, fontWeight: 700 }}>
                      {c.instructorName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                    </Avatar>
                  ) : null}
                  <span style={{ fontSize: 12, color: "#6B7280" }}>
                    {c.instructorName !== "Chưa có giảng viên" ? c.instructorName : "Chưa có giảng viên"}
                  </span>
                </div>
              </div>
              <Tag
                style={{
                  borderRadius: 20,
                  fontSize: 10,
                  padding: "2px 10px",
                  border: 0,
                  fontWeight: 600,
                  background: enrolled ? "#D1FAE5" : isActive ? "#DBEAFE" : "#F3F4F6",
                  color: enrolled ? "#059669" : isActive ? "#2563EB" : "#9CA3AF",
                }}
              >
                {enrolled ? "Đã ghi danh" : isActive ? "Đang mở" : "Đã đóng"}
              </Tag>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                Kết thúc: {new Date(c.endDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
              {enrolled ? (
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircle2 style={{ width: 13, height: 13 }} />}
                  onClick={() => onNavigate(`/student/class/${c.classId}`)}
                  style={{ background: "#10B981", borderColor: "#10B981", fontSize: 12 }}
                >
                  Vào lớp
                </Button>
              ) : isActive ? (
                <Button
                  type="primary"
                  size="small"
                  icon={<KeyRound style={{ width: 13, height: 13 }} />}
                  onClick={() => onEnroll(c)}
                  style={{ background: "linear-gradient(135deg, #1da9e6 0%, #6966fe 100%)", border: "none", fontSize: 12 }}
                >
                  Ghi danh
                </Button>
              ) : (
                <Tag style={{ borderRadius: 8, fontSize: 11, background: "#F3F4F6", border: "1px solid #E5E7EB", color: "#9CA3AF", fontWeight: 600 }}>
                  Đã đóng
                </Tag>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DepartmentBrowserModal;
