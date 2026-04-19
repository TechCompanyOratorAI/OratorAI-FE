import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Input, Tag, Typography, Avatar, Modal, ConfigProvider, Pagination } from "antd";
import {
  Search,
  ChevronRight,
  ChevronDown,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  BookText,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchCourses } from "@/services/features/course/courseSlice";
import { fetchClassesByCourse } from "@/services/features/admin/classSlice";
import { fetchDepartments } from "@/services/features/admin/adminSlice";
import {
  enrollClassByKey,
  fetchEnrolledClasses,
} from "@/services/features/enrollment/enrollmentSlice";
import StudentLayout from "@/components/StudentLayout/StudentLayout";

const { Title, Text } = Typography;

interface ClassItem {
  classId: number;
  classCode: string;
  className: string;
  courseCode: string;
  instructorName: string;
  enrollmentCount: number;
  maxStudents?: number;
  schedule: string;
  status: "active" | "inactive";
  endDate: string;
}

const BRAND_GRADIENT = "linear-gradient(135deg, #1da9e6 0%, #6966fe 100%)";

const StudentDashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { departments, loading: deptLoading } = useAppSelector(
    (state) => state.admin,
  );
  const {
    courses,
    loading: courseLoading,
    error: courseError,
    pagination: coursePagination,
  } = useAppSelector((state) => state.course);
  const { classes: apiClasses, loading: classLoading, coursePagination: classPagination } = useAppSelector(
    (state) => state.class,
  );
  const { enrolledClassIds } = useAppSelector((state) => state.enrollment);

  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedDeptIds, setExpandedDeptIds] = useState<Set<number>>(
    new Set(),
  );
  const [expandedCourseIds, setExpandedCourseIds] = useState<Set<number>>(
    new Set(),
  );
  const [coursePageMap, setCoursePageMap] = useState<Record<number, number>>({});

  const [enrollModal, setEnrollModal] = useState<{
    open: boolean;
    data: ClassItem | null;
  }>({ open: false, data: null });
  const [enrollKey, setEnrollKey] = useState("");
  const [enrollError, setEnrollError] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchCourses({ page: currentPage, limit: 10 }));
    dispatch(fetchEnrolledClasses());
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (courseError) toast.error(courseError);
  }, [courseError]);

  useEffect(() => {
    expandedDeptIds.forEach((id) => {
      const deptCourses = coursesByDept[id] || [];
      deptCourses.forEach((c) => {
        if (!allClassesMap[c.courseId]) {
          dispatch(fetchClassesByCourse({ courseId: c.courseId, page: coursePageMap[c.courseId] || 1, limit: 10 }));
        }
      });
    });
  }, [dispatch, expandedDeptIds]);

  useEffect(() => {
    expandedCourseIds.forEach((id) => {
      if (!allClassesMap[id]) {
        dispatch(fetchClassesByCourse({ courseId: id, page: coursePageMap[id] || 1, limit: 10 }));
      }
    });
  }, [dispatch, expandedCourseIds]);

  const allClassesMap = useMemo(() => {
    const map: Record<number, ClassItem[]> = {};
    apiClasses.forEach((c: any) => {
      const cid = c.course?.courseId;
      if (!cid) return;
      const item: ClassItem = {
        classId: c.classId,
        classCode: c.classCode || "",
        className: c.className || "",
        courseCode: c.course?.courseCode || "",
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

  const isEnrolled = (classId: number) => enrolledClassIds.includes(classId);

  const openEnroll = (c: ClassItem) => {
    setEnrollModal({ open: true, data: c });
    setEnrollKey("");
    setEnrollError("");
  };
  const closeEnroll = () => {
    setEnrollModal({ open: false, data: null });
    setEnrollKey("");
    setEnrollError("");
  };

  const submitEnroll = async () => {
    if (!enrollModal.data) return;
    const trimmed = enrollKey.trim();
    if (!trimmed) {
      setEnrollError("Vui lòng nhập mã ghi danh");
      return;
    }
    try {
      setEnrolling(true);
      await dispatch(
        enrollClassByKey({
          classId: enrollModal.data.classId,
          enrollKey: trimmed,
        }),
      ).unwrap();
      await dispatch(fetchEnrolledClasses());
      toast.success(
        `Đã ghi danh thành công lớp "${enrollModal.data.className}"!`,
      );
      closeEnroll();
    } catch (err: any) {
      setEnrollError(err?.message || "Ghi danh thất bại. Vui lòng thử lại.");
    } finally {
      setEnrolling(false);
    }
  };

  const coursesByDept = useMemo(() => {
    const map: Record<number, typeof courses> = {};
    courses.forEach((c) => {
      if (!map[c.departmentId]) map[c.departmentId] = [];
      map[c.departmentId].push(c);
    });
    return map;
  }, [courses]);

  const filteredDepts = useMemo(() => {
    const q = searchText.toLowerCase();
    return departments.filter((d) => {
      if (!d.isActive) return false;
      if (q) {
        const deptMatch =
          d.departmentName.toLowerCase().includes(q) ||
          d.departmentCode.toLowerCase().includes(q);
        if (!deptMatch) {
          const deptCourses = coursesByDept[d.departmentId] || [];
          const courseMatch = deptCourses.some(
            (c) =>
              c.courseName.toLowerCase().includes(q) ||
              c.courseCode.toLowerCase().includes(q),
          );
          return courseMatch;
        }
      }
      return true;
    });
  }, [departments, searchText, coursesByDept]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleClassPageChange = (courseId: number, page: number) => {
    setCoursePageMap((prev) => ({ ...prev, [courseId]: page }));
    dispatch(fetchClassesByCourse({ courseId, page, limit: 10 }));
  };

  const toggleDept = (deptId: number) => {
    setExpandedDeptIds((prev) => {
      const next = new Set(prev);
      if (next.has(deptId)) next.delete(deptId);
      else next.add(deptId);
      return next;
    });
    setExpandedCourseIds(new Set());
  };

  const toggleCourse = (courseId: number) => {
    setExpandedCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
        // fetch classes if not already loaded
        if (!allClassesMap[courseId]) {
          dispatch(fetchClassesByCourse({ courseId, page: coursePageMap[courseId] || 1, limit: 10 }));
        }
      }
      return next;
    });
  };

  return (
    <StudentLayout>
      <ConfigProvider componentSize="large">
        <div
          style={{
            background: "#F0F4F8",
            minHeight: "100vh",
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
            {/* Search */}
            <Input
              size="large"
              placeholder="Tìm kiếm bộ môn, khóa học..."
              prefix={
                <Search style={{ color: "#1da9e6", width: 18, height: 18 }} />
              }
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{
                borderRadius: 12,
                height: 48,
                border: "2px solid #1da9e6",
                fontSize: 15,
                boxShadow: "0 2px 8px rgba(29,169,230,0.08)",
              }}
            />

            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                background: "white",
                borderRadius: 12,
                border: "1px solid #E5E7EB",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 24,
                  borderRadius: 3,
                  background: BRAND_GRADIENT,
                }}
              />
              <Text style={{ fontSize: 14, fontWeight: 700, color: "#1F2937" }}>
                Bộ môn
              </Text>
              <Tag
                style={{
                  borderRadius: 20,
                  fontSize: 11,
                  padding: "1px 10px",
                  background: "#EEF2FF",
                  border: "1px solid #C7D2FE",
                  color: "#4F46E5",
                  fontWeight: 600,
                }}
              >
                {filteredDepts.length} bộ môn
              </Tag>
            </div>

            {/* Department + Course + Class tree */}
            {deptLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: 56,
                      background: "#F9FAFB",
                      borderRadius: 12,
                      border: "1px solid #E5E7EB",
                    }}
                  />
                ))}
              </div>
            ) : filteredDepts.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 20px",
                  background: "white",
                  borderRadius: 14,
                  border: "1px solid #E5E7EB",
                }}
              >
                <BookText
                  style={{
                    width: 40,
                    height: 40,
                    color: "#D1D5DB",
                    margin: "0 auto 10px",
                  }}
                />
                <Text
                  style={{ fontSize: 14, color: "#9CA3AF", display: "block" }}
                >
                  Không tìm thấy bộ môn nào
                </Text>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {filteredDepts.map((dept) => {
                  const deptCourses = coursesByDept[dept.departmentId] || [];
                  const isDeptExpanded = expandedDeptIds.has(dept.departmentId);
                  const q = searchText.toLowerCase();
                  const filteredCourses = q
                    ? deptCourses.filter(
                        (c) =>
                          c.courseName.toLowerCase().includes(q) ||
                          c.courseCode.toLowerCase().includes(q),
                      )
                    : deptCourses;

                  if (q && filteredCourses.length === 0) return null;

                  return (
                    <div key={dept.departmentId}>
                      {/* Department row */}
                      <div
                        style={{
                          background: "white",
                          borderRadius: 12,
                          border: `1px solid ${isDeptExpanded ? "#1da9e6" : "#E5E7EB"}`,
                          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          overflow: "hidden",
                        }}
                        className="hover:shadow-sm"
                        onClick={() => toggleDept(dept.departmentId)}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "14px 18px",
                            borderLeft: `5px solid #1da9e6`,
                          }}
                        >
                          <div className="flex items-center gap-4">
                            {/* Dept code badge */}
                            <div
                              style={{
                                background: BRAND_GRADIENT,
                                color: "white",
                                borderRadius: 8,
                                padding: "5px 12px",
                                fontSize: 12,
                                fontWeight: 700,
                                letterSpacing: 0.5,
                                flexShrink: 0,
                              }}
                            >
                              {dept.departmentCode}
                            </div>
                            <Text
                              strong
                              style={{
                                fontSize: 15,
                                color: "#1F2937",
                                fontWeight: 600,
                              }}
                            >
                              {dept.departmentName}
                            </Text>
                          </div>
                          <div className="flex items-center gap-3">
                            <Tag
                              style={{
                                borderRadius: 20,
                                fontSize: 11,
                                padding: "2px 10px",
                                background: "#EEF2FF",
                                border: "1px solid #C7D2FE",
                                color: "#6366F1",
                                fontWeight: 600,
                              }}
                            >
                              {deptCourses.length} khóa học
                            </Tag>
                            {isDeptExpanded ? (
                              <ChevronDown
                                style={{
                                  width: 18,
                                  height: 18,
                                  color: "#1da9e6",
                                }}
                              />
                            ) : (
                              <ChevronRight
                                style={{
                                  width: 18,
                                  height: 18,
                                  color: "#9CA3AF",
                                }}
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Courses under department */}
                      {isDeptExpanded && (
                        <div
                          style={{
                            marginTop: 6,
                            paddingLeft: 24,
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            animation: "fadeSlideDown 0.2s ease-out",
                          }}
                        >
                          {courseLoading && filteredCourses.length === 0 ? (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                              }}
                            >
                              {[1, 2].map((i) => (
                                <div
                                  key={i}
                                  style={{
                                    height: 48,
                                    background: "#F9FAFB",
                                    borderRadius: 10,
                                    border: "1px solid #E5E7EB",
                                  }}
                                />
                              ))}
                            </div>
                          ) : filteredCourses.length === 0 ? (
                            <div
                              style={{ textAlign: "center", padding: "20px 0" }}
                            >
                              <Text style={{ fontSize: 13, color: "#9CA3AF" }}>
                                Không có khóa học trong bộ môn này
                              </Text>
                            </div>
                          ) : (
                            filteredCourses.map((course) => {
                              const isCourseExpanded = expandedCourseIds.has(
                                course.courseId,
                              );
                              const courseClasses =
                                allClassesMap[course.courseId] || [];
                              const isLoadingClasses =
                                isCourseExpanded &&
                                classLoading &&
                                courseClasses.length === 0;

                              return (
                                <div key={course.courseId}>
                                  {/* Course row */}
                                  <div
                                    style={{
                                      background: "#FAFBFF",
                                      borderRadius: 10,
                                      border: `1px solid ${isCourseExpanded ? "#C7D2FE" : "#E5E7EB"}`,
                                      cursor: "pointer",
                                      transition: "all 0.2s",
                                      overflow: "hidden",
                                    }}
                                    className="hover:shadow-sm"
                                    onClick={() =>
                                      toggleCourse(course.courseId)
                                    }
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "11px 16px",
                                        borderLeft: `4px solid #6366F1`,
                                      }}
                                    >
                                      <div className="flex items-center gap-3">
                                        {/* Course code badge */}
                                        <div
                                          style={{
                                            background: "#6366F1",
                                            color: "white",
                                            borderRadius: 6,
                                            padding: "3px 10px",
                                            fontSize: 11,
                                            fontWeight: 700,
                                            letterSpacing: 0.3,
                                            flexShrink: 0,
                                          }}
                                        >
                                          {course.courseCode}
                                        </div>
                                        <Text
                                          style={{
                                            fontSize: 14,
                                            color: "#374151",
                                            fontWeight: 500,
                                          }}
                                        >
                                          {course.courseName}
                                        </Text>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <Tag
                                          style={{
                                            borderRadius: 20,
                                            fontSize: 10,
                                            padding: "1px 8px",
                                            background: course.isActive
                                              ? "#D1FAE5"
                                              : "#F3F4F6",
                                            border: course.isActive
                                              ? "1px solid #A7F3D0"
                                              : "1px solid #E5E7EB",
                                            color: course.isActive
                                              ? "#059669"
                                              : "#9CA3AF",
                                            fontWeight: 600,
                                          }}
                                        >
                                          {course.isActive
                                            ? "Đang mở"
                                            : "Đã đóng"}
                                        </Tag>
                                        <Tag
                                          style={{
                                            borderRadius: 20,
                                            fontSize: 10,
                                            padding: "1px 8px",
                                            background: "#F3F4F6",
                                            border: "1px solid #E5E7EB",
                                            color: "#6B7280",
                                            fontWeight: 600,
                                          }}
                                        >
                                          {courseClasses.length} lớp
                                        </Tag>
                                        {isCourseExpanded ? (
                                          <ChevronDown
                                            style={{
                                              width: 16,
                                              height: 16,
                                              color: "#6366F1",
                                            }}
                                          />
                                        ) : (
                                          <ChevronRight
                                            style={{
                                              width: 16,
                                              height: 16,
                                              color: "#9CA3AF",
                                            }}
                                          />
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Classes under course */}
                                  {isCourseExpanded && (
                                    <div
                                      style={{
                                        marginTop: 6,
                                        paddingLeft: 20,
                                        animation:
                                          "fadeSlideDown 0.2s ease-out",
                                      }}
                                    >
                                      {/* Class table header */}
                                      <div
                                        style={{
                                          background: "white",
                                          borderRadius: 10,
                                          border: "1px solid #E5E7EB",
                                          overflow: "hidden",
                                        }}
                                      >
                                        {/* Table header row */}
                                        <div
                                          style={{
                                            display: "grid",
                                            gridTemplateColumns:
                                              "160px 1fr 180px 120px 140px",
                                            gap: 0,
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
                                          <span>Ngày khai giảng</span>
                                          <span>Trạng thái</span>
                                          <span style={{ textAlign: "right" }}>
                                            Hành động
                                          </span>
                                        </div>

                                        {/* Table body */}
                                        {isLoadingClasses ? (
                                          <div
                                            style={{
                                              padding: "20px 16px",
                                              textAlign: "center",
                                            }}
                                          >
                                            <Text
                                              style={{
                                                fontSize: 13,
                                                color: "#9CA3AF",
                                              }}
                                            >
                                              Đang tải lớp học...
                                            </Text>
                                          </div>
                                        ) : courseClasses.length === 0 ? (
                                          <div
                                            style={{
                                              padding: "20px 16px",
                                              textAlign: "center",
                                            }}
                                          >
                                            <Text
                                              style={{
                                                fontSize: 13,
                                                color: "#9CA3AF",
                                              }}
                                            >
                                              Chưa có lớp học nào
                                            </Text>
                                          </div>
                                        ) : (
                                          courseClasses.map((c, idx) => {
                                            const enrolled = isEnrolled(
                                              c.classId,
                                            );
                                            const isActive =
                                              c.status === "active";

                                            return (
                                              <div
                                                key={c.classId}
                                                style={{
                                                  display: "grid",
                                                  gridTemplateColumns:
                                                    "160px 1fr 180px 120px 140px",
                                                  gap: 0,
                                                  padding: "14px 16px",
                                                  alignItems: "center",
                                                  borderBottom:
                                                    idx <
                                                    courseClasses.length - 1
                                                      ? "1px solid #F3F4F6"
                                                      : "none",
                                                  background: enrolled
                                                    ? "#F0FDF4"
                                                    : "white",
                                                  cursor: "pointer",
                                                  transition:
                                                    "background 0.15s",
                                                }}
                                                className="hover:bg-slate-50"
                                                onClick={() => {
                                                  if (enrolled)
                                                    navigate(
                                                      `/student/class/${c.classId}`,
                                                    );
                                                  else if (isActive)
                                                    openEnroll(c);
                                                }}
                                              >
                                                {/* Class code — hero */}
                                                <div>
                                                  <div
                                                    style={{
                                                      display: "inline-flex",
                                                      alignItems: "center",
                                                      gap: 6,
                                                      background: enrolled
                                                        ? "rgba(16,185,129,0.1)"
                                                        : "rgba(99,102,241,0.08)",
                                                      border: `1px solid ${enrolled ? "rgba(16,185,129,0.2)" : "rgba(99,102,241,0.15)"}`,
                                                      borderRadius: 8,
                                                      padding: "4px 12px",
                                                    }}
                                                  >
                                                    <span
                                                      style={{
                                                        fontSize: 16,
                                                        fontWeight: 800,
                                                        color: enrolled
                                                          ? "#10B981"
                                                          : "#6366F1",
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

                                                {/* Instructor full name */}
                                                <div className="flex items-center gap-2">
                                                  {c.instructorName !==
                                                  "Chưa có giảng viên" ? (
                                                    <>
                                                      <Avatar
                                                        size={30}
                                                        style={{
                                                          background: enrolled
                                                            ? "#D1FAE5"
                                                            : "#EEF2FF",
                                                          color: enrolled
                                                            ? "#10B981"
                                                            : "#6366F1",
                                                          fontSize: 11,
                                                          fontWeight: 700,
                                                          border: `2px solid ${enrolled ? "#A7F3D0" : "#C7D2FE"}`,
                                                          flexShrink: 0,
                                                        }}
                                                      >
                                                        {c.instructorName
                                                          .split(" ")
                                                          .slice(0, 2)
                                                          .map((n) => n[0])
                                                          .join("")
                                                          .toUpperCase()}
                                                      </Avatar>
                                                      <span
                                                        style={{
                                                          fontSize: 13,
                                                          fontWeight: 500,
                                                          color: "#374151",
                                                          overflow: "hidden",
                                                          textOverflow:
                                                            "ellipsis",
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

                                                {/* Start date */}
                                                <div>
                                                  <span
                                                    style={{
                                                      fontSize: 12,
                                                      color: "#6B7280",
                                                    }}
                                                  >
                                                    {new Date(
                                                      c.endDate,
                                                    ).toLocaleDateString(
                                                      "vi-VN",
                                                      {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric",
                                                      },
                                                    )}
                                                  </span>
                                                </div>

                                                {/* Status */}
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

                                                {/* Action */}
                                                <div
                                                  style={{ textAlign: "right" }}
                                                >
                                                  {enrolled ? (
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(
                                                          `/student/class/${c.classId}`,
                                                        );
                                                      }}
                                                      style={{
                                                        padding: "6px 14px",
                                                        borderRadius: 8,
                                                        border:
                                                          "1px solid #10B981",
                                                        background: "#10B981",
                                                        color: "white",
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        cursor: "pointer",
                                                        fontFamily:
                                                          "'Poppins', sans-serif",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 4,
                                                      }}
                                                    >
                                                      <CheckCircle2
                                                        style={{
                                                          width: 13,
                                                          height: 13,
                                                        }}
                                                      />
                                                      Vào lớp
                                                    </button>
                                                  ) : isActive ? (
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEnroll(c);
                                                      }}
                                                      style={{
                                                        padding: "6px 14px",
                                                        borderRadius: 8,
                                                        border: "none",
                                                        background:
                                                          BRAND_GRADIENT,
                                                        color: "white",
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        cursor: "pointer",
                                                        fontFamily:
                                                          "'Poppins', sans-serif",
                                                        boxShadow:
                                                          "0 2px 6px rgba(29,169,230,0.3)",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 4,
                                                      }}
                                                    >
                                                      <KeyRound
                                                        style={{
                                                          width: 13,
                                                          height: 13,
                                                        }}
                                                      />
                                                      Ghi danh
                                                    </button>
                                                  ) : (
                                                    <Tag
                                                      style={{
                                                        borderRadius: 8,
                                                        fontSize: 11,
                                                        padding: "4px 10px",
                                                        background: "#F3F4F6",
                                                        border:
                                                          "1px solid #E5E7EB",
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
                                          })
                                        )}
                                      </div>
                                      {(classPagination[course.courseId]?.totalPages || 0) > 1 && (
                                        <div style={{ padding: "10px 16px", textAlign: "center" }}>
                                          <Pagination
                                            size="small"
                                            current={coursePageMap[course.courseId] || 1}
                                            pageSize={10}
                                            total={classPagination[course.courseId]?.total || 0}
                                            onChange={(page) => handleClassPageChange(course.courseId, page)}
                                            showSizeChanger={false}
                                            showTotal={(total) => `Tổng ${total} lớp`}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <Pagination
                current={currentPage}
                pageSize={10}
                total={coursePagination.total}
                onChange={handlePageChange}
                showSizeChanger={false}
                showTotal={(total) => `Tổng ${total} khóa học`}
                style={{ textAlign: "center", marginTop: 12 }}
              />
            </>
          )}
          </div>

          {/* Modal Ghi danh */}
          <Modal
            open={enrollModal.open}
            onCancel={closeEnroll}
            footer={null}
            centered
            width={440}
            destroyOnClose
            styles={{
              content: {
                borderRadius: 16,
                padding: "24px 20px 20px",
                fontFamily: "'Poppins', sans-serif",
              },
              header: { display: "none" },
            }}
          >
            <div className="space-y-5">
              <div
                className="flex items-center gap-3 rounded-xl p-4"
                style={{ background: BRAND_GRADIENT, color: "white" }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <KeyRound style={{ width: 24, height: 24, color: "white" }} />
                </div>
                <div>
                  <Title
                    level={4}
                    style={{
                      color: "white",
                      margin: 0,
                      fontSize: 17,
                      fontWeight: 700,
                    }}
                  >
                    Ghi danh lớp học
                  </Title>
                  <Text
                    style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}
                  >
                    {enrollModal.data?.className}
                  </Text>
                </div>
              </div>
              <div>
                <label
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#374151",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Mã ghi danh
                </label>
                <Input
                  placeholder="Nhập mã ghi danh do giáo viên cung cấp"
                  prefix={
                    <KeyRound
                      style={{ width: 16, height: 16, color: "#9CA3AF" }}
                    />
                  }
                  value={enrollKey}
                  onChange={(e) => {
                    setEnrollKey(e.target.value);
                    if (enrollError) setEnrollError("");
                  }}
                  status={enrollError ? "error" : undefined}
                  style={{
                    borderRadius: 12,
                    height: 46,
                    fontSize: 14,
                    border: "1.5px solid #E5E7EB",
                  }}
                />
                {enrollError && (
                  <Text
                    type="danger"
                    style={{ fontSize: 13, marginTop: 6, display: "block" }}
                  >
                    {enrollError}
                  </Text>
                )}
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={closeEnroll}
                  disabled={enrolling}
                  style={{
                    padding: "0 20px",
                    height: 40,
                    borderRadius: 10,
                    border: "1.5px solid #E5E7EB",
                    background: "white",
                    color: "#6B7280",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: enrolling ? "not-allowed" : "pointer",
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={submitEnroll}
                  disabled={enrolling}
                  style={{
                    padding: "0 20px",
                    height: 40,
                    borderRadius: 10,
                    border: "none",
                    background: BRAND_GRADIENT,
                    color: "white",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: enrolling ? "not-allowed" : "pointer",
                    fontFamily: "'Poppins', sans-serif",
                    boxShadow: "0 2px 8px rgba(29,169,230,0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {enrolling ? "Đang ghi danh..." : "Xác nhận"}
                </button>
              </div>
            </div>
          </Modal>
        </div>
      </ConfigProvider>
    </StudentLayout>
  );
};

export default StudentDashboardPage;
