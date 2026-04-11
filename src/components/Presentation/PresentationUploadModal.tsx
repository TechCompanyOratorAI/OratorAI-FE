import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  uploadSlide,
  uploadMedia,
  submitPresentation,
  setCurrentPresentation,
} from "@/services/features/presentation/presentationSlice";
import {
  Modal,
  Upload,
  Progress,
  Typography,
  Space,
  Button,
  message,
  Tag,
} from "antd";
import {
  InboxOutlined,
  FilePdfOutlined,
  VideoCameraOutlined,
  EyeOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";

const { Text, Title } = Typography;
const { Dragger } = Upload;

interface PresentationUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  presentationId: number;
  presentationTitle: string;
}

interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

const PresentationUploadModal: React.FC<PresentationUploadModalProps> = ({
  isOpen,
  onClose,
  presentationId,
  presentationTitle,
}) => {
  const dispatch = useAppDispatch();
  const { uploadProgress, error } = useAppSelector(
    (state) => state.presentation,
  );

  const [slideFile, setSlideFile] = useState<UploadedFile | null>(null);
  const [mediaFile, setMediaFile] = useState<UploadedFile | null>(null);
  const [slideConfirmed, setSlideConfirmed] = useState(false);
  const [mediaConfirmed, setMediaConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (error) {
      void message.error(String(error));
    }
  }, [error]);

  // Đóng modal → reset toàn bộ state
  const handleClose = () => {
    void dispatch(setCurrentPresentation(null));
    setSlideFile(null);
    setMediaFile(null);
    setSlideConfirmed(false);
    setMediaConfirmed(false);
    setIsSubmitting(false);
    onClose();
  };

  // Validate file: loại + kích thước
  const validateFile = (
    file: File,
    allowedTypes: string[],
    maxMB = 500,
  ): { valid: boolean; message?: string } => {
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        message: `Định dạng không hợp lệ. Chỉ chấp nhận: ${allowedTypes.join(", ")}`,
      };
    }
    const maxBytes = maxMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return {
        valid: false,
        message: `Dung lượng vượt quá ${maxMB}MB`,
      };
    }
    return { valid: true };
  };

  // Lấy duration từ video file
  const getVideoDuration = (file: File): Promise<number> =>
    new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      const url = URL.createObjectURL(file);
      video.src = url;
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(Math.round(video.duration));
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(0);
      };
    });

  // Upload props cho Slides (PDF / PPT)
  const slideUploadProps: UploadProps = {
    name: "file",
    accept: ".pdf,.ppt,.pptx",
    showUploadList: false,
    beforeUpload: async (file) => {
      const validation = validateFile(file, [
        "application/pdf",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ]);
      if (!validation.valid) {
        void message.error(validation.message);
        return Upload.LIST_IGNORE;
      }
      try {
        const result = await dispatch(
          uploadSlide({ presentationId, file }),
        ).unwrap();
        setSlideFile({
          name: result.slide.fileName,
          url: result.slide.filePath,
          type: result.slide.fileFormat,
          size: result.slide.fileSizeBytes,
        });
        setSlideConfirmed(false);
        void message.success("Tải lên slides thành công!");
      } catch (err: unknown) {
        void message.error(
          err instanceof Error ? err.message : "Tải lên slides thất bại",
        );
      }
      return false;
    },
  };

  // Upload props cho Video
  const mediaUploadProps: UploadProps = {
    name: "file",
    accept: "video/*",
    showUploadList: false,
    beforeUpload: async (file) => {
      const validation = validateFile(file, [
        "video/mp4",
        "video/mpeg",
        "video/quicktime",
        "video/x-msvideo",
        "video/webm",
      ]);
      if (!validation.valid) {
        void message.error(validation.message);
        return Upload.LIST_IGNORE;
      }
      try {
        const duration = await getVideoDuration(file);
        const result = await dispatch(
          uploadMedia({
            presentationId,
            file,
            durationSeconds: duration || undefined,
            sampleRate: 44100,
            recordingMethod: "upload",
          }),
        ).unwrap();
        setMediaFile({
          name: result.audioRecord.fileName,
          url: result.audioRecord.filePath,
          type: result.audioRecord.fileFormat,
          size: result.audioRecord.fileSizeBytes,
        });
        setMediaConfirmed(false);
        void message.success("Tải lên video thành công!");
      } catch (err: unknown) {
        void message.error(
          err instanceof Error ? err.message : "Tải lên video thất bại",
        );
      }
      return false;
    },
  };

  const canSubmit =
    (slideFile !== null && slideConfirmed) ||
    (mediaFile !== null && mediaConfirmed);

  const handleSubmit = async () => {
    if (!canSubmit) {
      void message.error(
        "Vui lòng tải lên và xác nhận ít nhất slides hoặc video.",
      );
      return;
    }
    setIsSubmitting(true);
    try {
      await dispatch(submitPresentation(presentationId)).unwrap();
      void message.success("Nộp bài thuyết trình thành công!");
      handleClose();
    } catch (err: unknown) {
      void message.error(
        err instanceof Error ? err.message : "Nộp bài thất bại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
  };

  const statusItems = [
    {
      label: "Slides",
      uploaded: !!slideFile,
      confirmed: slideConfirmed,
    },
    {
      label: "Video",
      uploaded: !!mediaFile,
      confirmed: mediaConfirmed,
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <InboxOutlined className="text-sky-500" />
          <span>Tải lên file bài thuyết trình</span>
        </Space>
      }
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      centered
      width={720}
      bodyStyle={{ maxHeight: "calc(90vh - 180px)", overflowY: "auto" }}
      destroyOnClose
      maskClosable={!isSubmitting}
    >
      {/* Tiêu đề phụ */}
      <Text type="secondary" className="block mb-4 -mt-1">
        <strong>{presentationTitle}</strong> — Chỉ cần tải lên slides (PDF /
        PowerPoint) hoặc video, không bắt buộc cả hai.
      </Text>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ── Slides ── */}
        <div>
          <Title level={5} className="!mb-3 flex items-center gap-2">
            <FilePdfOutlined className="text-red-500" />
            Slides
          </Title>

          {!slideFile ? (
            <Dragger {...slideUploadProps} className="!rounded-xl">
              <p className="ant-upload-drag-icon">
                {uploadProgress > 0 && uploadProgress < 100 ? (
                  <LoadingOutlined className="text-sky-500 text-3xl" />
                ) : (
                  <InboxOutlined className="text-gray-400 text-3xl" />
                )}
              </p>
              <p className="ant-upload-text">
                Kéo thả hoặc click để chọn file slides
              </p>
              <p className="ant-upload-hint">PDF, PowerPoint — Tối đa 500MB</p>
            </Dragger>
          ) : (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
              <div className="flex items-center gap-3 mb-3">
                <FilePdfOutlined className="text-2xl text-red-500" />
                <div className="flex-1 min-w-0">
                  <Text
                    ellipsis
                    className="block font-medium"
                    title={slideFile.name}
                  >
                    {slideFile.name}
                  </Text>
                  <Text type="secondary" className="text-xs">
                    {formatSize(slideFile.size)}
                  </Text>
                </div>
                {slideConfirmed && (
                  <CheckCircleOutlined className="text-green-500 text-lg" />
                )}
              </div>

              <Space size={4} wrap>
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => window.open(slideFile.url, "_blank")}
                >
                  Xem
                </Button>
                <Upload {...slideUploadProps} showUploadList={false}>
                  <Button size="small" icon={<ReloadOutlined />}>
                    Tải lại
                  </Button>
                </Upload>
                <Button
                  size="small"
                  type="primary"
                  disabled={slideConfirmed}
                  onClick={() => setSlideConfirmed(true)}
                >
                  {slideConfirmed ? "Đã xác nhận" : "Xác nhận"}
                </Button>
              </Space>
            </div>
          )}
        </div>

        {/* ── Video ── */}
        <div>
          <Title level={5} className="!mb-3 flex items-center gap-2">
            <VideoCameraOutlined className="text-blue-500" />
            Video
          </Title>

          {!mediaFile ? (
            <Dragger {...mediaUploadProps} className="!rounded-xl">
              <p className="ant-upload-drag-icon">
                {uploadProgress > 0 && uploadProgress < 100 ? (
                  <LoadingOutlined className="text-sky-500 text-3xl" />
                ) : (
                  <InboxOutlined className="text-gray-400 text-3xl" />
                )}
              </p>
              <p className="ant-upload-text">
                Kéo thả hoặc click để chọn file video
              </p>
              <p className="ant-upload-hint">
                MP4, MOV, AVI, WebM — Tối đa 500MB
              </p>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <Progress
                  percent={uploadProgress}
                  size="small"
                  className="mt-3 mx-4"
                  strokeColor="#0ea5e9"
                />
              )}
            </Dragger>
          ) : (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
              <div className="flex items-center gap-3 mb-3">
                <VideoCameraOutlined className="text-2xl text-blue-500" />
                <div className="flex-1 min-w-0">
                  <Text
                    ellipsis
                    className="block font-medium"
                    title={mediaFile.name}
                  >
                    {mediaFile.name}
                  </Text>
                  <Text type="secondary" className="text-xs">
                    {formatSize(mediaFile.size)}
                  </Text>
                </div>
                {mediaConfirmed && (
                  <CheckCircleOutlined className="text-green-500 text-lg" />
                )}
              </div>

              <Space size={4} wrap>
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => window.open(mediaFile.url, "_blank")}
                >
                  Xem
                </Button>
                <Upload {...mediaUploadProps} showUploadList={false}>
                  <Button size="small" icon={<ReloadOutlined />}>
                    Tải lại
                  </Button>
                </Upload>
                <Button
                  size="small"
                  type="primary"
                  disabled={mediaConfirmed}
                  onClick={() => setMediaConfirmed(true)}
                >
                  {mediaConfirmed ? "Đã xác nhận" : "Xác nhận"}
                </Button>
              </Space>
            </div>
          )}
        </div>
      </div>

      {/* Trạng thái tổng hợp */}
      <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <Text strong className="text-sm mb-2 block">
          Trạng thái tải lên
        </Text>
        <Space size="middle" wrap>
          {statusItems.map((item) => (
            <Tag
              key={item.label}
              color={
                item.confirmed
                  ? "green"
                  : item.uploaded
                    ? "blue"
                    : "default"
              }
              icon={
                item.confirmed ? (
                  <CheckCircleOutlined />
                ) : item.uploaded ? (
                  <LoadingOutlined />
                ) : undefined
              }
            >
              {item.label}:{" "}
              {item.confirmed
                ? "Đã xác nhận"
                : item.uploaded
                  ? "Đã tải"
                  : "Chưa tải"}
            </Tag>
          ))}
        </Space>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
        <Button onClick={handleClose} disabled={isSubmitting}>
          Hủy
        </Button>
        <Button
          type="primary"
          disabled={!canSubmit}
          loading={isSubmitting}
          onClick={handleSubmit}
          icon={isSubmitting ? undefined : <CheckCircleOutlined />}
        >
          {isSubmitting
            ? "Đang nộp..."
            : canSubmit
              ? "Nộp bài thuyết trình"
              : "Chưa xác nhận file"}
        </Button>
      </div>
    </Modal>
  );
};

export default PresentationUploadModal;
