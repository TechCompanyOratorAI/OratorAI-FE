import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Search,
  GraduationCap,
  Users,
  Calendar,
  CheckCircle2,
  ChevronRight,
  KeyRound,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import {
  Card,
  Row,
  Col,
  Input,
  Button,
  Tag,
  Select,
  Skeleton,
  Empty,
  Modal,
  Typography,
  ConfigProvider,
  Avatar,
} from "antd";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchClassesByCourse } from "@/services/features/admin/classSlice";
import { fetchCourses } from "@/services/features/course/courseSlice";
import { enrollClassByKey, fetchEnrolledClasses } from "@/services/features/enrollment/enrollmentSlice";
import StudentLayout from "@/components/StudentLayout/StudentLayout";

const { Title, Text } = Typography;

interface ClassItem {
  classId: number;
  classCode: string;
  className: string;
  courseCode: string;
  courseName: string;
  semester: string;
  status: "active" | "inactive" | "archived";
  schedule: string;
  instructorName: string;
  description: string;
  enrollmentCount: number;
  maxStudents?: number;
  endDate: string;
}

const StudentClassesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { classes: apiClasses, loading, error } = useAppSelector((state) => state.class);
  const { courses } = useAppSelector((state) => state.course);
  const { enrolledClassIds } = useAppSelector((state) => state.enrollment);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(
    searchParams.get("courseId") ? parseInt(searchParams.get("courseId")!, 10) : null
  );

  // Modal ghi danh
  const [enrollModal, setEnrollModal] = useState<{ open: boolean; data: ClassItem | null }>({
    open: false,
    data: null,
  });
  const [enrollKey, setEnrollKey] = useState("");
  const [enrollError, setEnrollError] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    dispatch(fetchCourses({ page: 1, limit: 100 }));
    dispatch(fetchEnrolledClasses());
  }, [dispatch]);

  useEffect(() => {
    if (selectedCourseId) {
      dispatch(fetchClassesByCourse(selectedCourseId));
    }
  }, [dispatch, selectedCourseId]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleCourseChange = (courseId: number | null) => {
    setSelectedCourseId(courseId);
    setSearchQuery("");
    if (courseId) {
      setSearchParams({ courseId: String(courseId) });
    } else {
      setSearchParams({});
    }
  };

  const transformClass = (apiClass: any): ClassItem => {
    const instructors = apiClass.instructors;
    const instructorName = instructors?.length
      ? instructors
        .map((i: any) => `${i.firstName || ""} ${i.lastName || ""}`.trim() || i.username || "")
        .filter(Boolean)
        .join(", ")
      : "Chưa có giảng viên";
    return {
      classId: apiClass.classId,
      classCode: apiClass.classCode || "",
      className: apiClass.className || apiClass.course?.courseName || "",
      courseCode: apiClass.course?.courseCode || "",
      courseName: apiClass.course?.courseName || "",
      semester:
        apiClass.course?.semester && apiClass.course?.academicYear
          ? `${apiClass.course.semester} • ${apiClass.course.academicYear}`
          : "",
      status: apiClass.status === "active" ? "active" : "inactive",
      schedule: `${new Date(apiClass.startDate).toLocaleDateString("vi-VN")} – ${new Date(apiClass.endDate).toLocaleDateString("vi-VN")}`,
      instructorName: instructorName || "Chưa có giảng viên",
      description: apiClass.description || "",
      enrollmentCount: apiClass.enrollmentCount ?? 0,
      maxStudents: apiClass.maxStudents,
      endDate: apiClass.endDate || "",
    };
  };

  const filteredClasses: ClassItem[] = apiClasses
    .map(transformClass)
    .filter((c) => {
      const q = searchQuery.toLowerCase();
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

  const courseOptions = courses.map((c) => ({
    value: c.courseId,
    label: `${c.courseName}${c.semester ? ` • ${c.semester}` : ""}`,
  }));

  const selectedCourseName = courses.find((c) => c.courseId === selectedCourseId)?.courseName;

  return (
    <StudentLayout>
      <ConfigProvider componentSize="large">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

          {/* Tiêu đề */}
          <div
            className="rounded-2xl px-6 py-5 sm:px-8 sm:py-6"
            style={{ background: "linear-gradient(135deg, #eff6ff 0%, #eef2ff 50%, #f5f3ff 100%)", border: "1px solid #e0e7ff" }}
          >
            <Title level={2} className="!mb-1 !text-slate-800 !text-2xl sm:!text-3xl !font-bold">
              Khám phá lớp học
            </Title>
            <Text className="text-sm sm:text-base text-indigo-500/80">
              Chọn khóa học để xem và ghi danh các lớp học phù hợp
            </Text>
          </div>

          {/* Bộ lọc khóa học + tìm kiếm */}
          <div
            className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm space-y-5"
            style={{ border: "1px solid #f1f5f9" }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select
                showSearch
                allowClear
                placeholder="Chọn khóa học..."
                value={selectedCourseId ?? undefined}
                onChange={(val) => handleCourseChange(val ?? null)}
                options={courseOptions}
                filterOption={(input, option) =>
                  String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
                className="w-full sm:w-72"
                style={{ borderRadius: 12 }}
                suffixIcon={<BookOpen className="h-4 w-4 text-slate-400" />}
              />
              {selectedCourseId && (
                <Input
                  placeholder="Tìm kiếm lớp, mã lớp, giảng viên..."
                  prefix={<Search className="h-4 w-4 text-slate-400" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  allowClear
                  className="w-full sm:max-w-[320px]"
                  style={{ borderRadius: 12 }}
                />
              )}
            </div>

            {/* Chưa chọn khóa học */}
            {!selectedCourseId && (
              <div className="flex flex-col items-center justify-center py-14 gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                  <BookOpen className="h-8 w-8 text-indigo-400" />
                </div>
                <div className="text-center">
                  <Text strong className="block text-slate-700 text-base mb-1">
                    Chọn một khóa học để bắt đầu
                  </Text>
                  <Text type="secondary" className="text-sm">
                    Danh sách lớp học sẽ hiển thị sau khi bạn chọn khóa học ở trên
                  </Text>
                </div>
              </div>
            )}

            {/* Đã chọn khóa học — danh sách lớp */}
            {selectedCourseId && (
              <>
                {selectedCourseName && (
                  <div className="flex items-center gap-2">
                    <Text type="secondary" className="text-sm">Lớp thuộc:</Text>
                    <Tag color="blue" style={{ borderRadius: 8, fontSize: 12 }}>{selectedCourseName}</Tag>
                  </div>
                )}

                {loading ? (
                  <Row gutter={[20, 20]}>
                    {[1, 2, 3, 4].map((i) => (
                      <Col xs={24} md={12} xl={8} xxl={6} key={i}>
                        <Card style={{ borderRadius: 16 }} styles={{ body: { padding: "20px 18px" } }}>
                          <Skeleton active paragraph={{ rows: 3 }} />
                        </Card>
                      </Col>
                    ))}
                  </Row>
                ) : filteredClasses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span className="text-sm text-slate-500">
                          {searchQuery ? "Không tìm thấy lớp nào phù hợp" : "Khóa học này chưa có lớp học nào"}
                        </span>
                      }
                    />
                    {searchQuery && (
                      <Button type="link" className="!text-sm" onClick={() => setSearchQuery("")}>
                        Xóa tìm kiếm
                      </Button>
                    )}
                  </div>
                ) : (
                  <Row gutter={[20, 20]}>
                    {filteredClasses.map((c) => {
                      const enrolled = isEnrolled(c.classId);
                      const isActive = c.status === "active";
                      return (
                        <Col xs={24} md={12} xl={8} xxl={6} key={c.classId}>
                          <Card
                            hoverable
                            style={{
                              borderRadius: 16,
                              border: "1px solid #e8e8e8",
                              overflow: "hidden",
                              transition: "all 0.2s",
                            }}
                            styles={{ body: { padding: 0 } }}
                            className="group h-full"
                          >
                            {/* Header gradient */}
                            <div
                              className="relative p-5 pb-4"
                              style={{
                                background: isActive
                                  ? "linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)"
                                  : "linear-gradient(135deg, #64748b 0%, #475569 100%)",
                              }}
                            >
                              <div className="mb-2.5 flex items-center justify-between">
                                <Tag
                                  style={{
                                    borderRadius: 20,
                                    border: "none",
                                    fontSize: 11,
                                    padding: "2px 10px",
                                    background: isActive ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)",
                                    color: "#fff",
                                    fontWeight: 600,
                                  }}
                                >
                                  {isActive ? "Đang mở" : "Đã đóng"}
                                </Tag>
                                {enrolled && (
                                  <div className="flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                                    <ShieldCheck className="h-3 w-3" />
                                    Đã ghi danh
                                  </div>
                                )}
                              </div>

                              <div className="flex items-start gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                                  <GraduationCap className="h-6 w-6 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <Title
                                    level={4}
                                    className="!mb-0.5 !text-white !text-base sm:!text-lg !leading-snug !font-bold line-clamp-2"
                                  >
                                    {c.className}
                                  </Title>
                                  <Text className="text-white/80 text-xs sm:text-sm">
                                    {c.classCode}
                                    {c.courseCode ? ` • ${c.courseCode}` : ""}
                                  </Text>
                                </div>
                              </div>
                            </div>

                            {/* Body */}
                            <div className="p-4 space-y-3">
                              <div className="space-y-2.5">
                                {c.instructorName && c.instructorName !== "Chưa có giảng viên" && (
                                  <div className="flex items-center gap-2.5">
                                    <Avatar
                                      size={30}
                                      className="flex shrink-0 items-center justify-center bg-blue-100 text-blue-600 text-xs font-bold"
                                    >
                                      {c.instructorName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                      <Text type="secondary" className="block text-xs">Giảng viên</Text>
                                      <Text className="text-xs sm:text-sm font-semibold text-slate-800 truncate block">
                                        {c.instructorName}
                                      </Text>
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                                    <Users className="h-4 w-4 text-slate-500" />
                                  </div>
                                  <div>
                                    <Text type="secondary" className="block text-xs">Học sinh</Text>
                                    <Text className="text-xs sm:text-sm font-semibold text-slate-800">
                                      {c.enrollmentCount}
                                      {c.maxStudents ? ` / ${c.maxStudents}` : ""}
                                    </Text>
                                  </div>
                                </div>

                                {c.schedule && (
                                  <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                                      <Calendar className="h-4 w-4 text-slate-500" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <Text type="secondary" className="block text-xs">Lịch học</Text>
                                      <Text className="text-xs sm:text-sm font-semibold text-slate-800 truncate block">
                                        {c.schedule}
                                      </Text>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {c.description && (
                                <Text type="secondary" className="text-xs sm:text-sm line-clamp-2 block">
                                  {c.description}
                                </Text>
                              )}

                              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                {enrolled ? (
                                  <>
                                    <Button
                                      type="default"
                                      icon={<CheckCircle2 className="h-4 w-4" />}
                                      className="rounded-xl !text-sm !font-semibold !border-emerald-200 !text-emerald-700 !bg-emerald-50 h-10"
                                      onClick={() => navigate(`/student/class/${c.classId}`)}
                                    >
                                      Vào lớp
                                    </Button>
                                    <Button
                                      type="text"
                                      className="rounded-xl h-10 w-10 !p-0 flex items-center justify-center"
                                      onClick={() => navigate(`/student/class/${c.classId}`)}
                                      icon={<ChevronRight className="h-4 w-4" />}
                                      aria-label="Chi tiết lớp"
                                    />
                                  </>
                                ) : (
                                  <Button
                                    type="primary"
                                    icon={<KeyRound className="h-4 w-4" />}
                                    className="rounded-xl !text-sm !font-semibold h-10"
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
              </>
            )}
          </div>
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
              style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
                <KeyRound className="h-6 w-6 text-white" />
              </div>
              <div>
                <Title level={4} className="!mb-0.5 !text-white !text-lg !font-bold">
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
                className="text-sm"
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

export default StudentClassesPage;
