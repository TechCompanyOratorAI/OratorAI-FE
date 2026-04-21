import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  Card,
  Button,
  Typography,
  Tag,
  Space,
  Alert,
  Skeleton,
  Collapse,
  Empty,
} from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  UploadOutlined,
  LoadingOutlined,
  CrownOutlined,
  ReloadOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchTopicDetail } from "@/services/features/topic/topicSlice";
import {
  fetchPresentationsByClassAndTopic,
  createPresentation,
} from "@/services/features/presentation/presentationSlice";
import {
  fetchMyGroupByClass,
  fetchGroupTopic,
  pickGroupTopic,
  clearGroupTopic,
} from "@/services/features/group/groupSlice";
import PresentationUploadModal from "@/components/Presentation/PresentationUploadModal";
import CreatePresentationModal from "@/components/Presentation/CreatePresentationModal";
import StudentLayout from "@/components/StudentLayout/StudentLayout";
import { fetchUploadPermissionByClass } from "@/services/features/uploadPermission/uploadPermissionSlice";
import { useClassUploadPermission } from "@/hooks/useSocket";

const { Title, Text, Paragraph } = Typography;

interface TopicStudentDetailPageProps {
  isModalMode?: boolean;
  onCloseModal?: () => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Nháp", color: "default" },
  submitted: { label: "Đã nộp", color: "processing" },
  processing: { label: "Đang xử lý", color: "processing" },
  analyzed: { label: "Đã chấm", color: "success" },
  done: { label: "Hoàn thành", color: "success" },
  failed: { label: "Thất bại", color: "error" },
};

const StudentTopicDetailPage: React.FC<TopicStudentDetailPageProps> = ({
  isModalMode = false,
  onCloseModal,
}) => {
  const { topicId, classId } = useParams<{
    topicId: string;
    classId: string;
  }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    selectedTopic: topic,
    loading: topicLoading,
    error: topicError,
  } = useAppSelector((state) => state.topic);
  const { presentations } = useAppSelector((state) => state.presentation);
  const { user } = useAppSelector((state) => state.auth);
  void user;
  const {
    myGroupForClass,
    groupTopic,
    actionLoading: groupActionLoading,
  } = useAppSelector((state) => state.group);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploadResubmit, setIsUploadResubmit] = useState(false);
  const [selectedPresentationId, setSelectedPresentationId] = useState<
    number | null
  >(null);
  const [selectedPresentationTitle, setSelectedPresentationTitle] =
    useState("");

  const topicIdNumber = topicId ? parseInt(topicId) : null;
  const classIdNumber = classId ? parseInt(classId) : null;
  const myGroupId =
    myGroupForClass?.groupId != null ? Number(myGroupForClass.groupId) : null;
  const isGroupTopicThis =
    topicIdNumber != null && groupTopic?.topicId === topicIdNumber;
  const isEnrolled = Boolean(myGroupForClass && isGroupTopicThis);
  const myPresentation = presentations.find(
    (p) => p.studentId === user?.userId,
  );
  const isCurrentUserLeader = myGroupForClass?.myRole === "leader";

  useEffect(() => {
    if (topicIdNumber && classIdNumber) {
      dispatch(fetchTopicDetail(topicIdNumber));
      dispatch(
        fetchPresentationsByClassAndTopic({
          classId: classIdNumber,
          topicId: topicIdNumber,
        }),
      );
    }
    if (classIdNumber) {
      dispatch(fetchMyGroupByClass(classIdNumber));
      dispatch(fetchUploadPermissionByClass(classIdNumber));
    }
  }, [topicIdNumber, classIdNumber, dispatch]);

  const uploadPermission = useAppSelector(
    (state) => state.uploadPermission.permissions[classIdNumber ?? -1],
  );
  const isUploadEnabled = uploadPermission?.isUploadEnabled ?? false;
  const canUpload = isUploadEnabled;

  useClassUploadPermission(classIdNumber ?? 0);

  useEffect(() => {
    if (myGroupId != null && Number.isFinite(myGroupId)) {
      dispatch(fetchGroupTopic(myGroupId));
    }
  }, [myGroupId, dispatch]);

  const handlePickTopicForGroup = async () => {
    if (!topicIdNumber || !myGroupId) return;
    try {
      await dispatch(
        pickGroupTopic({ groupId: myGroupId, topicId: topicIdNumber }),
      ).unwrap();
      toast.success("Đã chọn chủ đề cho nhóm.");
      await dispatch(fetchGroupTopic(myGroupId));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Chọn chủ đề thất bại");
    }
  };

  const handleClearGroupTopic = async () => {
    if (!myGroupId) return;
    try {
      await dispatch(clearGroupTopic(myGroupId)).unwrap();
      toast.success("Đã hủy chọn chủ đề cho nhóm.");
      await dispatch(fetchGroupTopic(myGroupId));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Hủy chủ đề thất bại");
    }
  };

  const handleOpenUploadModal = (presentationId: number, title: string) => {
    setSelectedPresentationId(presentationId);
    setSelectedPresentationTitle(title);
    setIsUploadResubmit(false);
    setIsUploadModalOpen(true);
  };

  const handleRetry = (presentationId: number, title: string) => {
    setSelectedPresentationId(presentationId);
    setSelectedPresentationTitle(title);
    setIsUploadResubmit(true);
    setIsUploadModalOpen(true);
  };

  const goBack = () =>
    isModalMode && onCloseModal ? onCloseModal() : navigate(-1);

  if (topicLoading) {
    return (
      <StudentLayout>
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <Skeleton active paragraph={{ rows: 3 }} />
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      </StudentLayout>
    );
  }

  if (topicError || !topic) {
    return (
      <StudentLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Button
            icon={<ArrowLeftOutlined />}
            type="link"
            className="mb-6 pl-0"
            onClick={goBack}
          >
            Quay lại
          </Button>
          <Alert
            type="error"
            message="Không thể tải thông tin chủ đề"
            description={topicError || "Không tìm thấy chủ đề"}
            showIcon
          />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Button
            icon={<ArrowLeftOutlined />}
            type="link"
            className="pl-0 font-medium"
            onClick={goBack}
          >
            Quay lại
          </Button>
          <Text type="secondary">/</Text>
          <Text type="secondary" className="truncate">
            {topic.topicName}
          </Text>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6 sm:p-7"
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
            <div className="space-y-3">
              <Space wrap>
                <Tag className="!bg-slate-100 !border-slate-200 !text-slate-700 !font-semibold">
                  Chủ đề #{topic.sequenceNumber}
                </Tag>
                {isEnrolled && (
                  <Tag
                    icon={<CheckCircleOutlined />}
                    className="!bg-emerald-50 !border-emerald-200 !text-emerald-700 !font-semibold"
                  >
                    Đã ghi danh (nhóm)
                  </Tag>
                )}
              </Space>

              <Title level={2} className="!text-slate-900 !mb-0 !leading-tight">
                {topic.topicName}
              </Title>
              {topic.description && (
                <Paragraph className="!text-slate-600 !mb-0 max-w-2xl">
                  {topic.description}
                </Paragraph>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {topic.dueDate && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <CalendarOutlined />
                    Hạn nộp
                  </div>
                  <div className="text-sm font-semibold text-slate-900 mt-1">
                    {new Date(topic.dueDate).toLocaleDateString("vi-VN")}
                  </div>
                </div>
              )}
              {topic.maxDurationMinutes && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <ClockCircleOutlined />
                    Thời lượng
                  </div>
                  <div className="text-sm font-semibold text-slate-900 mt-1">
                    {topic.maxDurationMinutes} phút
                  </div>
                </div>
              )}
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <FileTextOutlined />
                  Bài nộp
                </div>
                <div className="text-sm font-semibold text-slate-900 mt-1">
                  {presentations.length}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main grid */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2.15fr)_minmax(0,1fr)]">
          {/* Left column */}
          <div className="space-y-5">
            {/* Requirements */}
            {topic.requirements && (
              <Collapse
                defaultActiveKey={["req"]}
                className="!rounded-2xl !border-slate-200 !shadow-sm !bg-white"
                expandIconPosition="end"
                items={[
                  {
                    key: "req",
                    label: (
                      <Space>
                        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                          <FileTextOutlined className="text-amber-600" />
                        </div>
                        <Text strong>Yêu cầu chủ đề</Text>
                      </Space>
                    ),
                    children: (
                      <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed m-0">
                        {topic.requirements}
                      </pre>
                    ),
                  },
                ]}
              />
            )}

            {/* Presentations list */}
            <Card className="!rounded-3xl !border-slate-200 !shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                  <FileTextOutlined className="text-slate-600" />
                </div>
                <div>
                  <Text strong className="block text-base">
                    Bài thuyết trình
                  </Text>
                  <Text type="secondary" className="text-xs">
                    {presentations.length} bài đã nộp
                  </Text>
                </div>
              </div>

              {presentations.length > 0 ? (
                <div className="space-y-3">
                  {presentations.map((presentation) => {
                    const sc =
                      statusConfig[presentation.status?.toLowerCase()] ||
                      statusConfig.draft;
                    const isFailed = presentation.status === "failed";
                    return (
                      <div
                        key={presentation.presentationId}
                        className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm bg-slate-50/50 hover:bg-white transition-all duration-200"
                      >
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <FileTextOutlined className="text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Text
                              strong
                              className="text-sm truncate max-w-[200px]"
                            >
                              {presentation.title}
                            </Text>
                            <Tag
                              color={sc.color}
                              className="!rounded-full !text-xs !font-medium"
                            >
                              {sc.label}
                            </Tag>
                          </div>
                          <Space size={12} className="text-xs text-slate-500">
                            {presentation.submissionDate && (
                              <span className="flex items-center gap-1">
                                <CalendarOutlined />
                                {new Date(
                                  presentation.submissionDate,
                                ).toLocaleDateString("vi-VN")}
                              </span>
                            )}
                            {presentation.groupCode && (
                              <span className="flex items-center gap-1">
                                <TeamOutlined />
                                {presentation.groupCode}
                              </span>
                            )}
                          </Space>
                        </div>
                        <Space className="shrink-0">
                          <Link
                            to={`/student/presentation/${presentation.presentationId}`}
                          >
                            <Button type="primary" size="small">
                              Xem
                            </Button>
                          </Link>
                          {isFailed && (
                            <Button
                              type="primary"
                              danger
                              size="small"
                              icon={<ReloadOutlined />}
                              onClick={() =>
                                handleRetry(
                                  presentation.presentationId,
                                  presentation.title,
                                )
                              }
                            >
                              Gửi lại
                            </Button>
                          )}
                        </Space>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Chưa có bài thuyết trình nào."
                />
              )}
            </Card>
          </div>

          {/* Right column: Action zone */}
          <div>
            <Card className="!rounded-3xl !border-slate-200 !shadow-sm sticky top-24">
              <div className="mb-3">
                <Text strong className="text-sm text-slate-900">
                  Trung tâm thao tác
                </Text>
                <p className="text-xs text-slate-500 m-0 mt-1">
                  Hành động theo vai trò và trạng thái hiện tại của bạn.
                </p>
              </div>
              <AnimatePresence mode="wait">
                {!isEnrolled ? (
                  <motion.div
                    key="not-enrolled"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-4 space-y-4"
                  >
                    {myGroupForClass && !isCurrentUserLeader ? (
                      <>
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
                          <TeamOutlined className="text-2xl text-slate-500" />
                        </div>
                        <Title level={5} className="!mb-1">
                          Chờ nhóm trưởng
                        </Title>
                        <Text type="secondary" className="text-sm block">
                          Chỉ nhóm trưởng mới chọn chủ đề cho cả nhóm. Bạn sẽ
                          được ghi danh khi nhóm trưởng đã chọn.
                        </Text>
                        <div className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-600 rounded-xl border border-slate-200 text-sm font-medium">
                          <TeamOutlined />
                          {myGroupForClass.groupName || myGroupForClass.name}
                        </div>
                      </>
                    ) : isCurrentUserLeader && myGroupId && groupTopic ? (
                      <>
                        <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
                          <CheckCircleOutlined className="text-2xl text-emerald-600" />
                        </div>
                        <Title level={5} className="!mb-1">
                          Nhóm đã chọn chủ đề
                        </Title>
                        <Text type="secondary" className="text-sm block">
                          Nhóm đang làm chủ đề:{" "}
                          <Text strong>{groupTopic.topicName}</Text>
                        </Text>
                        {classId && groupTopic.topicId !== topicIdNumber && (
                          <Link
                            to={`/student/class/${classId}/topic/${groupTopic.topicId}`}
                          >
                            <Button
                              type="primary"
                              icon={<BookOutlined />}
                              block
                            >
                              Đi tới chủ đề của nhóm
                            </Button>
                          </Link>
                        )}
                      </>
                    ) : isCurrentUserLeader && myGroupId ? (
                      <>
                        <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto">
                          <CrownOutlined className="text-2xl text-amber-600" />
                        </div>
                        <Title level={5} className="!mb-1">
                          Chọn chủ đề cho nhóm
                        </Title>
                        <Text type="secondary" className="text-sm block">
                          Chọn chủ đề này cho cả nhóm — các thành viên sẽ được
                          ghi danh cùng lúc.
                        </Text>
                        <Button
                          type="primary"
                          block
                          icon={
                            groupActionLoading ? (
                              <LoadingOutlined />
                            ) : (
                              <CheckCircleOutlined />
                            )
                          }
                          loading={groupActionLoading}
                          onClick={handlePickTopicForGroup}
                        >
                          Chọn chủ đề này cho nhóm
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto">
                          <BookOutlined className="text-2xl text-amber-600" />
                        </div>
                        <Title level={5} className="!mb-1">
                          Tham gia nhóm trước
                        </Title>
                        <Text type="secondary" className="text-sm block">
                          Bạn cần ở trong một nhóm để nhóm trưởng chọn chủ đề.
                        </Text>
                        <Link to={`/student/class/${classId}`}>
                          <Button type="primary" block icon={<TeamOutlined />}>
                            Đến quản lý nhóm
                          </Button>
                        </Link>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="enrolled"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {isCurrentUserLeader && isGroupTopicThis && myGroupId && (
                      <Button
                        type="text"
                        danger
                        block
                        loading={groupActionLoading}
                        onClick={handleClearGroupTopic}
                      >
                        Hủy chọn chủ đề cho nhóm
                      </Button>
                    )}

                    {myPresentation ? (
                      <div className="text-center py-2 space-y-3">
                        <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
                          <CheckCircleOutlined className="text-2xl text-emerald-600" />
                        </div>
                        <Title level={5} className="!mb-0">
                          Bài của bạn
                        </Title>
                        {myPresentation.status === "failed" ? (
                          <Alert
                            type="error"
                            message="Xử lý thất bại. Bạn có thể gửi lại bài để thử lại."
                            showIcon
                            className="!rounded-xl text-left"
                          />
                        ) : (
                          <Text type="secondary" className="text-sm block">
                            {myPresentation.status === "draft"
                              ? "Đã tạo bài thuyết trình. Tải lên file để bắt đầu xử lý."
                              : myPresentation.status === "submitted" ||
                                  myPresentation.status === "processing"
                                ? "Bài đã được nộp và đang xử lý AI."
                                : myPresentation.status === "done"
                                  ? "Xử lý hoàn tất! Xem kết quả trong chi tiết bài."
                                  : ""}
                          </Text>
                        )}

                        <div className="space-y-2">
                          <Tag
                            color={
                              (
                                statusConfig[
                                  myPresentation.status?.toLowerCase()
                                ] || statusConfig.draft
                              ).color
                            }
                            className="!rounded-full !px-3 !py-1 !text-sm"
                          >
                            {
                              (
                                statusConfig[
                                  myPresentation.status?.toLowerCase()
                                ] || statusConfig.draft
                              ).label
                            }
                          </Tag>

                          {myPresentation.status === "draft" && (
                            <div className="pt-1">
                              {!canUpload ? (
                                <Button
                                  type="primary"
                                  block
                                  icon={<UploadOutlined />}
                                  disabled
                                >
                                  Giảng viên chưa mở upload
                                </Button>
                              ) : (
                                <Button
                                  type="primary"
                                  block
                                  icon={<UploadOutlined />}
                                  onClick={() =>
                                    handleOpenUploadModal(
                                      myPresentation.presentationId,
                                      myPresentation.title,
                                    )
                                  }
                                >
                                  Tải lên file
                                </Button>
                              )}
                            </div>
                          )}
                          {myPresentation.status === "failed" && (
                            <Button
                              type="primary"
                              danger
                              block
                              icon={<ReloadOutlined />}
                              onClick={() =>
                                handleRetry(
                                  myPresentation.presentationId,
                                  myPresentation.title,
                                )
                              }
                            >
                              Gửi lại bài (upload file mới)
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : myGroupForClass && isCurrentUserLeader ? (
                      <div className="text-center py-2 space-y-3">
                        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
                          <CrownOutlined className="text-2xl text-blue-600" />
                        </div>
                        <Title level={5} className="!mb-0">
                          Tạo bài thuyết trình
                        </Title>
                        <Text type="secondary" className="text-sm block">
                          Là nhóm trưởng, bạn có thể tạo bài thuyết trình cho
                          chủ đề này.
                        </Text>
                        <Button
                          type="primary"
                          block
                          icon={<PlusOutlined />}
                          onClick={() => setIsCreateModalOpen(true)}
                        >
                          Tạo bài thuyết trình
                        </Button>
                      </div>
                    ) : myGroupForClass ? (
                      <div className="text-center py-2 space-y-3">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
                          <TeamOutlined className="text-2xl text-slate-500" />
                        </div>
                        <Title level={5} className="!mb-0">
                          Chờ nhóm trưởng
                        </Title>
                        <Text type="secondary" className="text-sm block">
                          Nhóm trưởng cần tạo bài thuyết trình. Vui lòng chờ.
                        </Text>
                        <div className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-600 rounded-xl border border-slate-200 text-sm font-medium">
                          <TeamOutlined />
                          {myGroupForClass.groupName || myGroupForClass.name}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2 space-y-3">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
                          <TeamOutlined className="text-2xl text-slate-400" />
                        </div>
                        <Title level={5} className="!mb-0">
                          Tham gia nhóm trước
                        </Title>
                        <Text type="secondary" className="text-sm block">
                          Bạn cần ở trong một nhóm để tạo bài thuyết trình.
                        </Text>
                        <Link to={`/student/class/${classId}`}>
                          <Button type="primary" block icon={<TeamOutlined />}>
                            Đến quản lý nhóm
                          </Button>
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </div>
        </div>
      </div>

      {isCreateModalOpen && (
        <CreatePresentationModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={async (title, description) => {
            if (!topicIdNumber || !classIdNumber) return;
            const groupCode =
              myGroupForClass?.groupName || myGroupForClass?.name || undefined;
            await dispatch(
              createPresentation({
                classId: classIdNumber,
                topicId: topicIdNumber,
                title,
                description,
                groupCode,
              }),
            ).unwrap();
            toast.success("Tạo bài thuyết trình thành công!");
            dispatch(
              fetchPresentationsByClassAndTopic({
                classId: classIdNumber,
                topicId: topicIdNumber,
              }),
            );
          }}
          groupName={myGroupForClass?.groupName || myGroupForClass?.name}
        />
      )}

      {isUploadModalOpen && selectedPresentationId && (
        <PresentationUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            if (classIdNumber && topicIdNumber)
              dispatch(
                fetchPresentationsByClassAndTopic({
                  classId: classIdNumber,
                  topicId: topicIdNumber,
                }),
              );
          }}
          presentationId={selectedPresentationId}
          presentationTitle={selectedPresentationTitle}
          isResubmit={isUploadResubmit}
        />
      )}
    </StudentLayout>
  );
};

export default StudentTopicDetailPage;
