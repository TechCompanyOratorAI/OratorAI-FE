import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Tag,
  Space,
  Typography,
  Spin,
  Row,
  Col,
  Divider,
  App,
  Empty,
} from "antd";
import {
  ArrowLeft,
  Calendar,
  BookOpen,
  Clock,
  Plus,
} from "lucide-react";
import ButtonYoodli from "@/components/yoodli/Button";
import TopicModal from "@/components/Topic/TopicModal";
import TopicUpdateModal from "@/components/Topic/TopicUpdateModal";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchCourseDetail } from "@/services/features/course/courseSlice";
import { fetchClassesByCourse } from "@/services/features/admin/classSlice";
import {
  createTopic,
  CreateTopicData,
  updateTopic,
  deleteTopic,
} from "@/services/features/topic/topicSlice";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";

const { Text, Title } = Typography;

const isClassExpired = (endDate: string): boolean => {
  const now = new Date();
  const beijingOffset = 8 * 60;
  const localOffset = now.getTimezoneOffset();
  const diffMinutes = localOffset + beijingOffset;
  const beijingNow = new Date(now.getTime() + diffMinutes * 60 * 1000);
  return new Date(endDate) < beijingNow;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    selectedCourse: course,
    loading,
    error,
  } = useAppSelector((state) => state.course);
  const { loading: topicLoading } = useAppSelector((state) => state.topic);
  const { classes: classesForCourse } = useAppSelector((state) => state.class);
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<{
    topicId: number;
    topicName: string;
    sequenceNumber: number;
    description?: string;
    dueDate?: string;
    maxDurationMinutes?: number;
    requirements?: string;
  } | null>(null);

  const { message: antdMessage } = App.useApp();

  useEffect(() => {
    if (courseId) {
      const id = parseInt(courseId, 10);
      dispatch(fetchCourseDetail(id));
      dispatch(fetchClassesByCourse(id));
    }
  }, [courseId, dispatch]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarInstructor activeItem="manage-classes" />
        <main className="flex-1 flex items-center justify-center">
          <Spin size="large" />
        </main>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarInstructor activeItem="manage-classes" />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1280px] mx-auto px-4 py-8">
            <Button icon={<ArrowLeft size={14} />} onClick={() => navigate(-1)}>
              Quay lại
            </Button>
            <Card className="mt-4">
              <Text type="danger">{error || "Không tìm thấy khóa học"}</Text>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const courseDuration = Math.ceil(
    (new Date(course.endDate).getTime() -
      new Date(course.startDate).getTime()) /
    (1000 * 60 * 60 * 24)
  );

  const handleTopicSubmit = async (
    topicData: CreateTopicData,
    meta?: { classId: number },
  ) => {
    if (!courseId || !meta?.classId) {
      antdMessage.error("Chọn lớp học để tạo chủ đề.");
      return;
    }
    try {
      await dispatch(
        createTopic({ classId: meta.classId, topicData }),
      ).unwrap();
      antdMessage.success("Tạo chủ đề thành công!");
      setTopicModalOpen(false);
      dispatch(fetchCourseDetail(parseInt(courseId)));
    } catch (err: any) {
      antdMessage.error(err || "Không thể tạo chủ đề.");
    }
  };

  const handleEditTopic = (topicId: number) => {
    const topic = course.topics?.find((t) => t.topicId === topicId);
    if (!topic) return;
    setEditingTopic(topic);
    setEditModalOpen(true);
  };

  const handleDeleteTopic = async (topicId: number) => {
    try {
      await dispatch(deleteTopic(topicId)).unwrap();
      antdMessage.success("Xóa chủ đề thành công!");
      if (courseId) {
        dispatch(fetchCourseDetail(parseInt(courseId)));
      }
    } catch (err: any) {
      antdMessage.error(err || "Không thể xóa chủ đề.");
    }
  };

  const handleUpdateTopicSubmit = async (data: Partial<CreateTopicData>) => {
    if (!editingTopic) return;
    try {
      const payload = {
        topicName: data.topicName,
        maxDurationMinutes: data.maxDurationMinutes,
        dueDate: data.dueDate,
      };
      await dispatch(
        updateTopic({ topicId: editingTopic.topicId, topicData: payload }),
      ).unwrap();
      antdMessage.success("Cập nhật chủ đề thành công!");
      setEditModalOpen(false);
      setEditingTopic(null);
      if (courseId) dispatch(fetchCourseDetail(parseInt(courseId)));
    } catch (err: any) {
      antdMessage.error(err || "Không thể cập nhật chủ đề.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarInstructor activeItem="manage-classes" />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-[1280px] mx-auto space-y-6">
          {/* Back */}
          <Button icon={<ArrowLeft size={14} />} onClick={() => navigate("/instructor/manage-courses")}>
            Quay lại danh sách khóa học
          </Button>

          {/* Hero Card */}
          <Card
            className="bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-500 text-white border-0"
            styles={{ body: { color: "white" } }}
          >
            <Space direction="vertical" className="w-full" size={4}>
              <Space wrap>
                <Tag color={course.isActive ? "green" : "default"} style={{ background: "rgba(255,255,255,0.2)", borderColor: "rgba(255,255,255,0.3)", color: "white" }}>
                  {course.isActive ? "Đang mở" : "Đã lưu trữ"}
                </Tag>
                <Tag style={{ background: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.2)", color: "white" }}>
                  Học kỳ {course.semester}
                </Tag>
                <Tag style={{ background: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.2)", color: "white" }}>
                  Năm học {course.academicYear}
                </Tag>
              </Space>
              <Title level={3} style={{ color: "white", margin: 0 }}>
                {course.courseName}
              </Title>
              {course.description && (
                <Text style={{ color: "rgba(255,255,255,0.9)" }}>
                  {course.description}
                </Text>
              )}
              <Text strong style={{ color: "rgba(255,255,255,0.8)" }}>
                Mã khóa học: {course.courseCode}
              </Text>
            </Space>
            <Divider style={{ borderColor: "rgba(255,255,255,0.2)", margin: "16px 0" }} />
            <Row gutter={16}>
              <Col span={6}>
                <Space direction="vertical" size={0}>
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Thời lượng</Text>
                  <Text strong style={{ color: "white" }}>{courseDuration} ngày</Text>
                </Space>
              </Col>
              <Col span={6}>
                <Space direction="vertical" size={0}>
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Chủ đề</Text>
                  <Text strong style={{ color: "white" }}>{course.topics?.length || 0} chủ đề</Text>
                </Space>
              </Col>
              <Col span={6}>
                <Space direction="vertical" size={0}>
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Ngày bắt đầu</Text>
                  <Text strong style={{ color: "white" }}>{formatDate(course.startDate)}</Text>
                </Space>
              </Col>
              <Col span={6}>
                <Space direction="vertical" size={0}>
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Ngày kết thúc</Text>
                  <Text strong style={{ color: "white" }}>{formatDate(course.endDate)}</Text>
                </Space>
              </Col>
            </Row>
          </Card>

          <Row gutter={16}>
            <Col span={16}>
              {/* Timeline */}
              <Card title="Tiến độ giảng dạy" extra={<Tag color="green">Sẵn sàng triển khai</Tag>}>
                <Space direction="vertical" className="w-full" size={4}>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50">
                    <div>
                      <Text type="secondary">Ngày bắt đầu</Text>
                      <div><Text strong>{formatDate(course.startDate)}</Text></div>
                    </div>
                    <Space>
                      <Calendar className="text-emerald-600" size={16} />
                      <Text type="secondary">{courseDuration} ngày</Text>
                    </Space>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
                    <div>
                      <Text type="secondary">Ngày kết thúc</Text>
                      <div><Text strong>{formatDate(course.endDate)}</Text></div>
                    </div>
                    <Space>
                      <Clock className="text-amber-600" size={16} />
                      <Text type="secondary">{courseDuration} ngày</Text>
                    </Space>
                  </div>
                </Space>
              </Card>

              {/* Topic List */}
              <Card
                title={
                  <Space>
                    <BookOpen size={16} />
                    <span>Danh sách chủ đề ({course.topics?.length || 0})</span>
                  </Space>
                }
                extra={
                  <ButtonYoodli
                    text="Tạo chủ đề"
                    variant="primary"
                    fontSize="14px"
                    borderRadius="8px"
                    paddingWidth="16px"
                    paddingHeight="8px"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => {
                      if (!classesForCourse?.length) {
                        antdMessage.error("Tạo ít nhất một lớp học cho khóa này trước khi thêm chủ đề.");
                        return;
                      }
                      setTopicModalOpen(true);
                    }}
                  />
                }
              >
                {course.topics && course.topics.length > 0 ? (
                  <Space direction="vertical" className="w-full" size={4}>
                    {course.topics.map((topic) => (
                      <Card
                        key={topic.topicId}
                        size="small"
                        hoverable
                        className="cursor-pointer"
                        onClick={() => navigate(`/instructor/topic/${topic.topicId}`)}
                      >
                        <div className="flex items-center justify-between">
                          <Space>
                            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center">
                              {topic.sequenceNumber}
                            </div>
                            <div>
                              <Text strong>{topic.topicName}</Text>
                              {topic.description && (
                                <div className="text-xs text-gray-500">{topic.description}</div>
                              )}
                            </div>
                          </Space>
                          <Space>
                            {topic.dueDate && (
                              <Tag icon={<Calendar size={12} />}>{formatDate(topic.dueDate)}</Tag>
                            )}
                            {topic.maxDurationMinutes && (
                              <Tag>{topic.maxDurationMinutes} phút</Tag>
                            )}
                            <Space size={0}>
                              <Button
                                type="text"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTopic(topic.topicId);
                                }}
                              >
                                Sửa
                              </Button>
                              <Button
                                type="text"
                                size="small"
                                danger
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTopic(topic.topicId);
                                }}
                              >
                                Xóa
                              </Button>
                            </Space>
                          </Space>
                        </div>
                      </Card>
                    ))}
                  </Space>
                ) : (
                  <Empty description="Chưa có chủ đề. Hãy thêm nội dung với mục tiêu và hạn nộp." />
                )}
              </Card>
            </Col>

            <Col span={8}>
              {/* Instructor */}
              <Card title="Giảng viên phụ trách">
                {course.instructor ? (
                  <Space direction="vertical" className="w-full" size={4}>
                    <div className="flex justify-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 flex items-center justify-center text-white text-xl font-bold">
                        {course.instructor.firstName?.charAt(0)}
                        {course.instructor.lastName?.charAt(0)}
                      </div>
                    </div>
                    <div className="text-center">
                      <Text strong className="text-lg">
                        {course.instructor.firstName} {course.instructor.lastName}
                      </Text>
                      <div className="text-sm text-gray-500">
                        @{course.instructor.username}
                      </div>
                    </div>
                    <div className="pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <Text type="secondary">Mã giảng viên</Text>
                        <Text strong>{course.instructor.userId}</Text>
                      </div>
                      <div className="flex justify-between text-sm">
                        <Text type="secondary">Email</Text>
                        <Text style={{ wordBreak: "break-all" }}>{course.instructor.email}</Text>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                      Phản hồi câu hỏi trong vòng 24 giờ và cập nhật tài liệu sau mỗi buổi học.
                    </div>
                  </Space>
                ) : (
                  <Empty description="Chưa có thông tin giảng viên" />
                )}
              </Card>

              {/* Info */}
              <Card title="Thông tin học vụ">
                <Space direction="vertical" className="w-full" size={4}>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    Khóa học hiện {course.isActive ? "đang mở và hiển thị cho sinh viên" : "đang được lưu trữ"}.
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-sky-500" />
                    Cập nhật gần nhất: {formatDate(course.updatedAt)}.
                  </div>
                </Space>
                <Divider />
                <Button block onClick={() => navigate("/instructor/manage-courses")}>
                  Quay lại danh sách
                </Button>
              </Card>
            </Col>
          </Row>
        </div>
      </main>

      <TopicModal
        isOpen={topicModalOpen}
        onClose={() => setTopicModalOpen(false)}
        onSubmit={handleTopicSubmit}
        isLoading={topicLoading}
        classOptions={classesForCourse
          .filter((c) => !c.endDate || !isClassExpired(c.endDate))
          .map((c) => ({
            classId: c.classId,
            className: c.className,
            classCode: c.classCode,
            endDate: c.endDate,
          }))}
      />

      <TopicUpdateModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingTopic(null);
        }}
        onSubmit={handleUpdateTopicSubmit}
        isLoading={topicLoading}
        title="Sửa chủ đề"
        submitText="Lưu thay đổi"
        initialData={{
          topicName: editingTopic?.topicName,
          dueDate: editingTopic?.dueDate,
          maxDurationMinutes: editingTopic?.maxDurationMinutes || 20,
        }}
      />
    </div>
  );
};

export default CourseDetailPage;