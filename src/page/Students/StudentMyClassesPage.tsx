import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Card,
  Row,
  Col,
  Input,
  Button,
  Tag,
  Typography,
  Space,
  Skeleton,
  ConfigProvider,
  Avatar,
  Segmented,
  Badge,
  Flex,
  Divider,
} from "antd";
import type { SegmentedProps } from "antd";
import {
  SearchOutlined,
  CalendarOutlined,
  BookOutlined,
  CheckCircleOutlined,
  RightOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchEnrolledClasses } from "@/services/features/enrollment/enrollmentSlice";
import StudentLayout from "@/components/StudentLayout/StudentLayout";

const { Title, Text } = Typography;

const GRADIENTS = [
  "linear-gradient(145deg, #3b82f6 0%, #6366f1 55%, #8b5cf6 100%)",
  "linear-gradient(145deg, #10b981 0%, #059669 100%)",
  "linear-gradient(145deg, #8b5cf6 0%, #7c3aed 100%)",
  "linear-gradient(145deg, #f59e0b 0%, #ea580c 100%)",
  "linear-gradient(145deg, #ec4899 0%, #db2777 100%)",
  "linear-gradient(145deg, #06b6d4 0%, #2563eb 100%)",
];
const getGradient = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
};

type FilterType = "all" | "active" | "inactive";

const StudentMyClassesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { enrolledClasses, loading, error } = useAppSelector(
    (state) => state.enrollment,
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    dispatch(fetchEnrolledClasses());
  }, [dispatch]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getInstructorNames = (cls: (typeof enrolledClasses)[0]) => {
    if (!cls.class.instructors || cls.class.instructors.length === 0)
      return "Chưa gán giảng viên";
    return cls.class.instructors
      .map((i) => `${i.firstName} ${i.lastName}`.trim())
      .join(", ");
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
      <ConfigProvider
        theme={{
          token: {
            borderRadiusLG: 20,
            borderRadius: 14,
            borderRadiusSM: 10,
            colorBgContainer: "#ffffff",
            boxShadowSecondary:
              "0 4px 14px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04)",
          },
          components: {
            Card: {
              borderRadiusLG: 26,
              paddingLG: 20,
            },
            Segmented: {
              borderRadius: 999,
              trackPadding: 4,
            },
            Input: {
              borderRadius: 14,
              paddingBlockLG: 10,
            },
            Badge: {
              textFontSize: 11,
            },
          },
        }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

          <Row gutter={[16, 8]} align="bottom">
            <Col flex="1">
              <Title
                level={2}
                className="!mb-1 !text-slate-800 !text-2xl sm:!text-3xl !font-bold">
                Lớp của tôi
              </Title>
              <Text type="secondary" className="text-sm sm:text-base">
                Quản lý các lớp học đã ghi danh
              </Text>
            </Col>
            <Col>
              <Button
                type="primary"
                size="large"
                icon={<ReadOutlined />}
                onClick={() => navigate("/student/dashboard")}
                className="!rounded-2xl !font-semibold !px-6 !h-11 !shadow-md">
                Khám phá lớp học
              </Button>
            </Col>
          </Row>

          <Card
            bordered={false}
            className="!rounded-[26px] !shadow-sm"
            styles={{ body: { padding: "18px 22px" } }}>
            <Row gutter={[16, 14]} align="middle">
              <Col xs={24} sm={12} md={9} lg={8}>
                <Input
                  size="large"
                  variant="filled"
                  prefix={
                    <SearchOutlined className="text-slate-400 text-base" />
                  }
                  placeholder="Tìm theo tên lớp, mã lớp, giảng viên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  allowClear
                  className="!rounded-2xl"
                />
              </Col>
              <Col xs={24} sm={12} md={15} lg={16}>
                <Flex justify="flex-start" wrap="wrap" className="sm:justify-end">
                  <Segmented
                    size="large"
                    value={filter}
                    onChange={(val) => setFilter(val as FilterType)}
                    options={segmentedOptions}
                    className="!rounded-full !p-1 !bg-slate-100/90 [&_.ant-segmented-item]:!rounded-full [&_.ant-segmented-item]:!px-3 [&_.ant-segmented-item]:!min-h-[40px] [&_.ant-segmented-item-selected]:!shadow-sm"
                  />
                </Flex>
              </Col>
            </Row>
          </Card>

          {loading && (
            <Row gutter={[16, 16]}>
              {[...Array(6)].map((_, i) => (
                <Col xs={24} sm={12} lg={8} key={i}>
                  <Card
                    bordered={false}
                    className="!rounded-[26px] !shadow-sm overflow-hidden"
                    styles={{ body: { padding: 0 } }}>
                    <Skeleton active paragraph={{ rows: 6 }} className="p-5" />
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {!loading && filteredClasses.length === 0 && (
            <Card
              bordered={false}
              className="!rounded-[26px] !shadow-sm"
              styles={{ body: { padding: "48px 24px", textAlign: "center" } }}>
              <Space direction="vertical" size="middle" className="w-full">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center bg-blue-50 mx-auto">
                  <ReadOutlined className="text-3xl text-blue-300" />
                </div>
                <Title level={4} className="!mb-0 !text-slate-700">
                  {searchQuery
                    ? "Không tìm thấy lớp phù hợp"
                    : "Bạn chưa ghi danh lớp nào"}
                </Title>
                <Text type="secondary" className="text-sm max-w-xs block mx-auto">
                  {searchQuery
                    ? "Thử thay đổi từ khóa tìm kiếm để xem kết quả khác."
                    : "Vào mục Khám phá lớp học để tìm và ghi danh các lớp phù hợp với bạn."}
                </Text>
                <div className="pt-1">
                  {searchQuery ? (
                    <Button
                      size="large"
                      onClick={() => setSearchQuery("")}
                      className="!rounded-2xl !px-6">
                      Xóa tìm kiếm
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      size="large"
                      icon={<ReadOutlined />}
                      onClick={() => navigate("/student/dashboard")}
                      className="!rounded-2xl !px-6 !font-semibold">
                      Khám phá lớp học
                    </Button>
                  )}
                </div>
              </Space>
            </Card>
          )}

          {!loading && filteredClasses.length > 0 && (
            <Row gutter={[20, 20]}>
              {filteredClasses.map((cls) => {
                const isActive = cls.class.status === "active";
                const gradient = getGradient(
                  cls.class.className || cls.class.classCode,
                );
                const instructorName = getInstructorNames(cls);

                return (
                  <Col xs={24} sm={12} lg={8} key={cls.enrollmentId}>
                    <Badge.Ribbon
                      text={
                        <span className="inline-flex items-center gap-1">
                          <CheckCircleOutlined />
                          Đã ghi danh
                        </span>
                      }
                      color="rgba(16, 185, 129, 0.92)"
                      className="!text-xs !font-semibold [&_.ant-ribbon-text]:!px-1">
                      <Card
                        hoverable
                        bordered={false}
                        className="!rounded-[26px] !shadow-md hover:!shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden border-0"
                        styles={{
                          body: { padding: 0, overflow: "hidden" },
                        }}
                        onClick={() =>
                          navigate(`/student/class/${cls.classId}`)
                        }>
                        <div
                          className="relative px-5 pt-6 pb-5 text-white overflow-hidden"
                          style={{ background: gradient }}>
                          <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
                          <div className="pointer-events-none absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-white/10" />
                          <Flex
                            vertical
                            gap={12}
                            className="relative">
                            <Flex justify="space-between" align="flex-start" wrap="wrap" gap={8}>
                              <Space size={8} wrap>
                                <Tag
                                  className="!m-0 !border-0 !text-xs !font-semibold !rounded-full !px-3 !py-0.5"
                                  style={{
                                    background: "rgba(255,255,255,0.22)",
                                    color: "#fff",
                                  }}>
                                  {cls.class.classCode}
                                </Tag>
                                <Badge
                                  status={isActive ? "processing" : "default"}
                                  text={
                                    <span className="text-white/90 text-xs font-medium">
                                      {isActive ? "Đang mở" : "Đã đóng"}
                                    </span>
                                  }
                                  className="[&_.ant-badge-status-dot]:!bg-emerald-300"
                                />
                              </Space>
                            </Flex>
                            <div>
                              <Title
                                level={4}
                                className="!mb-1.5 !text-white !text-lg sm:!text-xl !font-bold !leading-snug !line-clamp-2">
                                {cls.class.className}
                              </Title>
                              <Text className="!text-white/75 !text-xs sm:!text-sm block">
                                {cls.class.course?.courseCode}
                                {cls.class.course?.courseName
                                  ? ` — ${cls.class.course.courseName}`
                                  : ""}
                              </Text>
                            </div>
                          </Flex>
                        </div>

                        <div className="px-5 pb-5 pt-4 bg-gradient-to-b from-slate-50/80 to-white">
                          <Space
                            direction="vertical"
                            size={14}
                            className="w-full">
                            {instructorName && (
                              <Flex align="center" gap={12}>
                                <Avatar
                                  size={36}
                                  className="!bg-blue-100 !text-blue-600 !text-xs !font-bold shrink-0 !border-2 !border-white !shadow-sm">
                                  {instructorName
                                    .split(" ")
                                    .slice(0, 2)
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <Text
                                    type="secondary"
                                    className="!text-[11px] !block !uppercase !tracking-wide">
                                    Giảng viên
                                  </Text>
                                  <Text
                                    className="!text-sm !font-semibold !text-slate-800 !truncate !block">
                                    {instructorName}
                                  </Text>
                                </div>
                              </Flex>
                            )}

                            {cls.class.startDate && cls.class.endDate && (
                              <Flex align="flex-start" gap={12}>
                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 shadow-inner">
                                  <CalendarOutlined />
                                </div>
                                <div className="min-w-0">
                                  <Text
                                    type="secondary"
                                    className="!text-[11px] !block !uppercase !tracking-wide">
                                    Thời gian
                                  </Text>
                                  <Text className="!text-sm !font-semibold !text-slate-700">
                                    {formatDate(cls.class.startDate)} –{" "}
                                    {formatDate(cls.class.endDate)}
                                  </Text>
                                </div>
                              </Flex>
                            )}

                            {cls.class.course?.semester && (
                              <Flex align="flex-start" gap={12}>
                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 shadow-inner">
                                  <BookOutlined />
                                </div>
                                <div className="min-w-0">
                                  <Text
                                    type="secondary"
                                    className="!text-[11px] !block !uppercase !tracking-wide">
                                    Học kỳ
                                  </Text>
                                  <Text className="!text-sm !font-semibold !text-slate-700">
                                    {cls.class.course.semester}
                                    {cls.class.course.academicYear
                                      ? ` • ${cls.class.course.academicYear}`
                                      : ""}
                                  </Text>
                                </div>
                              </Flex>
                            )}

                            <Flex align="flex-start" gap={12}>
                              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner">
                                <CheckCircleOutlined />
                              </div>
                              <div>
                                <Text
                                  type="secondary"
                                  className="!text-[11px] !block !uppercase !tracking-wide">
                                  Ngày ghi danh
                                </Text>
                                <Text className="!text-sm !font-semibold !text-emerald-600">
                                  {new Date(cls.enrolledAt).toLocaleDateString(
                                    "vi-VN",
                                  )}
                                </Text>
                              </div>
                            </Flex>
                          </Space>

                          <Divider className="!my-4 !border-slate-100" />

                          <Flex justify="space-between" align="center">
                            <Text type="secondary" className="!text-xs">
                              #{cls.classId}
                            </Text>
                            <Button
                              type="link"
                              size="small"
                              className="!p-0 !h-auto !font-semibold !text-blue-600 group-hover:!gap-2 flex items-center gap-1"
                              icon={<RightOutlined className="!text-xs" />}
                              iconPosition="end"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/student/class/${cls.classId}`);
                              }}>
                              Vào lớp
                            </Button>
                          </Flex>
                        </div>
                      </Card>
                    </Badge.Ribbon>
                  </Col>
                );
              })}
            </Row>
          )}
        </div>
      </ConfigProvider>
    </StudentLayout>
  );
};

export default StudentMyClassesPage;
