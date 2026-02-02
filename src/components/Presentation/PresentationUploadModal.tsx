import React, { useEffect, useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  uploadSlide,
  uploadMedia,
  submitPresentation,
  setCurrentPresentation,
} from "@/services/features/presentation/presentationSlice";
import Button from "@/components/yoodli/Button";
import Toast from "@/components/Toast/Toast";
import {
  X,
  Upload,
  Eye,
  RotateCcw,
  CheckCircle,
  FileText,
  Video,
  File,
  Loader2,
} from "lucide-react";

interface PresentationUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  presentationId: number;
  presentationTitle: string;
}

type UploadType = "slide" | "media" | null;

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

  // ✅ Fix "not used": only take what we use
  const { uploadProgress, error } = useAppSelector((state) => state.presentation);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [slideFile, setSlideFile] = useState<UploadedFile | null>(null);
  const [mediaFile, setMediaFile] = useState<UploadedFile | null>(null);
  const [slideConfirmed, setSlideConfirmed] = useState(false);
  const [mediaConfirmed, setMediaConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slideInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const [uploadType, setUploadType] = useState<UploadType>(null);

  // ✅ Optional: show toast if redux error changes
  useEffect(() => {
    if (error) {
      setToast({ message: String(error), type: "error" });
    }
  }, [error]);

  const validateFile = (
    file: File,
    allowedTypes: string[]
  ): { valid: boolean; message?: string } => {
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        message: `Invalid file type. Allowed: ${allowedTypes.join(", ")}`,
      };
    }
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return { valid: false, message: "File size exceeds 500MB" };
    }
    return { valid: true };
  };

  const handleSlideUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, [
      "application/pdf",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ]);

    if (!validation.valid) {
      setToast({ message: validation.message || "Invalid file", type: "error" });
      return;
    }

    setUploadType("slide");

    try {
      const result = await dispatch(uploadSlide({ presentationId, file })).unwrap();

      setSlideFile({
        name: result.slide.fileName,
        url: result.slide.filePath,
        type: result.slide.fileFormat,
        size: result.slide.fileSizeBytes,
      });
      setSlideConfirmed(false);
      setToast({ message: "Slide uploaded successfully", type: "success" });
    } catch (err: any) {
      setToast({
        message: err?.message || "Failed to upload slide",
        type: "error",
      });
    } finally {
      setUploadType(null);
      if (slideInputRef.current) slideInputRef.current.value = "";
    }
  };

  const handleMediaUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, [
      "video/mp4",
      "video/mpeg",
      "video/quicktime",
      "video/x-msvideo",
      "video/webm",
    ]);

    if (!validation.valid) {
      setToast({ message: validation.message || "Invalid file", type: "error" });
      return;
    }

    setUploadType("media");

    try {
      const result = await dispatch(uploadMedia({ presentationId, file })).unwrap();

      setMediaFile({
        name: result.audioRecord.fileName,
        url: result.audioRecord.filePath,
        type: result.audioRecord.fileFormat,
        size: result.audioRecord.fileSizeBytes,
      });
      setMediaConfirmed(false);
      setToast({ message: "Media uploaded successfully", type: "success" });
    } catch (err: any) {
      setToast({
        message: err?.message || "Failed to upload media",
        type: "error",
      });
    } finally {
      setUploadType(null);
      if (mediaInputRef.current) mediaInputRef.current.value = "";
    }
  };

  // ✅ Submit: close modal immediately on success + spinner while waiting
  const handleSubmit = async () => {
    if (!slideConfirmed || !mediaConfirmed) {
      setToast({
        message: "Please confirm both slide and media before submitting",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await dispatch(submitPresentation(presentationId)).unwrap();

      // ✅ Close immediately (no waiting)
      handleClose();

      // ❌ Avoid reload (better refetch outside modal)
      // window.location.reload();
    } catch (err: any) {
      setToast({
        message: err?.message || "Failed to submit presentation",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    dispatch(setCurrentPresentation(null));
    setSlideFile(null);
    setMediaFile(null);
    setSlideConfirmed(false);
    setMediaConfirmed(false);
    setIsSubmitting(false);
    setUploadType(null);

    // Clear file inputs (avoid stale file selection)
    if (slideInputRef.current) slideInputRef.current.value = "";
    if (mediaInputRef.current) mediaInputRef.current.value = "";

    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    const ft = String(fileType || "").toLowerCase();
    if (ft.includes("pdf")) {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    if (ft.includes("powerpoint") || ft.includes("presentation")) {
      return <FileText className="w-8 h-8 text-orange-500" />;
    }
    if (ft.includes("video")) {
      return <Video className="w-8 h-8 text-blue-500" />;
    }
    return <File className="w-8 h-8 text-gray-500" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Upload Presentation Files
            </h2>
            <p className="text-sm text-gray-600 mt-1">{presentationTitle}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Slide Upload Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-500" />
                Presentation Slides
              </h3>

              {!slideFile ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${uploadType === "slide"
                      ? "border-sky-500 bg-sky-50"
                      : "border-gray-300 hover:border-sky-400 hover:bg-gray-50"
                    }`}
                >
                  {uploadType === "slide" ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-3" />
                      <p className="text-sm text-gray-600">Uploading slide...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-2">
                        Upload PDF or PowerPoint file
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Max file size: 500MB
                      </p>
                      <input
                        ref={slideInputRef}
                        type="file"
                        accept=".pdf,.ppt,.pptx"
                        onChange={handleSlideUpload}
                        className="hidden"
                        id="slide-upload"
                      />
                      <label htmlFor="slide-upload">
                        <Button
                          text="Choose File"
                          variant="primary"
                          fontSize="14px"
                          borderRadius="8px"
                          paddingWidth="16px"
                          paddingHeight="8px"
                          onClick={() =>
                            document.getElementById("slide-upload")?.click()
                          }
                        />
                      </label>
                    </>
                  )}
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    {getFileIcon(slideFile.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {slideFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(slideFile.size)}
                      </p>
                    </div>
                    {slideConfirmed && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      text="View File"
                      variant="secondary"
                      fontSize="13px"
                      borderRadius="6px"
                      paddingWidth="10px"
                      paddingHeight="6px"
                      icon={<Eye className="w-4 h-4" />}
                      onClick={() => window.open(slideFile.url, "_blank")}
                    />
                    <Button
                      text="Upload Again"
                      variant="secondary"
                      fontSize="13px"
                      borderRadius="6px"
                      paddingWidth="10px"
                      paddingHeight="6px"
                      icon={<RotateCcw className="w-4 h-4" />}
                      onClick={() => {
                        setSlideFile(null);
                        setSlideConfirmed(false);
                        document.getElementById("slide-upload")?.click();
                      }}
                    />
                    <Button
                      text="Confirm"
                      variant="primary"
                      fontSize="13px"
                      borderRadius="6px"
                      paddingWidth="10px"
                      paddingHeight="6px"
                      disabled={slideConfirmed}
                      onClick={() => setSlideConfirmed(true)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Media Upload Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-sky-500" />
                Presentation Video
              </h3>

              {!mediaFile ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${uploadType === "media"
                      ? "border-sky-500 bg-sky-50"
                      : "border-gray-300 hover:border-sky-400 hover:bg-gray-50"
                    }`}
                >
                  {uploadType === "media" ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-3" />
                      <p className="text-sm text-gray-600">Uploading media...</p>
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="w-full max-w-xs mt-2">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-sky-500 transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <Video className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-2">
                        Upload video file (MP4, MOV, etc.)
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Max file size: 500MB
                      </p>
                      <input
                        ref={mediaInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleMediaUpload}
                        className="hidden"
                        id="media-upload"
                      />
                      <label htmlFor="media-upload">
                        <Button
                          text="Choose File"
                          variant="primary"
                          fontSize="14px"
                          borderRadius="8px"
                          paddingWidth="16px"
                          paddingHeight="8px"
                          onClick={() =>
                            document.getElementById("media-upload")?.click()
                          }
                        />
                      </label>
                    </>
                  )}
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    {getFileIcon(mediaFile.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {mediaFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(mediaFile.size)}
                      </p>
                    </div>
                    {mediaConfirmed && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      text="Preview"
                      variant="secondary"
                      fontSize="13px"
                      borderRadius="6px"
                      paddingWidth="10px"
                      paddingHeight="6px"
                      icon={<Eye className="w-4 h-4" />}
                      onClick={() => window.open(mediaFile.url, "_blank")}
                    />
                    <Button
                      text="Upload Again"
                      variant="secondary"
                      fontSize="13px"
                      borderRadius="6px"
                      paddingWidth="10px"
                      paddingHeight="6px"
                      icon={<RotateCcw className="w-4 h-4" />}
                      onClick={() => {
                        setMediaFile(null);
                        setMediaConfirmed(false);
                        document.getElementById("media-upload")?.click();
                      }}
                    />
                    <Button
                      text="Confirm"
                      variant="primary"
                      fontSize="13px"
                      borderRadius="6px"
                      paddingWidth="10px"
                      paddingHeight="6px"
                      disabled={mediaConfirmed}
                      onClick={() => setMediaConfirmed(true)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Upload Status
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                {slideFile ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
                <span
                  className={`text-sm ${slideFile ? "text-gray-900" : "text-gray-500"
                    }`}
                >
                  Slides {slideFile ? "(uploaded)" : "(not uploaded)"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {mediaFile ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
                <span
                  className={`text-sm ${mediaFile ? "text-gray-900" : "text-gray-500"
                    }`}
                >
                  Media {mediaFile ? "(uploaded)" : "(not uploaded)"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {slideConfirmed ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
                <span
                  className={`text-sm ${slideConfirmed ? "text-gray-900" : "text-gray-500"
                    }`}
                >
                  Slides confirmed
                </span>
              </div>
              <div className="flex items-center gap-2">
                {mediaConfirmed ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
                <span
                  className={`text-sm ${mediaConfirmed ? "text-gray-900" : "text-gray-500"
                    }`}
                >
                  Media confirmed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Button
            text="Cancel"
            variant="secondary"
            fontSize="14px"
            borderRadius="8px"
            paddingWidth="16px"
            paddingHeight="10px"
            onClick={handleClose}
          />
          <Button
            text={
              isSubmitting
                ? "Submitting..."
                : slideConfirmed && mediaConfirmed
                  ? "Submit Presentation"
                  : "Confirm Files First"
            }
            variant="primary"
            fontSize="14px"
            borderRadius="8px"
            paddingWidth="20px"
            paddingHeight="10px"
            disabled={!slideConfirmed || !mediaConfirmed || isSubmitting}
            icon={isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : undefined}
            onClick={handleSubmit}
          />
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </div>
  );
};

export default PresentationUploadModal;
