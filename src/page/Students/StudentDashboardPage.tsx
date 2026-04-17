import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Card,
  Row,
  Col,
  Input,
  Button,
  Select,
  Badge,
  Tag,
  Typography,
  Space,
  Skeleton,
  Empty,
  Tooltip,
  List,
  Avatar,
  Modal,
  ConfigProvider,
} from "antd";
import {
  Search,
  GraduationCap,
  Users,
  Calendar,
  ChevronRight,
  Sparkles,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  X,
  BookOpen,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchCourses } from "@/services/features/course/courseSlice";
import { fetchClassesByCourse } from "@/services/features/admin/classSlice";
import type { ClassData } from "@/services/features/admin/classSlice";
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
  description: string;
  enrollmentCount: number;
  maxStudents?: number;
  schedule: string;
  status: "active" | "inactive";
  endDate: string;
}

const StudentDashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const classesRef = useRef<HTMLDivElement>(null);

  const { user } = useAppSelector((state) => state.auth);
  const {
    courses,
    loading: courseLoading,
    error: courseError,
  } = useAppSelector((state) => state.course);
  const { classes: apiClasses, loading: classLoading } = useAppSelector(
    (state) => state.class,
  );
  const { enrolledClassIds } = useAppSelector((state) => state.enrollment);

  // Course filters
  const [courseSearch, setCourseSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date">("date");
  const [filterSemester, setFilterSemester] = useState<string | undefined>(
    undefined,
  );

  // Selected course
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(
    searchParams.get("courseId")
      ? parseInt(searchParams.get("courseId")!, 10)
      : null,
  );
  const [classSearch, setClassSearch] = useState("");

  // Enroll modal
  const [enrollModal, setEnrollModal] = useState<{
    open: boolean;
    data: ClassItem | null;
  }>({ open: false, data: null });
  const [enrollKey, setEnrollKey] = useState("");
  const [enrollError, setEnrollError] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  const fullName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : "Student";
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    dispatch(fetchCourses({ page: 1, limit: 100 }));
    dispatch(fetchEnrolledClasses());
  }, [dispatch]);

  useEffect(() => {
    if (courseError) toast.error(courseError);
  }, [courseError]);

  useEffect(() => {
    if (selectedCourseId) {
      dispatch(fetchClassesByCourse(selectedCourseId));
    }
  }, [dispatch, selectedCourseId]);

  const handleSelectCourse = (courseId: number) => {
    if (selectedCourseId === courseId) return;
    setSelectedCourseId(courseId);
    setClassSearch("");
    setSearchParams({ courseId: String(courseId) });
    setTimeout(
      () =>
        classesRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      100,
    );
  };

  const handleDeselectCourse = () => {
    setSelectedCourseId(null);
    setClassSearch("");
    setFilterSemester(undefined);
    setSearchParams({});
  };

  // Course helpers
  const getStatusConfig = (course: (typeof courses)[0]) => {
    const now = new Date();
    const start = new Date(course.startDate);
    const end = new Date(course.endDate);
    if (!course.isActive)
      return {
        color: "default" as const,
        label: "Đã đóng",
        dot: "default" as const,
      };
    if (start > now)
      return {
        color: "processing" as const,
        label: "Sắp mở",
        dot: "processing" as const,
      };
    if (end >= now)
      return {
        color: "success" as const,
        label: "Đang mở",
        dot: "success" as const,
      };
    return {
      color: "default" as const,
      label: "Đã kết thúc",
      dot: "default" as const,
    };
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  // Extract unique semesters from courses
  const semesterOptions = Array.from(
    new Set(courses.filter((c) => c.semester).map((c) => c.semester)),
  )
    .sort()
    .map((s) => ({ value: s, label: s }));

  const filteredCourses = courses
    .filter((c) => {
      const matchesSearch =
        !courseSearch.trim() ||
        (() => {
          const q = courseSearch.toLowerCase();
          const instructorStr = (
            c.instructors || (c.instructor ? [c.instructor] : [])
          )
            .filter(Boolean)
            .map((i) =>
              `${i?.firstName || ""} ${i?.lastName || ""}`.toLowerCase(),
            )
            .join(" ");
          return (
            c.courseName.toLowerCase().includes(q) ||
            c.courseCode.toLowerCase().includes(q) ||
            instructorStr.includes(q)
          );
        })();
      const matchesSemester = !filterSemester || c.semester === filterSemester;
      return matchesSearch && matchesSemester;
    })
    .sort((a, b) =>
      sortBy === "name"
        ? a.courseName.localeCompare(b.courseName)
        : new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    );

  // Class helpers
  const transformClass = (apiClass: ClassData): ClassItem => {
    const instructors = apiClass.instructors;
    const instructorName = instructors?.length
      ? instructors
          .map(
            (i) =>
              `${i.firstName || ""} ${i.lastName || ""}`.trim() ||
              i.username ||
              "",
          )
          .filter(Boolean)
          .join(", ")
      : "Chưa có giảng viên";
    return {
      classId: apiClass.classId,
      classCode: apiClass.classCode || "",
      className: apiClass.className || "",
      courseCode: apiClass.course?.courseCode || "",
      instructorName,
      description: apiClass.description || "",
      enrollmentCount: apiClass.enrollmentCount ?? 0,
      maxStudents: apiClass.maxStudents,
      schedule: `${new Date(apiClass.startDate).toLocaleDateString("vi-VN")} – ${new Date(apiClass.endDate).toLocaleDateString("vi-VN")}`,
      status: apiClass.status === "active" ? "active" : "inactive",
      endDate: apiClass.endDate || "",
    };
  };

  const classes: ClassItem[] = apiClasses.map(transformClass);

  const filteredClasses = classes.filter((c) => {
    const q = classSearch.toLowerCase();
    return (
      !q ||
      c.className.toLowerCase().includes(q) ||
      c.classCode.toLowerCase().includes(q) ||
      c.instructorName.toLowerCase().includes(q)
    );
  });

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

  const selectedCourse = courses.find((c) => c.courseId === selectedCourseId);

  return (
    <StudentLayout>
      <ConfigProvider componentSize="large">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Welcome */}
          <div
            className="flex items-center rounded-2xl px-6 py-5 sm:px-8 sm:py-6"
            style={{
              background:
                "linear-gradient(135deg, #eff6ff 0%, #eef2ff 50%, #f5f3ff 100%)",
              border: "1px solid #e0e7ff",
            }}
          >
            <div className="flex items-center gap-4">
              <Avatar
                size={64}
                className="bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 flex items-center justify-center shadow-xl ring-4 ring-blue-100/60"
              >
                <span className="text-white font-bold text-xl">{initials}</span>
              </Avatar>
              <div>
                <div className="mb-0.5 flex items-center gap-1.5 text-xs font-medium text-indigo-400 sm:text-sm">
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Chào bạn,
                </div>
                <Title
                  level={3}
                  className="!mb-0.5 !text-slate-800 !text-xl sm:!text-2xl lg:!text-3xl !font-bold"
                >
                  {fullName}
                </Title>
                <Text className="text-sm text-indigo-500/80">
                  Tiếp tục hành trình chinh phục kỹ năng thuyết trình
                </Text>
              </div>
            </div>
          </div>

          {/* Khóa học */}
          <div
            className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm space-y-4"
            style={{ border: "1px solid #f1f5f9" }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Title
                  level={4}
                  className="!mb-0 !text-slate-800 !text-lg sm:!text-xl !font-bold"
                >
                  Khóa học
                </Title>
              </div>
              <Space size="middle" wrap>
                <Input
                  placeholder="Tìm kiếm..."
                  prefix={<Search className="h-4 w-4 text-slate-400" />}
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  allowClear
                  className="min-h-[36px] sm:min-w-[200px]"
                  style={{ borderRadius: 10 }}
                />
                <Select
                  placeholder="Tất cả kỳ"
                  value={filterSemester}
                  onChange={setFilterSemester}
                  allowClear
                  className="min-h-[36px] min-w-[140px]"
                  style={{ borderRadius: 10 }}
                  options={semesterOptions}
                />
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  className="min-h-[36px] min-w-[140px]"
                  style={{ borderRadius: 10 }}
                  options={[
                    { value: "date", label: "Ngày bắt đầu" },
                    { value: "name", label: "Tên khóa" },
                  ]}
                />
              </Space>
            </div>

            {courseLoading ? (
              <Space direction="vertical" className="w-full" size={10}>
                {[1, 2, 3].map((i) => (
                  <Card key={i} style={{ borderRadius: 14 }}>
                    <Skeleton active paragraph={{ rows: 2 }} />
                  </Card>
                ))}
              </Space>
            ) : filteredCourses.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Chưa có khóa học nào"
              />
            ) : (
              <List
                dataSource={filteredCourses}
                renderItem={(course) => {
                  const status = getStatusConfig(course);
                  const isSelected = selectedCourseId === course.courseId;
                  const activeClassCount = course.totalActiveClasses ?? 0;
                  const instructorNames = (
                    course.instructors ||
                    (course.instructor ? [course.instructor] : [])
                  )
                    .filter(Boolean)
                    .map(
                      (i) =>
                        `${i?.firstName || ""} ${i?.lastName || ""}`.trim() ||
                        i?.username,
                    )
                    .join(", ");

                  return (
                    <List.Item
                      style={{
                        padding: "14px 18px",
                        borderRadius: 14,
                        marginBottom: 8,
                        border: isSelected
                          ? "1.5px solid #6366f1"
                          : "1px solid #e8efff",
                        background: isSelected ? "#f0f4ff" : "#f8faff",
                        transition: "all 0.2s",
                        cursor: "pointer",
                        boxShadow: isSelected
                          ? "0 2px 8px rgba(99,102,241,0.12)"
                          : undefined,
                      }}
                      className={
                        isSelected
                          ? ""
                          : "hover:!border-blue-300 hover:!bg-white hover:shadow-sm"
                      }
                      onClick={() => handleSelectCourse(course.courseId)}
                    >
                      <div className="flex w-full items-center gap-4">
                        <Badge status={status.dot}>
                          <Avatar
                            size={46}
                            shape="square"
                            style={{
                              background: course.isActive
                                ? "linear-gradient(135deg, #3b82f6, #6366f1)"
                                : "#94a3b8",
                              borderRadius: 12,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            icon={
                              <GraduationCap
                                className="text-white"
                                style={{ width: 20, height: 20 }}
                              />
                            }
                          />
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <Text
                              strong
                              className="truncate text-sm text-slate-800 sm:text-base"
                            >
                              {course.courseName}
                            </Text>
                            <Tag
                              color={status.color}
                              style={{
                                borderRadius: 6,
                                fontSize: 11,
                                padding: "1px 8px",
                                border: 0,
                              }}
                            >
                              {status.label}
                            </Tag>
                            {course.semester && (
                              <Tag
                                style={{
                                  borderRadius: 6,
                                  fontSize: 11,
                                  padding: "1px 8px",
                                }}
                              >
                                {course.semester}
                              </Tag>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            {instructorNames ? (
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5 shrink-0" />
                                {instructorNames}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-amber-600">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                Chưa có giảng viên
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                              {formatDate(new Date(course.startDate))}
                            </span>
                          </div>
                        </div>
                        <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                          {course.isActive && activeClassCount > 0 && (
                            <Tooltip
                              title={`Có ${activeClassCount} lớp đang mở — bấm để xem`}
                              placement="left"
                            >
                              <div
                                className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-indigo-600"
                                style={{
                                  background: isSelected
                                    ? "rgba(99,102,241,0.1)"
                                    : "#eff6ff",
                                  border: "1px solid #c7d2fe",
                                }}
                              >
                                <BookOpen className="h-3.5 w-3.5" />
                                <span>{activeClassCount} lớp</span>
                              </div>
                            </Tooltip>
                          )}
                          <ChevronRight
                            className={`h-4 w-4 transition-transform ${isSelected ? "rotate-90 text-indigo-400" : "text-slate-300"}`}
                          />
                        </div>
                      </div>
                    </List.Item>
                  );
                }}
              />
            )}
          </div>

          {/* Lớp học (inline, xuất hiện khi chọn khóa) */}
          {selectedCourseId && (
            <div
              ref={classesRef}
              className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm space-y-4"
              style={{ border: "1.5px solid #e0e7ff" }}
            >
              {/* Header lớp */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                    <GraduationCap className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="min-w-0">
                    <Title
                      level={5}
                      className="!mb-0 !text-slate-800 !font-bold truncate"
                    >
                      {selectedCourse?.courseName}
                    </Title>
                    {selectedCourse?.semester && (
                      <Text type="secondary" className="text-xs">
                        {selectedCourse.semester}
                      </Text>
                    )}
                  </div>
                </div>
                <Button
                  type="text"
                  size="small"
                  icon={<X className="h-4 w-4" />}
                  onClick={handleDeselectCourse}
                  className="shrink-0 !text-slate-400 hover:!text-slate-600"
                />
              </div>

              {/* Tìm kiếm lớp */}
              <Input
                placeholder="Tìm lớp, mã lớp, giảng viên..."
                prefix={<Search className="h-4 w-4 text-slate-400" />}
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                allowClear
                style={{ borderRadius: 10, maxWidth: 340 }}
              />

              {/* Danh sách lớp */}
              {classLoading ? (
                <Row gutter={[16, 16]}>
                  {[1, 2, 3].map((i) => (
                    <Col xs={24} md={12} xl={8} key={i}>
                      <Card
                        style={{ borderRadius: 14 }}
                        styles={{ body: { padding: "18px 16px" } }}
                      >
                        <Skeleton active paragraph={{ rows: 3 }} />
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : filteredClasses.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    classSearch
                      ? "Không tìm thấy lớp phù hợp"
                      : "Khóa học này chưa có lớp học"
                  }
                />
              ) : (
                <Row gutter={[16, 16]}>
                  {filteredClasses.map((c) => {
                    const enrolled = isEnrolled(c.classId);
                    const isActive = c.status === "active";
                    const GRADIENTS = [
                      "linear-gradient(145deg, #3b82f6 0%, #6366f1 55%, #8b5cf6 100%)",
                      "linear-gradient(145deg, #10b981 0%, #059669 100%)",
                      "linear-gradient(145deg, #8b5cf6 0%, #7c3aed 100%)",
                      "linear-gradient(145deg, #f59e0b 0%, #ea580c 100%)",
                      "linear-gradient(145deg, #ec4899 0%, #db2777 100%)",
                      "linear-gradient(145deg, #06b6d4 0%, #2563eb 100%)",
                    ];
                    const getGradient = (code: string) => {
                      let hash = 0;
                      for (let i = 0; i < code.length; i++)
                        hash = code.charCodeAt(i) + ((hash << 5) - hash);
                      return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
                    };
                    const cardGradient = getGradient(
                      c.classCode || c.className,
                    );

                    return (
                      <Col xs={24} sm={12} lg={8} key={c.classId}>
                        <Card
                          hoverable
                          bordered={false}
                          style={{
                            borderRadius: 22,
                            overflow: "hidden",
                            boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
                          }}
                          styles={{ body: { padding: 0 } }}
                          className="group cursor-pointer"
                          onClick={() =>
                            enrolled
                              ? navigate(`/student/class/${c.classId}`)
                              : !isActive
                                ? null
                                : openEnroll(c)
                          }
                        >
                          {/* Header với gradient */}
                          <div
                            className="relative px-5 pt-5 pb-4 text-white overflow-hidden"
                            style={{ background: cardGradient }}
                          >
                            {/* Hiệu ứng blob */}
                            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
                            <div className="pointer-events-none absolute -left-4 bottom-0 h-20 w-20 rounded-full bg-white/10" />

                            <div className="relative">
                              {/* Top row: course badge + status */}
                              <div className="flex items-center justify-between mb-3">
                                <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold text-white border border-white/25">
                                  {selectedCourse?.courseName || "—"}
                                </span>
                                {enrolled && (
                                  <div className="flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-0.5 text-xs font-semibold text-white">
                                    <ShieldCheck className="h-3 w-3" />
                                    Đã ghi danh
                                  </div>
                                )}
                              </div>

                              {/* Mã lớp nổi bật */}
                              <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/25 mb-3">
                                <Text className="!block !text-[10px] !font-semibold !uppercase !tracking-widest !text-white/70 !mb-0.5">
                                  Mã lớp
                                </Text>
                                <div className="flex items-center gap-2">
                                  <span className="!text-white !text-lg sm:!text-xl !font-black !tracking-tight">
                                    {c.classCode}
                                  </span>
                                </div>
                              </div>

                              {/* Tên lớp */}
                              <Title
                                level={4}
                                className="!mb-2 !text-white !text-base sm:!text-lg !font-bold !leading-snug"
                              >
                                {c.className}
                              </Title>

                              {/* Giảng viên */}
                              {c.instructorName !== "Chưa có giảng viên" && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Avatar
                                    size={30}
                                    className="bg-white/25 text-white text-xs font-bold border-2 border-white/30"
                                  >
                                    {c.instructorName
                                      .split(" ")
                                      .slice(0, 2)
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()}
                                  </Avatar>
                                  <div className="min-w-0 flex-1">
                                    <Text className="!block !text-[10px] !text-white/60 !uppercase !tracking-wide">
                                      Giảng viên
                                    </Text>
                                    <Text className="!text-white !text-xs !font-semibold truncate block">
                                      {c.instructorName}
                                    </Text>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="px-5 py-4 bg-gradient-to-b from-slate-50/80 to-white">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3.5 w-3.5" />
                                  {c.enrollmentCount}
                                  {c.maxStudents ? `/${c.maxStudents}` : ""}
                                </span>
                                <Tag
                                  color={isActive ? "success" : "default"}
                                  className="!m-0 !text-[10px] !font-semibold"
                                  style={{ borderRadius: 20 }}
                                >
                                  {isActive ? "Đang mở" : "Đã đóng"}
                                </Tag>
                              </div>
                              <Button
                                type={enrolled ? "default" : "primary"}
                                size="small"
                                icon={
                                  enrolled ? (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  ) : (
                                    <KeyRound className="h-3.5 w-3.5" />
                                  )
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (enrolled)
                                    navigate(`/student/class/${c.classId}`);
                                  else if (isActive) openEnroll(c);
                                }}
                                disabled={!isActive && !enrolled}
                                className={
                                  enrolled
                                    ? "!border-emerald-200 !text-emerald-600 !bg-emerald-50 !rounded-xl !text-xs !font-semibold"
                                    : "!rounded-xl !text-xs !font-semibold"
                                }
                              >
                                {enrolled ? "Vào lớp" : "Ghi danh"}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              )}
            </div>
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
            content: { borderRadius: 16, padding: "24px 20px 20px" },
            header: { display: "none" },
          }}
        >
          <div className="space-y-5">
            <div
              className="flex items-center gap-3 rounded-xl p-4"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              }}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
                <KeyRound className="h-6 w-6 text-white" />
              </div>
              <div>
                <Title
                  level={4}
                  className="!mb-0.5 !text-white !text-lg !font-bold"
                >
                  Ghi danh lớp học
                </Title>
                <Text className="text-white/80 text-sm">
                  {enrollModal.data?.className}
                </Text>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Mã ghi danh
              </label>
              <Input
                placeholder="Nhập mã ghi danh do giáo viên cung cấp"
                prefix={<KeyRound className="h-4 w-4 text-slate-400" />}
                value={enrollKey}
                onChange={(e) => {
                  setEnrollKey(e.target.value);
                  if (enrollError) setEnrollError("");
                }}
                status={enrollError ? "error" : undefined}
                style={{ borderRadius: 12, height: 44 }}
              />
              {enrollError && (
                <Text type="danger" className="mt-1.5 block text-sm">
                  {enrollError}
                </Text>
              )}
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                onClick={closeEnroll}
                disabled={enrolling}
                style={{ borderRadius: 10, height: 40 }}
                className="!text-sm !font-semibold min-w-[90px]"
              >
                Hủy
              </Button>
              <Button
                type="primary"
                onClick={submitEnroll}
                loading={enrolling}
                style={{ borderRadius: 10, height: 40 }}
                className="!text-sm !font-semibold min-w-[130px]"
              >
                {enrolling ? "Đang ghi danh..." : "Xác nhận"}
              </Button>
            </div>
          </div>
        </Modal>
      </ConfigProvider>
    </StudentLayout>
  );
};

export default StudentDashboardPage;
