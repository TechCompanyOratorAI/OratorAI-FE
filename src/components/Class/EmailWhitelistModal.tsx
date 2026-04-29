import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  Button,
  Typography,
  Space,
  Spin,
  Alert,
  Divider,
  Popconfirm,
  Input,
  Table,
  Tooltip,
  Badge,
} from "antd";
import {
  FileExcelOutlined,
  UploadOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  UserDeleteOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/services/store/store";
import {
  uploadEmailWhitelist,
  fetchEmailWhitelist,
  deleteEmailWhitelist,
  addEmailToWhitelist,
  updateEmailInWhitelist,
  removeEmailFromWhitelist,
} from "@/services/features/admin/classSlice";
import { extractLocalizedMessage } from "@/lib/utils";

const { Text, Title } = Typography;

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
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Add single email state
  const [addEmail, setAddEmail] = useState("");
  const [adding, setAdding] = useState(false);

  // Inline edit state
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Remove single email state
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);

  // Search filter
  const [search, setSearch] = useState("");

  // Drag-over state
  const [isDragOver, setIsDragOver] = useState(false);

  const clearMessages = () => {
    setSuccessMsg("");
    setErrorMsg("");
  };

  const loadWhitelist = async () => {
    if (!classData?.classId) return;
    setLoading(true);
    try {
      const result = await dispatch(fetchEmailWhitelist(classData.classId)).unwrap();
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

  useEffect(() => {
    if (isOpen && classData?.classId) {
      loadWhitelist();
      clearMessages();
      setAddEmail("");
      setEditingEmail(null);
      setPreviewFile(null);
      setSearch("");
    }
  }, [isOpen, classData?.classId]);

  // ─── Excel Upload ────────────────────────────────────────────────────────────

  const validateFile = (file: File): string => {
    const ext = file.name.toLowerCase();
    if (!ext.endsWith(".xlsx") && !ext.endsWith(".xls")) return "Chỉ chấp nhận file .xlsx hoặc .xls";
    if (file.size > 5 * 1024 * 1024) return "File không được vượt quá 5MB";
    return "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setErrorMsg(err); return; }
    clearMessages();
    setPreviewFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setErrorMsg(err); return; }
    clearMessages();
    setPreviewFile(file);
  };

  const handleUpload = async () => {
    if (!classData?.classId || !previewFile) return;
    setUploading(true);
    clearMessages();
    try {
      const result = await dispatch(
        uploadEmailWhitelist({ classId: classData.classId, file: previewFile })
      ).unwrap();
      setSuccessMsg(result.message || `Đã import ${result.total ?? 0} email thành công`);
      setPreviewFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadWhitelist();
    } catch (error: any) {
      setErrorMsg(extractLocalizedMessage(error, "Không thể upload file"));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!classData?.classId) return;
    setDeleting(true);
    clearMessages();
    try {
      await dispatch(deleteEmailWhitelist(classData.classId)).unwrap();
      setSuccessMsg("Đã xóa toàn bộ whitelist. Lớp học mở cho tất cả sinh viên.");
      await loadWhitelist();
    } catch (error: any) {
      setErrorMsg(extractLocalizedMessage(error, "Không thể xóa whitelist"));
    } finally {
      setDeleting(false);
    }
  };

  // ─── Add Single Email ────────────────────────────────────────────────────────

  const handleAddEmail = async () => {
    if (!classData?.classId || !addEmail.trim()) return;
    setAdding(true);
    clearMessages();
    try {
      const result = await dispatch(
        addEmailToWhitelist({ classId: classData.classId, email: addEmail.trim() })
      ).unwrap();
      if (result.success === false) throw new Error(result.message);
      setSuccessMsg(result.message || `Đã thêm ${addEmail.trim()}`);
      setAddEmail("");
      await loadWhitelist();
    } catch (error: any) {
      setErrorMsg(extractLocalizedMessage(error, "Không thể thêm email"));
    } finally {
      setAdding(false);
    }
  };

  // ─── Edit Single Email ────────────────────────────────────────────────────────

  const startEdit = (email: string) => {
    setEditingEmail(email);
    setEditValue(email);
    clearMessages();
  };

  const cancelEdit = () => {
    setEditingEmail(null);
    setEditValue("");
  };

  const saveEdit = async () => {
    if (!classData?.classId || !editingEmail || !editValue.trim()) return;
    if (editValue.trim() === editingEmail) { cancelEdit(); return; }
    setSavingEdit(true);
    clearMessages();
    try {
      const result = await dispatch(
        updateEmailInWhitelist({
          classId: classData.classId,
          oldEmail: editingEmail,
          newEmail: editValue.trim(),
        })
      ).unwrap();
      if (result.success === false) throw new Error(result.message);
      setSuccessMsg(result.message || "Đã cập nhật email");
      cancelEdit();
      await loadWhitelist();
    } catch (error: any) {
      setErrorMsg(extractLocalizedMessage(error, "Không thể cập nhật email"));
    } finally {
      setSavingEdit(false);
    }
  };

  // ─── Remove Single Email ─────────────────────────────────────────────────────

  const handleRemoveSingle = async (email: string) => {
    if (!classData?.classId) return;
    setRemovingEmail(email);
    clearMessages();
    try {
      const result = await dispatch(
        removeEmailFromWhitelist({ classId: classData.classId, email })
      ).unwrap();
      if (result.success === false) throw new Error(result.message);
      setSuccessMsg(result.message || `Đã xóa ${email}`);
      await loadWhitelist();
    } catch (error: any) {
      setErrorMsg(extractLocalizedMessage(error, "Không thể xóa email"));
    } finally {
      setRemovingEmail(null);
    }
  };

  // ─── Filter ──────────────────────────────────────────────────────────────────

  const filteredEmails = (whitelist?.emails ?? []).filter((e) =>
    e.toLowerCase().includes(search.toLowerCase().trim())
  );

  // ─── Table columns ───────────────────────────────────────────────────────────

  const columns = [
    {
      title: "Email sinh viên",
      dataIndex: "email",
      key: "email",
      render: (email: string) => {
        if (editingEmail === email) {
          return (
            <Input
              size="small"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onPressEnter={saveEdit}
              autoFocus
              style={{ maxWidth: 320 }}
            />
          );
        }
        return <Text className="font-mono text-sm">{email}</Text>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 140,
      align: "right" as const,
      render: (_: any, record: { email: string }) => {
        const email = record.email;
        if (editingEmail === email) {
          return (
            <Space size={4}>
              <Button
                type="primary"
                size="small"
                icon={<SaveOutlined />}
                loading={savingEdit}
                onClick={saveEdit}
              >
                Lưu
              </Button>
              <Button size="small" icon={<CloseOutlined />} onClick={cancelEdit} disabled={savingEdit}>
                Hủy
              </Button>
            </Space>
          );
        }
        return (
          <Space size={4}>
            <Tooltip title="Sửa email">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => startEdit(email)}
                disabled={!!editingEmail || !!removingEmail}
              />
            </Tooltip>
            <Popconfirm
              title={
                <div>
                  <p className="font-semibold">Xóa sinh viên khỏi danh sách?</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Email <strong>{email}</strong> sẽ bị xóa khỏi whitelist.
                  </p>
                  <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                    <ExclamationCircleOutlined />
                    Nếu sinh viên đã join lớp, họ sẽ bị kick ra ngay lập tức.
                  </p>
                </div>
              }
              okText="Xóa & Kick"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleRemoveSingle(email)}
              placement="topRight"
            >
              <Tooltip title="Xóa & kick khỏi lớp">
                <Button
                  size="small"
                  danger
                  icon={<UserDeleteOutlined />}
                  loading={removingEmail === email}
                  disabled={!!editingEmail || (!!removingEmail && removingEmail !== email)}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const tableData = filteredEmails.map((email) => ({ key: email, email }));

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-2">
          <FileExcelOutlined className="text-green-600 text-lg" />
          <span className="font-bold text-slate-800">
            Quản lý sinh viên — {classData?.classCode}
          </span>
          {whitelist?.hasWhitelist && (
            <Badge
              count={whitelist.total}
              style={{ backgroundColor: "#16a34a", fontSize: 11 }}
            />
          )}
        </div>
      }
      width={720}
      footer={null}
      styles={{ body: { padding: "0 24px 24px" } }}
      destroyOnClose
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <Spin size="large" tip="Đang tải danh sách..." />
        </div>
      ) : (
        <div className="space-y-5 pt-4">
          {/* Messages */}
          {successMsg && (
            <Alert
              type="success"
              message={successMsg}
              icon={<CheckCircleOutlined />}
              showIcon
              closable
              onClose={() => setSuccessMsg("")}
            />
          )}
          {errorMsg && (
            <Alert
              type="error"
              message={errorMsg}
              icon={<CloseCircleOutlined />}
              showIcon
              closable
              onClose={() => setErrorMsg("")}
            />
          )}

          {/* Status banner */}
          <div
            className={`rounded-xl p-3 flex items-center gap-3 ${
              whitelist?.hasWhitelist
                ? "bg-green-50 border border-green-200"
                : "bg-slate-50 border border-slate-200"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                whitelist?.hasWhitelist ? "bg-green-100" : "bg-slate-100"
              }`}
            >
              {whitelist?.hasWhitelist ? (
                <CheckCircleOutlined className="text-green-600" />
              ) : (
                <CloseCircleOutlined className="text-slate-400" />
              )}
            </div>
            <div className="flex-1">
              <Text strong className={whitelist?.hasWhitelist ? "text-green-800" : "text-slate-600"}>
                {whitelist?.hasWhitelist
                  ? `Whitelist đang bật — ${whitelist.total} sinh viên được phép tham gia`
                  : "Chưa có whitelist — tất cả sinh viên đều có thể join bằng mã đăng ký"}
              </Text>
            </div>
            {whitelist?.hasWhitelist && (
              <Popconfirm
                title="Xóa toàn bộ whitelist?"
                description="Sau khi xóa, tất cả sinh viên đều có thể tham gia lớp (nếu có mã đăng ký)."
                okText="Xóa tất cả"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                onConfirm={handleDeleteAll}
              >
                <Button danger size="small" icon={<DeleteOutlined />} loading={deleting}>
                  Xóa toàn bộ
                </Button>
              </Popconfirm>
            )}
          </div>

          {/* ── Add single email ── */}
          <div>
            <Text strong className="text-slate-700 text-sm">
              Thêm sinh viên
            </Text>
            <div className="flex gap-2 mt-1.5">
              <Input
                placeholder="sinhvien@example.edu.vn"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                onPressEnter={handleAddEmail}
                disabled={adding}
                allowClear
                style={{ flex: 1 }}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddEmail}
                loading={adding}
                disabled={!addEmail.trim()}
              >
                Thêm
              </Button>
            </div>
          </div>

          {/* ── Email list table ── */}
          {whitelist?.hasWhitelist && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Text strong className="text-slate-700 text-sm">
                  Danh sách sinh viên ({whitelist.total})
                </Text>
                <Input.Search
                  placeholder="Tìm email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  allowClear
                  size="small"
                  style={{ width: 200 }}
                />
              </div>
              <Table
                dataSource={tableData}
                columns={columns}
                size="small"
                pagination={
                  filteredEmails.length > 10
                    ? { pageSize: 10, showSizeChanger: false, size: "small" }
                    : false
                }
                locale={{ emptyText: search ? "Không tìm thấy email phù hợp" : "Chưa có email" }}
                scroll={{ y: 280 }}
                className="border border-slate-200 rounded-xl overflow-hidden"
              />
            </div>
          )}

          <Divider className="my-3" />

          {/* ── Excel bulk import ── */}
          <div>
            <Title level={5} className="!text-slate-700 !mb-2 !text-sm">
              Import hàng loạt từ Excel
            </Title>

            <div
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                isDragOver
                  ? "border-green-400 bg-green-50"
                  : previewFile
                  ? "border-green-300 bg-green-50"
                  : "border-slate-300 hover:border-green-400 hover:bg-green-50/50"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
              <FileExcelOutlined className="text-3xl text-green-500 mb-2" />
              {previewFile ? (
                <>
                  <p className="font-semibold text-green-700">{previewFile.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(previewFile.size / 1024).toFixed(0)} KB — Nhấn Upload để import
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-600">
                    Kéo thả file hoặc nhấn để chọn
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    .xlsx / .xls — tối đa 5MB. Cột tiêu đề: <code className="bg-slate-100 px-1 rounded">email</code>
                  </p>
                </>
              )}
            </div>

            {previewFile && (
              <div className="flex gap-2 mt-2">
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={handleUpload}
                  loading={uploading}
                  className="flex-1"
                >
                  {uploading ? "Đang import..." : "Upload & Thay thế danh sách"}
                </Button>
                <Button
                  icon={<CloseCircleOutlined />}
                  onClick={() => {
                    setPreviewFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  disabled={uploading}
                >
                  Hủy
                </Button>
              </div>
            )}

            {whitelist?.hasWhitelist && (
              <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                <ExclamationCircleOutlined />
                Upload Excel sẽ <strong>thay thế toàn bộ</strong> danh sách hiện tại, không phải gộp thêm.
              </p>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <Button onClick={onClose}>Đóng</Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default EmailWhitelistModal;
