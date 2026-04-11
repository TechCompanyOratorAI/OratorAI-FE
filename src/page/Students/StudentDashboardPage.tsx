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
  Progress,
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
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchCourses } from "@/services/features/course/courseSlice";
import { fetchClassesByCourse } from "@/services/features/admin/classSlice";
import type { ClassData } from "@/services/features/admin/classSlice";
import { enrollClassByKey, fetchEnrolledClasses } from "@/services/features/enrollment/enrollmentSlice";
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
  const { courses, loading: courseLoading, error: courseError } = useAppSelector((state) => state.course);
  const { classes: apiClasses, loading: classLoading } = useAppSelector((state) => state.class);
  const { enrolledClassIds } = useAppSelector((state) => state.enrollment);

  // Course filters
  const [courseSearch, setCourseSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date">("date");

  // Selected course
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(
    searchParams.get("courseId") ? parseInt(searchParams.get("courseId")!, 10) : null
  );
  const [classSearch, setClassSearch] = useState("");

  // Enroll modal
  const [enrollModal, setEnrollModal] = useState<{ open: boolean; data: ClassItem | null }>({ open: false, data: null });
  const [enrollKey, setEnrollKey] = useState("");
  const [enrollError, setEnrollError] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "Student";
  const initials = fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

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
    setTimeout(() => classesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const handleDeselectCourse = () => {
    setSelectedCourseId(null);
    setClassSearch("");
    setSearchParams({});
  };

  // Course helpers
  const getStatusConfig = (course: typeof courses[0]) => {
    const now = new Date();
    const start = new Date(course.startDate);
    const end = new Date(course.endDate);
    if (!course.isActive) return { color: "default" as const, label: "Đã đóng", dot: "default" as const };
    if (start > now) return { color: "processing" as const, label: "Sắp mở", dot: "processing" as const };
    if (end >= now) return { color: "success" as const, label: "Đang mở", dot: "success" as const };
    return { color: "default" as const, label: "Đã kết thúc", dot: "default" as const };
  };

  const getProgress = (course: typeof courses[0]) => {
    const now = new Date();
    const start = new Date(course.startDate);
    const end = new Date(course.endDate);
    if (start > now) return 0;
    if (end < now) return 100;
    return Math.min(100, Math.round(((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100));
  };

  const formatDate = (d: Date) => d.toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" });

  const filteredCourses = courses
    .filter((c) => {
      if (!courseSearch.trim()) return true;
      const q = courseSearch.toLowerCase();
      const instructorStr = (c.instructors || (c.instructor ? [c.instructor] : []))
        .filter(Boolean)
        .map((i) => `${i?.firstName || ""} ${i?.lastName || ""}`.toLowerCase())
        .join(" ");
      return c.courseName.toLowerCase().includes(q) || c.courseCode.toLowerCase().includes(q) || instructorStr.includes(q);
    })
    .sort((a, b) =>
      sortBy === "name"
        ? a.courseName.localeCompare(b.courseName)
        : new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

  // Class helpers
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const transformClass = (apiClass: ClassData): ClassItem => {
    const instructors = apiClass.instructors;
    const instructorName = instructors?.length
      ? instructors.map((i) => `${i.firstName || ""} ${i.lastName || ""}`.trim() || i.username || "").filter(Boolean).join(", ")
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

  const classes: ClassItem[] = apiClasses
    .map(transformClass)
    .filter((c) => !(c.endDate && new Date(c.endDate) < today));

  const filteredClasses = classes.filter((c) => {
    const q = classSearch.toLowerCase();
    return !q || c.className.toLowerCase().includes(q) || c.classCode.toLowerCase().includes(q) || c.instructorName.toLowerCase().includes(q);
  });

  const isEnrolled = (classId: number) => enrolledClassIds.includes(classId);

  const openEnroll = (c: ClassItem) => { setEnrollModal({ open: true, data: c }); setEnrollKey(""); setEnrollError(""); };
  const closeEnroll = () => { setEnrollModal({ open: false, data: null }); setEnrollKey(""); setEnrollError(""); };

  const submitEnroll = async () => {
    if (!enrollModal.data) return;
    const trimmed = enrollKey.trim();
    if (!trimmed) { setEnrollError("Vui lòng nhập mã ghi danh"); return; }
    try {
      setEnrolling(true);
      await dispatch(enrollClassByKey({ classId: enrollModal.data.classId, enrollKey: trimmed })).unwrap();
      await dispatch(fetchEnrolledClasses());
      toast.success(`Đã ghi danh thành công lớp "${enrollModal.data.className}"!`);
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
            style={{ background: "linear-gradient(135deg, #eff6ff 0%, #eef2ff 50%, #f5f3ff 100%)", border: "1px solid #e0e7ff" }}
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
                <Title level={3} className="!mb-0.5 !text-slate-800 !text-xl sm:!text-2xl lg:!text-3xl !font-bold">
                  {fullName}
                </Title>
                <Text className="text-sm text-indigo-500/80">
                  Tiếp tục hành trình chinh phục kỹ năng thuyết trình
                </Text>
              </div>
            </div>
          </div>

          {/* Khóa học */}
          <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm space-y-4" style={{ border: "1px solid #f1f5f9" }}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Title level={4} className="!mb-0 !text-slate-800 !text-lg sm:!text-xl !font-bold">
                Khóa học
              </Title>
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
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có khóa học nào" />
            ) : (
              <List
                dataSource={filteredCourses}
                renderItem={(course) => {
                  const status = getStatusConfig(course);
                  const progress = getProgress(course);
                  const isSelected = selectedCourseId === course.courseId;
                  const instructorNames = (course.instructors || (course.instructor ? [course.instructor] : []))
                    .filter(Boolean)
                    .map((i) => `${i?.firstName || ""} ${i?.lastName || ""}`.trim() || i?.username)
                    .join(", ");

                  return (
                    <List.Item
                      style={{
                        padding: "14px 18px",
                        borderRadius: 14,
                        marginBottom: 8,
                        border: isSelected ? "1.5px solid #6366f1" : "1px solid #e8efff",
                        background: isSelected ? "#f0f4ff" : "#f8faff",
                        transition: "all 0.2s",
                        cursor: "pointer",
                        boxShadow: isSelected ? "0 2px 8px rgba(99,102,241,0.12)" : undefined,
                      }}
                      className={isSelected ? "" : "hover:!border-blue-300 hover:!bg-white hover:shadow-sm"}
                      onClick={() => handleSelectCourse(course.courseId)}
                    >
                      <div className="flex w-full items-center gap-4">
                        <Badge status={status.dot}>
                          <Avatar
                            size={46}
                            shape="square"
                            style={{
                              background: course.isActive ? "linear-gradient(135deg, #3b82f6, #6366f1)" : "#94a3b8",
                              borderRadius: 12,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                            icon={<GraduationCap className="text-white" style={{ width: 20, height: 20 }} />}
                          />
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <Text strong className="truncate text-sm text-slate-800 sm:text-base">{course.courseName}</Text>
                            <Tag color={status.color} style={{ borderRadius: 6, fontSize: 11, padding: "1px 8px", border: 0 }}>
                              {status.label}
                            </Tag>
                            {course.semester && (
                              <Tag style={{ borderRadius: 6, fontSize: 11, padding: "1px 8px" }}>{course.semester}</Tag>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            {instructorNames ? (
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5 shrink-0" />{instructorNames}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-amber-600">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />Chưa có giảng viên
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                              {formatDate(new Date(course.startDate))}
                            </span>
                          </div>
                        </div>
                        <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                          {course.isActive && (
                            <Progress
                              type="circle"
                              percent={progress}
                              size={44}
                              strokeWidth={7}
                              strokeColor={isSelected ? "#6366f1" : "#3b82f6"}
                              format={(p) => <span className="text-[10px] font-semibold">{p}%</span>}
                            />
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
                    <Title level={5} className="!mb-0 !text-slate-800 !font-bold truncate">
                      {selectedCourse?.courseName}
                    </Title>
                    {selectedCourse?.semester && (
                      <Text type="secondary" className="text-xs">{selectedCourse.semester}</Text>
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
                      <Card style={{ borderRadius: 14 }} styles={{ body: { padding: "18px 16px" } }}>
                        <Skeleton active paragraph={{ rows: 3 }} />
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : filteredClasses.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={classSearch ? "Không tìm thấy lớp phù hợp" : "Khóa học này chưa có lớp học"}
                />
              ) : (
                <Row gutter={[16, 16]}>
                  {filteredClasses.map((c) => {
                    const enrolled = isEnrolled(c.classId);
                    const isActive = c.status === "active";
                    return (
                      <Col xs={24} md={12} xl={8} key={c.classId}>
                        <Card
                          hoverable
                          style={{ borderRadius: 14, border: "1px solid #e8e8e8", overflow: "hidden" }}
                          styles={{ body: { padding: 0 } }}
                          className="group h-full"
                        >
                          {/* Gradient header */}
                          <div
                            className="p-4 pb-3"
                            style={{
                              background: isActive
                                ? "linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)"
                                : "linear-gradient(135deg, #64748b 0%, #475569 100%)",
                            }}
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <Tag style={{ borderRadius: 20, border: "none", fontSize: 11, padding: "2px 10px", background: isActive ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)", color: "#fff", fontWeight: 600 }}>
                                {isActive ? "Đang mở" : "Đã đóng"}
                              </Tag>
                              {enrolled && (
                                <div className="flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-0.5 text-xs font-semibold text-white">
                                  <ShieldCheck className="h-3 w-3" />Đã ghi danh
                                </div>
                              )}
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                                <GraduationCap className="h-5 w-5 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <Title level={5} className="!mb-0.5 !text-white !leading-snug !font-bold line-clamp-2">
                                  {c.className}
                                </Title>
                                <Text className="text-white/80 text-xs">
                                  {c.classCode}{c.courseCode ? ` • ${c.courseCode}` : ""}
                                </Text>
                              </div>
                            </div>
                          </div>

                          {/* Body */}
                          <div className="p-4 space-y-2.5">
                            {c.instructorName !== "Chưa có giảng viên" && (
                              <div className="flex items-center gap-2.5">
                                <Avatar size={28} className="bg-blue-100 text-blue-600 text-xs font-bold shrink-0">
                                  {c.instructorName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <Text type="secondary" className="block text-[11px]">Giảng viên</Text>
                                  <Text className="text-xs font-semibold text-slate-800 truncate block">{c.instructorName}</Text>
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                                <Users className="h-3.5 w-3.5 text-slate-500" />
                              </div>
                              <div>
                                <Text type="secondary" className="block text-[11px]">Học sinh</Text>
                                <Text className="text-xs font-semibold text-slate-800">
                                  {c.enrollmentCount}{c.maxStudents ? ` / ${c.maxStudents}` : ""}
                                </Text>
                              </div>
                            </div>
                            {c.schedule && (
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                </div>
                                <div className="min-w-0">
                                  <Text type="secondary" className="block text-[11px]">Lịch học</Text>
                                  <Text className="text-xs font-semibold text-slate-800 truncate block">{c.schedule}</Text>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                              {enrolled ? (
                                <Button
                                  type="default"
                                  icon={<CheckCircle2 className="h-4 w-4" />}
                                  className="rounded-xl !text-xs !font-semibold !border-emerald-200 !text-emerald-700 !bg-emerald-50 h-9"
                                  onClick={() => navigate(`/student/class/${c.classId}`)}
                                >
                                  Vào lớp
                                </Button>
                              ) : (
                                <Button
                                  type="primary"
                                  icon={<KeyRound className="h-4 w-4" />}
                                  className="rounded-xl !text-xs !font-semibold h-9"
                                  onClick={() => openEnroll(c)}
                                  disabled={!isActive}
                                >
                                  Ghi danh
                                </Button>
                              )}
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
          styles={{ content: { borderRadius: 16, padding: "24px 20px 20px" }, header: { display: "none" } }}
        >
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-xl p-4" style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
                <KeyRound className="h-6 w-6 text-white" />
              </div>
              <div>
                <Title level={4} className="!mb-0.5 !text-white !text-lg !font-bold">Ghi danh lớp học</Title>
                <Text className="text-white/80 text-sm">{enrollModal.data?.className}</Text>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Mã ghi danh</label>
              <Input
                placeholder="Nhập mã ghi danh do giáo viên cung cấp"
                prefix={<KeyRound className="h-4 w-4 text-slate-400" />}
                value={enrollKey}
                onChange={(e) => { setEnrollKey(e.target.value); if (enrollError) setEnrollError(""); }}
                status={enrollError ? "error" : undefined}
                style={{ borderRadius: 12, height: 44 }}
              />
              {enrollError && <Text type="danger" className="mt-1.5 block text-sm">{enrollError}</Text>}
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button onClick={closeEnroll} disabled={enrolling} style={{ borderRadius: 10, height: 40 }} className="!text-sm !font-semibold min-w-[90px]">
                Hủy
              </Button>
              <Button type="primary" onClick={submitEnroll} loading={enrolling} style={{ borderRadius: 10, height: 40 }} className="!text-sm !font-semibold min-w-[130px]">
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
