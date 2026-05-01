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
  Spin,
} from "antd";
import { getErrorMessage, getResponseMessage } from "@/lib/toast";
import {
  InboxOutlined,
  FilePdfOutlined,
  VideoCameraOutlined,
  EyeOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";

const { Text, Title } = Typography;
const { Dragger } = Upload;

interface PresentationUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  presentationId: number;
  presentationTitle: string;
  isResubmit?: boolean;
}

interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

/* ─────────────────────────────────────────────
   UploadZone — defined OUTSIDE parent component
   so React never unmounts/remounts it on render
───────────────────────────────────────────── */
interface UploadZoneProps {
  kind: "slide" | "video";
  uploadProps: UploadProps;
  file: UploadedFile | null;
  uploading: boolean;
  uploadPct: number;
  confirmed: boolean;
  onConfirm: () => void;
  formatSize: (bytes: number) => string;
}

const UploadZone: React.FC<UploadZoneProps> = ({
  kind,
  uploadProps,
  file,
  uploading,
  uploadPct,
  confirmed,
  onConfirm,
  formatSize,
}) => {
  const isSlide = kind === "slide";
  const accentCls = isSlide ? "text-red-500" : "text-blue-500";
  const progressFrom = isSlide ? "#0ea5e9" : "#3b82f6";
  const Icon = isSlide ? FilePdfOutlined : VideoCameraOutlined;
  const label = isSlide ? "Slides" : "Video";
  const hint = isSlide
    ? "PDF, PowerPoint — Tối đa 500MB"
    : "MP4, MOV, AVI, WebM — Tối đa 500MB";

  return (
    /* h-full so both columns always stretch to the same height */
    <div className="flex flex-col h-full gap-2">
      {/* section title */}
      <Title level={5} className="!mb-0 flex items-center gap-2">
        <Icon className={accentCls} />
        {label}
      </Title>

      {!file ? (
        /* empty state — dragger + optional progress below */
        <div className="flex flex-col gap-2 flex-1">
          <Dragger
            {...uploadProps}
            className="!rounded-xl flex-1"
            style={{ minHeight: 148 }}
          >
            <div className="flex flex-col items-center justify-center py-4 gap-1">
              {uploading ? (
                <Spin
                  indicator={
                    <CloudUploadOutlined
                      className={isSlide ? "text-sky-400" : "text-blue-400"}
                      style={{ fontSize: 36 }}
                    />
                  }
                />
              ) : (
                <CloudUploadOutlined
                  className="text-gray-300"
                  style={{ fontSize: 36 }}
                />
              )}
              <p className="ant-upload-text !mb-0">
                {uploading
                  ? `Đang tải ${label.toLowerCase()} lên...`
                  : `Kéo thả hoặc click để chọn file ${label.toLowerCase()}`}
              </p>
              <p className="ant-upload-hint !mt-0">{hint}</p>
            </div>
          </Dragger>

          {/* progress bar is OUTSIDE the Dragger — keeps layout stable */}
          {uploading && (
            <Progress
              percent={uploadPct}
              size="small"
              strokeColor={{ "0%": progressFrom, "100%": "#6366f1" }}
              format={(p) => (
                <span
                  className="text-xs font-semibold"
                  style={{ color: progressFrom }}
                >
                  {p}%
                </span>
              )}
            />
          )}
        </div>
      ) : (
        /* file card — flex-1 so it fills the column height */
        <div className="flex-1 border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between gap-3">
          <div className="flex items-start gap-3">
            <Icon className={`text-2xl flex-shrink-0 ${accentCls}`} />
            <div className="flex-1 min-w-0">
              <Text
                ellipsis
                className="block font-medium text-sm leading-snug"
                title={file.name}
              >
                {file.name}
              </Text>
              <Text type="secondary" className="text-xs">
                {formatSize(file.size)}
              </Text>
            </div>
            {confirmed && (
              <CheckCircleOutlined className="text-green-500 text-lg flex-shrink-0 mt-0.5" />
            )}
          </div>

          <Space size={6} wrap>
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => window.open(file.url, "_blank")}
            >
              Xem
            </Button>
            <Upload {...uploadProps} showUploadList={false}>
              <Button size="small" icon={<ReloadOutlined />}>
                Tải lại
              </Button>
            </Upload>
            <Button
              size="small"
              type="primary"
              disabled={confirmed}
              onClick={onConfirm}
            >
              {confirmed ? "Đã xác nhận" : "Xác nhận"}
            </Button>
          </Space>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Main modal
───────────────────────────────────────────── */
const PresentationUploadModal: React.FC<PresentationUploadModalProps> = ({
  isOpen,
  onClose,
  presentationId,
  presentationTitle,
  isResubmit = false,
}) => {
  const dispatch = useAppDispatch();
  const { error } = useAppSelector((state) => state.presentation);

  const [slideFile, setSlideFile] = useState<UploadedFile | null>(null);
  const [mediaFile, setMediaFile] = useState<UploadedFile | null>(null);
  const [slideConfirmed, setSlideConfirmed] = useState(false);
  const [mediaConfirmed, setMediaConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slideUploading, setSlideUploading] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [slideUploadPct, setSlideUploadPct] = useState(0);
  const [mediaUploadPct, setMediaUploadPct] = useState(0);

  useEffect(() => {
    if (error) void message.error(getErrorMessage(error));
  }, [error]);

  const handleClose = () => {
    void dispatch(setCurrentPresentation(null));
    setSlideFile(null);
    setMediaFile(null);
    setSlideConfirmed(false);
    setMediaConfirmed(false);
    setIsSubmitting(false);
    setSlideUploading(false);
    setMediaUploading(false);
    setSlideUploadPct(0);
    setMediaUploadPct(0);
    onClose();
  };

  const validateFile = (
    file: File,
    allowedTypes: string[],
    maxMB = 500,
  ): { valid: boolean; message?: string } => {
    if (!allowedTypes.includes(file.type))
      return {
        valid: false,
        message: `Định dạng không hợp lệ. Chỉ chấp nhận: ${allowedTypes.join(", ")}`,
      };
    if (file.size > maxMB * 1024 * 1024)
      return { valid: false, message: `Dung lượng vượt quá ${maxMB}MB` };
    return { valid: true };
  };

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

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
  };

  const slideUploadProps: UploadProps = {
    name: "file",
    accept: ".pdf,.ppt,.pptx",
    showUploadList: false,
    disabled: slideUploading,
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
        setSlideUploading(true);
        setSlideUploadPct(0);
        const progressInterval = setInterval(() => {
          setSlideUploadPct((prev) => {
            if (prev >= 90) { clearInterval(progressInterval); return prev; }
            return prev + Math.floor(Math.random() * 15) + 5;
          });
        }, 400);
        const result = await dispatch(
          uploadSlide({ presentationId, file }),
        ).unwrap();
        clearInterval(progressInterval);
        setSlideUploadPct(100);
        setSlideFile({
          name: result.slide.fileName,
          url: result.slide.filePath,
          type: result.slide.fileFormat,
          size: result.slide.fileSizeBytes,
        });
        setSlideConfirmed(false);
        void message.success(
          getResponseMessage(result, "Tải lên slides thành công!"),
        );
      } catch (err: unknown) {
        void message.error(getErrorMessage(err, "Tải lên slides thất bại"));
      } finally {
        setSlideUploading(false);
        setSlideUploadPct(0);
      }
      return false;
    },
  };

  const mediaUploadProps: UploadProps = {
    name: "file",
    accept: "video/*",
    showUploadList: false,
    disabled: mediaUploading,
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
        setMediaUploading(true);
        setMediaUploadPct(0);
        const progressInterval = setInterval(() => {
          setMediaUploadPct((prev) => {
            if (prev >= 90) { clearInterval(progressInterval); return prev; }
            return prev + Math.floor(Math.random() * 15) + 5;
          });
        }, 400);
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
        clearInterval(progressInterval);
        setMediaUploadPct(100);
        setMediaFile({
          name: result.audioRecord.fileName,
          url: result.audioRecord.filePath,
          type: result.audioRecord.fileFormat,
          size: result.audioRecord.fileSizeBytes,
        });
        setMediaConfirmed(false);
        void message.success(
          getResponseMessage(result, "Tải lên video thành công!"),
        );
      } catch (err: unknown) {
        void message.error(getErrorMessage(err, "Tải lên video thất bại"));
      } finally {
        setMediaUploading(false);
        setMediaUploadPct(0);
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
      const result = await dispatch(
        submitPresentation(presentationId),
      ).unwrap();
      void message.success(
        getResponseMessage(result, "Nộp bài thuyết trình thành công!"),
      );
      handleClose();
    } catch (err: unknown) {
      void message.error(getErrorMessage(err, "Nộp bài thất bại."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusItems = [
    { label: "Slides", uploaded: !!slideFile, confirmed: slideConfirmed },
    { label: "Video", uploaded: !!mediaFile, confirmed: mediaConfirmed },
  ];

  return (
    <Modal
      title={
        <Space>
          <InboxOutlined className="text-sky-500" />
          <span>
            {isResubmit
              ? "Gửi lại bài thuyết trình"
              : "Tải lên file bài thuyết trình"}
          </span>
        </Space>
      }
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      centered
      width={700}
      styles={{ body: { maxHeight: "calc(90vh - 160px)", overflowY: "auto" } }}
      destroyOnClose
      maskClosable={!isSubmitting}
    >
      {/* subtitle */}
      <Text type="secondary" className="block mb-5 -mt-1 text-sm">
        <strong>{presentationTitle}</strong> —{" "}
        {isResubmit
          ? "Upload file mới để thay thế file cũ. Bài sẽ được xử lý lại từ đầu."
          : "Chỉ cần tải lên slides (PDF / PowerPoint) hoặc video, không bắt buộc cả hai."}
      </Text>

      {/* two-column grid — default stretch aligns both columns to the same height */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UploadZone
          kind="slide"
          uploadProps={slideUploadProps}
          file={slideFile}
          uploading={slideUploading}
          uploadPct={slideUploadPct}
          confirmed={slideConfirmed}
          onConfirm={() => setSlideConfirmed(true)}
          formatSize={formatSize}
        />
        <UploadZone
          kind="video"
          uploadProps={mediaUploadProps}
          file={mediaFile}
          uploading={mediaUploading}
          uploadPct={mediaUploadPct}
          confirmed={mediaConfirmed}
          onConfirm={() => setMediaConfirmed(true)}
          formatSize={formatSize}
        />
      </div>

      {/* status summary */}
      <div className="mt-4 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 flex-wrap">
        <Text strong className="text-xs text-slate-500 uppercase tracking-wide">
          Trạng thái tải lên
        </Text>
        {statusItems.map((item) => (
          <Tag
            key={item.label}
            color={
              item.confirmed ? "green" : item.uploaded ? "blue" : "default"
            }
            icon={
              item.confirmed ? (
                <CheckCircleOutlined />
              ) : item.uploaded ? (
                <CloudUploadOutlined />
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
      </div>

      {/* footer */}
      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
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
