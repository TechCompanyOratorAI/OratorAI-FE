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
        <SidebarInstructor activeItem="manage-courses" />
        <main className="flex-1 flex items-center justify-center">
          <Spin size="large" />
        </main>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarInstructor activeItem="manage-courses" />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1280px] mx-auto px-4 py-8">
            <Button icon={<ArrowLeft size={14} />} onClick={() => navigate(-1)}>
              Back
            </Button>
            <Card className="mt-4">
              <Text type="danger">{error || "Course not found"}</Text>
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
      antdMessage.success("Topic created successfully!");
      setTopicModalOpen(false);
      dispatch(fetchCourseDetail(parseInt(courseId)));
    } catch (err: any) {
      antdMessage.error(err || "Failed to create topic.");
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
      antdMessage.success("Topic deleted successfully!");
      if (courseId) {
        dispatch(fetchCourseDetail(parseInt(courseId)));
      }
    } catch (err: any) {
      antdMessage.error(err || "Failed to delete topic.");
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
      antdMessage.success("Topic updated successfully!");
      setEditModalOpen(false);
      setEditingTopic(null);
      if (courseId) dispatch(fetchCourseDetail(parseInt(courseId)));
    } catch (err: any) {
      antdMessage.error(err || "Failed to update topic.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarInstructor activeItem="manage-courses" />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-[1280px] mx-auto space-y-6">
          {/* Back */}
          <Button icon={<ArrowLeft size={14} />} onClick={() => navigate("/instructor/manage-courses")}>
            Back to courses
          </Button>

          {/* Hero Card */}
          <Card
            className="bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-500 text-white border-0"
            styles={{ body: { color: "white" } }}
          >
            <Space direction="vertical" className="w-full" size={4}>
              <Space wrap>
                <Tag color={course.isActive ? "green" : "default"} style={{ background: "rgba(255,255,255,0.2)", borderColor: "rgba(255,255,255,0.3)", color: "white" }}>
                  {course.isActive ? "Active" : "Archived"}
                </Tag>
                <Tag style={{ background: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.2)", color: "white" }}>
                  Semester {course.semester}
                </Tag>
                <Tag style={{ background: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.2)", color: "white" }}>
                  Academic year {course.academicYear}
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
                Course Code: {course.courseCode}
              </Text>
            </Space>
            <Divider style={{ borderColor: "rgba(255,255,255,0.2)", margin: "16px 0" }} />
            <Row gutter={16}>
              <Col span={6}>
                <Space direction="vertical" size={0}>
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Duration</Text>
                  <Text strong style={{ color: "white" }}>{courseDuration} days</Text>
                </Space>
              </Col>
              <Col span={6}>
                <Space direction="vertical" size={0}>
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Modules</Text>
                  <Text strong style={{ color: "white" }}>{course.topics?.length || 0} modules</Text>
                </Space>
              </Col>
              <Col span={6}>
                <Space direction="vertical" size={0}>
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Start date</Text>
                  <Text strong style={{ color: "white" }}>{formatDate(course.startDate)}</Text>
                </Space>
              </Col>
              <Col span={6}>
                <Space direction="vertical" size={0}>
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>End date</Text>
                  <Text strong style={{ color: "white" }}>{formatDate(course.endDate)}</Text>
                </Space>
              </Col>
            </Row>
          </Card>

          <Row gutter={16}>
            <Col span={16}>
              {/* Timeline */}
              <Card title="Teaching Timeline" extra={<Tag color="green">Ready to deliver</Tag>}>
                <Space direction="vertical" className="w-full" size={4}>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50">
                    <div>
                      <Text type="secondary">Start date</Text>
                      <div><Text strong>{formatDate(course.startDate)}</Text></div>
                    </div>
                    <Space>
                      <Calendar className="text-emerald-600" size={16} />
                      <Text type="secondary">{courseDuration} days</Text>
                    </Space>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
                    <div>
                      <Text type="secondary">End date</Text>
                      <div><Text strong>{formatDate(course.endDate)}</Text></div>
                    </div>
                    <Space>
                      <Clock className="text-amber-600" size={16} />
                      <Text type="secondary">{courseDuration} days</Text>
                    </Space>
                  </div>
                </Space>
              </Card>

              {/* Topic List */}
              <Card
                title={
                  <Space>
                    <BookOpen size={16} />
                    <span>Topic List ({course.topics?.length || 0})</span>
                  </Space>
                }
                extra={
                  <ButtonYoodli
                    text="Create Topic"
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
                              <Tag>{topic.maxDurationMinutes} mins</Tag>
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
                                Edit
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
                                Delete
                              </Button>
                            </Space>
                          </Space>
                        </div>
                      </Card>
                    ))}
                  </Space>
                ) : (
                  <Empty description="No topics yet. Add modules with objectives and deadlines." />
                )}
              </Card>
            </Col>

            <Col span={8}>
              {/* Instructor */}
              <Card title="Instructor of Record">
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
                        <Text type="secondary">Instructor ID</Text>
                        <Text strong>{course.instructor.userId}</Text>
                      </div>
                      <div className="flex justify-between text-sm">
                        <Text type="secondary">Email</Text>
                        <Text style={{ wordBreak: "break-all" }}>{course.instructor.email}</Text>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                      Respond to questions within 24 hours and refresh materials after each session.
                    </div>
                  </Space>
                ) : (
                  <Empty description="Instructor information not available" />
                )}
              </Card>

              {/* Info */}
              <Card title="Academic Info">
                <Space direction="vertical" className="w-full" size={4}>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    Course is {course.isActive ? "active and visible to students" : "currently archived"}.
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-sky-500" />
                    Last updated: {formatDate(course.updatedAt)}.
                  </div>
                </Space>
                <Divider />
                <Button block onClick={() => navigate("/instructor/manage-courses")}>
                  Return to list
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
        title="Edit Topic"
        submitText="Save Changes"
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