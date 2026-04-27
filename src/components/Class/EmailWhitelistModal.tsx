import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  Button,
  Typography,
  Space,
  Tag,
  Spin,
  Alert,
  Divider,
  Popconfirm,
} from "antd";
import {
  FileExcelOutlined,
  UploadOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/services/store/store";
import {
  uploadEmailWhitelist,
  fetchEmailWhitelist,
  deleteEmailWhitelist,
} from "@/services/features/admin/classSlice";
import { extractLocalizedMessage } from "@/lib/utils";

const { Text, Title, Paragraph } = Typography;

interface EmailWhitelistModalProps {
  isOpen: boolean;
  classData: { classId: number; classCode: string } | null;
  onClose: () => void;
}

interface WhitelistState {
  hasWhitelist: boolean;
  total: number;
  emails: string[];
}

const EmailWhitelistModal: React.FC<EmailWhitelistModalProps> = ({
  isOpen,
  classData,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [whitelist, setWhitelist] = useState<WhitelistState | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewEmails, setPreviewEmails] = useState<string[]>([]);
  const [previewError, setPreviewError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Fetch current whitelist on open
  useEffect(() => {
    if (!isOpen || !classData) return;
    setSuccessMsg("");
    setErrorMsg("");
    setPreviewFile(null);
    setPreviewEmails([]);
    setPreviewError("");

    const load = async () => {
      setLoading(true);
      try {
        const result = await dispatch(
          fetchEmailWhitelist(classData.classId),
        ).unwrap();
        setWhitelist({
          hasWhitelist: result.hasWhitelist ?? false,
          total: result.total ?? 0,
          emails: result.emails ?? [],
        });
      } catch {
        setWhitelist({ hasWhitelist: false, total: 0, emails: [] });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, classData, dispatch]);

  // Parse Excel file client-side for preview using SheetJS from CDN or via dynamic import
  // Since SheetJS is installed in the backend, we parse it minimally here:
  // We use FileReader to read text rows as a preview hint.
  const parseExcelPreview = async (file: File) => {
    setPreviewError("");
    setPreviewEmails([]);

    // We'll send file to server which does the actual parsing.
    // For client-side preview, we do a lightweight text approach:
    // Accept only .xlsx/.xls and show the file name + size.
    const allowedExts = /\.(xlsx|xls)$/i;
    if (!allowedExts.test(file.name)) {
      setPreviewError("Chỉ chấp nhận file .xlsx hoặc .xls");
      setPreviewFile(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPreviewError("File không được vượt quá 5MB");
      setPreviewFile(null);
      return;
    }
    setPreviewFile(file);
    // No client-side parsing — server will parse and return email list
    setPreviewEmails([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseExcelPreview(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseExcelPreview(file);
  };

  const handleUpload = async () => {
    if (!previewFile || !classData) return;
    setUploading(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const result = await dispatch(
        uploadEmailWhitelist({ classId: classData.classId, file: previewFile }),
      ).unwrap();
      setPreviewFile(null);
      setPreviewEmails(result.emails ?? []);
      setWhitelist({
        hasWhitelist: true,
        total: result.total ?? 0,
        emails: result.emails ?? [],
      });
      setSuccessMsg(
        result.message ||
          `Đã cập nhật ${result.total} email sinh viên thành công`,
      );
    } catch (err: any) {
      setErrorMsg(extractLocalizedMessage(err, "Không thể upload file"));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!classData) return;
    setDeleting(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const result = await dispatch(
        deleteEmailWhitelist(classData.classId),
      ).unwrap();
      setWhitelist({ hasWhitelist: false, total: 0, emails: [] });
      setPreviewFile(null);
      setPreviewEmails([]);
      setSuccessMsg(
        result.message || "Đã xóa danh sách email. Lớp học mở cho tất cả.",
      );
    } catch (err: any) {
      setErrorMsg(extractLocalizedMessage(err, "Không thể xóa danh sách"));
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    setPreviewFile(null);
    setPreviewEmails([]);
    setPreviewError("");
    setSuccessMsg("");
    setErrorMsg("");
    onClose();
  };

  const displayEmails =
    previewEmails.length > 0 ? previewEmails : whitelist?.emails ?? [];

  return (
    <Modal
      title={
        <Space>
          <FileExcelOutlined style={{ color: "#22c55e", fontSize: 18 }} />
          <span>
            Danh sách sinh viên — <strong>{classData?.classCode}</strong>
          </span>
        </Space>
      }
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={600}
      centered
      destroyOnHidden
    >
      <div className="space-y-4 py-2">
        {/* Current status */}
        {loading ? (
          <div className="flex justify-center py-6">
            <Spin />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
              <div>
                <Text strong>Trạng thái whitelist</Text>
                <div className="mt-1">
                  {whitelist?.hasWhitelist ? (
                    <Space>
                      <CheckCircleOutlined className="text-green-500" />
                      <Text className="text-green-600">
                        Đang bật — <strong>{whitelist.total}</strong> email
                        được phép
                      </Text>
                    </Space>
                  ) : (
                    <Space>
                      <CloseCircleOutlined className="text-gray-400" />
                      <Text type="secondary">
                        Chưa có — tất cả sinh viên đều có thể tham gia
                      </Text>
                    </Space>
                  )}
                </div>
              </div>
              {whitelist?.hasWhitelist && (
                <Popconfirm
                  title="Xóa danh sách email"
                  description="Lớp học sẽ cho phép tất cả sinh viên tham gia. Tiếp tục?"
                  onConfirm={handleDelete}
                  okText="Xóa"
                  okButtonProps={{ danger: true }}
                  cancelText="Hủy"
                >
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    loading={deleting}
                  >
                    Xóa whitelist
                  </Button>
                </Popconfirm>
              )}
            </div>

            {/* Email preview list */}
            {displayEmails.length > 0 && (
              <div>
                <Text type="secondary" className="text-xs">
                  {previewEmails.length > 0
                    ? `Danh sách từ file vừa chọn (${displayEmails.length} email)`
                    : `Danh sách hiện tại (${displayEmails.length} email)`}
                </Text>
                <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50 flex flex-wrap gap-1">
                  {displayEmails.slice(0, 100).map((email) => (
                    <Tag key={email} color="blue" className="text-xs mb-0">
                      {email}
                    </Tag>
                  ))}
                  {displayEmails.length > 100 && (
                    <Tag color="default" className="text-xs">
                      +{displayEmails.length - 100} email khác
                    </Tag>
                  )}
                </div>
              </div>
            )}

            <Divider className="my-3" />

            {/* Upload area */}
            <div>
              <Title level={5} className="!mb-2">
                Upload file Excel mới
              </Title>
              <Paragraph type="secondary" className="!text-xs !mb-3">
                File cần có cột <strong>email</strong> hoặc cột đầu tiên chứa
                địa chỉ email. Tải lên sẽ thay thế toàn bộ danh sách cũ.
              </Paragraph>

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                  isDragOver
                    ? "border-blue-500 bg-blue-50"
                    : previewFile
                      ? "border-green-400 bg-green-50"
                      : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                <InboxOutlined
                  style={{
                    fontSize: 32,
                    color: previewFile ? "#22c55e" : "#9ca3af",
                  }}
                />
                {previewFile ? (
                  <div className="mt-2">
                    <Text strong className="text-green-600">
                      {previewFile.name}
                    </Text>
                    <br />
                    <Text type="secondary" className="text-xs">
                      {(previewFile.size / 1024).toFixed(1)} KB — Click để chọn
                      lại
                    </Text>
                  </div>
                ) : (
                  <div className="mt-2">
                    <Text>Kéo thả file vào đây hoặc click để chọn</Text>
                    <br />
                    <Text type="secondary" className="text-xs">
                      Hỗ trợ .xlsx, .xls — tối đa 5MB
                    </Text>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />

              {previewError && (
                <Alert
                  message={previewError}
                  type="error"
                  showIcon
                  className="mt-2"
                />
              )}
            </div>

            {/* Status messages */}
            {successMsg && (
              <Alert message={successMsg} type="success" showIcon />
            )}
            {errorMsg && (
              <Alert message={errorMsg} type="error" showIcon />
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <Button onClick={handleClose}>Đóng</Button>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                disabled={!previewFile || !!previewError}
                loading={uploading}
                onClick={handleUpload}
              >
                {uploading ? "Đang xử lý..." : "Upload danh sách"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default EmailWhitelistModal;
