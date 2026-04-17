import React, { useEffect } from "react";
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
  Empty,
} from "antd";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchTopicDetail } from "@/services/features/topic/topicSlice";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";

const { Text, Title } = Typography;

const statusConfig: Record<
  string,
  { color: string; text: string }
> = {
  draft: { color: "default", text: "Bản nháp" },
  submitted: { color: "blue", text: "Đã nộp" },
  graded: { color: "green", text: "Đã chấm" },
};

const TopicDetailPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    selectedTopic: topic,
    loading,
    error,
  } = useAppSelector((state) => state.topic);

  useEffect(() => {
    if (topicId) {
      dispatch(fetchTopicDetail(parseInt(topicId)));
    }
  }, [topicId, dispatch]);

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

  if (error || !topic) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarInstructor activeItem="manage-courses" />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1280px] mx-auto px-4 py-8">
            <Button icon={<ArrowLeft size={14} />} onClick={() => navigate(-1)} className="mb-4">
              Quay lại
            </Button>
            <Card>
              <Text type="danger">{error || "Không tìm thấy chủ đề"}</Text>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarInstructor activeItem="manage-courses" />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-[1280px] mx-auto space-y-6">
          {/* Back */}
          <Button
            icon={<ArrowLeft size={14} />}
            onClick={() => navigate(`/instructor/course/${topic.courseId}`)}
          >
            Quay lại khóa học
          </Button>

          {/* Hero Card */}
          <Card
            className="bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-500 text-white border-0"
            styles={{ body: { color: "white" } }}
          >
            <Space direction="vertical" className="w-full" size={4}>
              <Space>
                <div className="w-12 h-12 rounded-full bg-white/20 text-white font-bold flex items-center justify-center text-lg">
                  {topic.sequenceNumber}
                </div>
                <Tag style={{ background: "rgba(255,255,255,0.2)", borderColor: "rgba(255,255,255,0.3)", color: "white" }}>
                  Chủ đề #{topic.sequenceNumber}
                </Tag>
              </Space>
              <Title level={3} style={{ color: "white", margin: 0 }}>
                {topic.topicName}
              </Title>
              {topic.description && (
                <Text style={{ color: "rgba(255,255,255,0.9)" }}>
                  {topic.description}
                </Text>
              )}
              <Space>
                {topic.dueDate && (
                  <Tag style={{ background: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.2)", color: "white" }}>
                    <Calendar size={12} /> Hạn nộp: {formatDate(topic.dueDate)}
                  </Tag>
                )}
                {topic.maxDurationMinutes && (
                  <Tag style={{ background: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.2)", color: "white" }}>
                    <Clock size={12} /> {topic.maxDurationMinutes} phút
                  </Tag>
                )}
              </Space>
            </Space>
            <Row gutter={16} className="mt-4">
              <Col span={6}>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Hạn nộp</Text>
                <div><Text strong style={{ color: "white" }}>{topic.dueDate ? formatDate(topic.dueDate) : "Không có hạn"}</Text></div>
              </Col>
              <Col span={6}>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Thời lượng</Text>
                <div><Text strong style={{ color: "white" }}>{topic.maxDurationMinutes || 0} phút</Text></div>
              </Col>
              <Col span={6}>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Bài trình bày</Text>
                <div><Text strong style={{ color: "white" }}>{topic.presentations.length} đã nộp</Text></div>
              </Col>
              <Col span={6}>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Khóa học</Text>
                <div><Text strong style={{ color: "white" }}>{topic.course.courseName}</Text></div>
              </Col>
            </Row>
          </Card>

          {/* Course Info */}
          <Card title="Thông tin khóa học">
            <Space direction="vertical" className="w-full" size={4}>
              <div>
                <Text strong className="text-lg">{topic.course.courseName}</Text>
                <div className="text-sm text-gray-500">
                  Giảng viên: {topic.course.instructor.firstName} {topic.course.instructor.lastName}
                </div>
              </div>
              <Button type="link" onClick={() => navigate(`/instructor/course/${topic.courseId}`)}>
                Xem chi tiết khóa học →
              </Button>
            </Space>
          </Card>

          {/* Requirements */}
          {topic.requirements && (
            <Card
              title={
                <Space>
                  <FileText size={16} />
                  <span>Yêu cầu chủ đề</span>
                </Space>
              }
            >
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-xl border border-gray-200">
                {topic.requirements}
              </pre>
            </Card>
          )}

          {/* Presentations */}
          <Card
            title={
              <Space>
                <FileText size={16} />
                <span>Bài trình bày ({topic.presentations.length})</span>
              </Space>
            }
          >
            {topic.presentations.length > 0 ? (
              <Space direction="vertical" className="w-full" size={4}>
                {topic.presentations.map((presentation) => {
                  const status = statusConfig[presentation.status.toLowerCase()] || statusConfig.draft;
                  return (
                    <Card key={presentation.presentationId} size="small" hoverable>
                      <div className="flex items-center justify-between">
                        <Space direction="vertical" size={2}>
                          <Space>
                            <Text strong>{presentation.title}</Text>
                            <Tag color={status.color}>{status.text}</Tag>
                          </Space>
                          <Text type="secondary" className="text-sm">
                            Mã sinh viên: {presentation.studentId}
                            {presentation.submissionDate && ` · Đã nộp: ${new Date(presentation.submissionDate).toLocaleDateString()}`}
                          </Text>
                        </Space>
                      </div>
                    </Card>
                  );
                })}
              </Space>
            ) : (
              <Empty description="Chưa có bài trình bày nào được nộp." />
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TopicDetailPage;