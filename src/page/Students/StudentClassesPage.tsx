import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  SearchOutlined,
  TeamOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  RightOutlined,
  SafetyOutlined,
  ReadOutlined,
  FilterOutlined,
  BookOutlined,
  KeyOutlined,
} from "@ant-design/icons";
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
  Typography,
  ConfigProvider,
  Avatar,
  Divider,
} from "antd";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchClassesByCourse } from "@/services/features/admin/classSlice";
import { fetchCourses } from "@/services/features/course/courseSlice";
import {
  fetchEnrolledClasses,
} from "@/services/features/enrollment/enrollmentSlice";
import StudentLayout from "@/components/StudentLayout/StudentLayout";
import EnrollModal from "@/components/Department/EnrollModal";

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

  const {
    classes: apiClasses,
    loading,
    error,
  } = useAppSelector((state) => state.class);
  const { courses } = useAppSelector((state) => state.course);
  const { enrolledClassIds } = useAppSelector((state) => state.enrollment);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(
    searchParams.get("courseId")
      ? parseInt(searchParams.get("courseId")!, 10)
      : null,
  );

  const [enrollModal, setEnrollModal] = useState<{
    open: boolean;
    data: ClassItem | null;
  }>({
    open: false,
    data: null,
  });

  useEffect(() => {
    dispatch(fetchCourses({ page: 1, limit: 100 }));
    dispatch(fetchEnrolledClasses());
  }, [dispatch]);

  useEffect(() => {
    if (selectedCourseId) {
      dispatch(fetchClassesByCourse({ courseId: selectedCourseId }));
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
          .map(
            (i: any) =>
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
  };
  const closeEnroll = () => {
    setEnrollModal({ open: false, data: null });
  };

  const courseOptions = courses.map((c) => ({
    value: c.courseId,
    label: `${c.courseName}${c.semester ? ` • ${c.semester}` : ""}`,
  }));

  const selectedCourseName = courses.find(
    (c) => c.courseId === selectedCourseId,
  )?.courseName;
  const enrolledCount = filteredClasses.filter((c) =>
    isEnrolled(c.classId),
  ).length;

  return (
    <StudentLayout>
      <ConfigProvider componentSize="large">
        <div className="max-w-7xl mx-auto space-y-5">
          {/* Page header */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Title
                level={3}
                className="!mb-0.5 !text-gray-900 !font-semibold !text-xl sm:!text-2xl"
              >
                Khám phá lớp học
              </Title>
              <Text className="text-sm text-gray-400">
                Chọn khóa học, tìm lớp và ghi danh bằng mã do giảng viên cung
                cấp
              </Text>
            </div>
            {selectedCourseId && filteredClasses.length > 0 && (
              <Text className="text-xs text-gray-400 pb-0.5">
                {filteredClasses.length} lớp
                {enrolledCount > 0 && ` · ${enrolledCount} đã ghi danh`}
              </Text>
            )}
          </div>

          {/* Filter bar */}
          <div className="rounded-xl bg-white px-5 py-4 border border-gray-100 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <FilterOutlined className="text-gray-400 text-sm" />
                <Text className="text-xs font-medium text-gray-500 whitespace-nowrap">
                  Bộ lọc
                </Text>
              </div>
              <Divider type="vertical" className="!h-4 !mx-1 hidden sm:block" />
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                <Select
                  showSearch
                  allowClear
                  placeholder="Chọn khóa học..."
                  value={selectedCourseId ?? undefined}
                  onChange={(val) => handleCourseChange(val ?? null)}
                  options={courseOptions}
                  filterOption={(input, option) =>
                    String(option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  className="w-full sm:w-80"
                  suffixIcon={<BookOutlined className="text-gray-400" />}
                />
                {selectedCourseId && (
                  <Input
                    placeholder="Tìm lớp, mã lớp, giảng viên..."
                    prefix={<SearchOutlined className="text-gray-400" />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    allowClear
                    className="w-full sm:max-w-xs"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Content area */}
          {!selectedCourseId ? (
            <div className="flex flex-col items-center justify-center rounded-xl bg-white py-20 border border-gray-100 shadow-sm">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gray-50 border border-gray-200">
                <ReadOutlined className="text-2xl text-gray-400" />
              </div>
              <Text strong className="mb-1 block text-gray-700">
                Chọn một khóa học để bắt đầu
              </Text>
              <Text type="secondary" className="text-sm text-center max-w-xs">
                Danh sách lớp học sẽ hiển thị sau khi bạn chọn khóa học ở trên
              </Text>
            </div>
          ) : loading ? (
            <Row gutter={[16, 16]}>
              {[1, 2, 3, 4].map((i) => (
                <Col xs={24} sm={12} xl={8} xxl={6} key={i}>
                  <Card
                    className="rounded-xl border-gray-100"
                    styles={{ body: { padding: "20px" } }}
                  >
                    <Skeleton active paragraph={{ rows: 3 }} />
                  </Card>
                </Col>
              ))}
            </Row>
          ) : filteredClasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 border border-gray-100 shadow-sm">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span className="text-sm text-gray-400">
                    {searchQuery
                      ? "Không tìm thấy lớp nào phù hợp"
                      : "Khóa học này chưa có lớp học nào"}
                  </span>
                }
              />
              {searchQuery && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => setSearchQuery("")}
                >
                  Xóa tìm kiếm
                </Button>
              )}
            </div>
          ) : (
            <>
              {selectedCourseName && (
                <div className="flex items-center gap-2">
                  <Text type="secondary" className="text-xs">
                    Khóa học:
                  </Text>
                  <Tag className="!rounded-full !text-xs !m-0 !border-gray-200 !text-gray-600 !bg-gray-50">
                    {selectedCourseName}
                  </Tag>
                </div>
              )}
              <Row gutter={[16, 16]}>
                {filteredClasses.map((c) => {
                  const enrolled = isEnrolled(c.classId);
                  const isActive = c.status === "active";
                  return (
                    <Col xs={24} sm={12} xl={8} xxl={6} key={c.classId}>
                      <Card
                        hoverable
                        className="group h-full rounded-xl overflow-hidden transition-shadow duration-200 hover:shadow-md"
                        style={{ border: "1px solid #f0f0f0" }}
                        styles={{ body: { padding: 0 } }}
                      >
                        {/* Top border indicator */}
                        <div
                          className="h-0.5 w-full"
                          style={{
                            background: enrolled
                              ? "#52c41a"
                              : isActive
                                ? "#1677ff"
                                : "#d9d9d9",
                          }}
                        />

                        <div className="p-5 space-y-4">
                          {/* Class identity */}
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 border border-gray-100">
                              <ReadOutlined
                                className={`text-base ${isActive ? "text-blue-500" : "text-gray-300"}`}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <Title
                                level={5}
                                className="!mb-0.5 !text-gray-800 !text-sm !font-semibold !leading-snug line-clamp-2"
                              >
                                {c.className}
                              </Title>
                              <Text className="text-xs text-gray-400">
                                {c.classCode}
                                {c.courseCode ? ` · ${c.courseCode}` : ""}
                              </Text>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <Tag
                                className="!m-0 !text-[10px] !px-2 !py-0 !rounded-full !font-medium"
                                color={isActive ? "processing" : "default"}
                              >
                                {isActive ? "Đang mở" : "Đã đóng"}
                              </Tag>
                              {enrolled && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <SafetyOutlined className="text-[11px]" />
                                  <span className="text-[10px] font-semibold">
                                    Đã ghi danh
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Details */}
                          <div className="space-y-2.5 rounded-lg bg-gray-50 px-3.5 py-3 border border-gray-100">
                            {c.instructorName &&
                              c.instructorName !== "Chưa có giảng viên" && (
                                <div className="flex items-center gap-2.5">
                                  <Avatar
                                    size={24}
                                    className="shrink-0 !bg-gray-200 !text-gray-600 !text-[10px] !font-bold flex items-center justify-center"
                                  >
                                    {c.instructorName
                                      .split(" ")
                                      .slice(-2)
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()}
                                  </Avatar>
                                  <div className="min-w-0">
                                    <Text className="text-[10px] text-gray-400 block">
                                      Giảng viên
                                    </Text>
                                    <Text className="text-xs font-medium text-gray-700 truncate block">
                                      {c.instructorName}
                                    </Text>
                                  </div>
                                </div>
                              )}

                            <div className="flex items-center gap-2.5">
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                                <TeamOutlined className="text-gray-400 text-sm" />
                              </div>
                              <div>
                                <Text className="text-[10px] text-gray-400 block">
                                  Học sinh
                                </Text>
                                <Text className="text-xs font-medium text-gray-700">
                                  {c.enrollmentCount}
                                  {c.maxStudents ? ` / ${c.maxStudents}` : ""}
                                </Text>
                              </div>
                            </div>

                            {c.schedule && (
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                                  <CalendarOutlined className="text-gray-400 text-sm" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <Text className="text-[10px] text-gray-400 block">
                                    Thời gian
                                  </Text>
                                  <Text className="text-xs font-medium text-gray-700 truncate block">
                                    {c.schedule}
                                  </Text>
                                </div>
                              </div>
                            )}
                          </div>

                          {c.description && (
                            <Text
                              type="secondary"
                              className="text-xs line-clamp-2 block leading-relaxed"
                            >
                              {c.description}
                            </Text>
                          )}

                          {/* Actions */}
                          <div className="flex items-center justify-end gap-2 pt-1">
                            {enrolled ? (
                              <Button
                                type="default"
                                icon={
                                  <CheckCircleOutlined className="text-green-600" />
                                }
                                size="middle"
                                className="rounded-lg !text-xs !font-medium !border-gray-200 !text-gray-700 flex items-center gap-1"
                                onClick={() =>
                                  navigate(`/student/class/${c.classId}`)
                                }
                                iconPosition="start"
                              >
                                Vào lớp
                                <RightOutlined className="text-[10px] text-gray-400" />
                              </Button>
                            ) : (
                              <Button
                                type="primary"
                                icon={<KeyOutlined />}
                                size="middle"
                                className="rounded-lg !text-xs !font-medium flex items-center gap-1"
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
            </>
          )}
        </div>

        <EnrollModal
          open={enrollModal.open}
          classData={enrollModal.data ?? null}
          onClose={closeEnroll}
        />
      </ConfigProvider>
    </StudentLayout>
  );
};

export default StudentClassesPage;
