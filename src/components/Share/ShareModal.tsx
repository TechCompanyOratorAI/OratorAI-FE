import React, { useEffect, useState } from "react";
import {
  Modal,
  Tabs,
  Input,
  Button,
  Popconfirm,
  message,
  Tooltip,
} from "antd";
import {
  Globe,
  Mail,
  Copy,
  Link2,
  Trash2,
  CheckCircle2,
  Loader2,
  XCircle,
  Plus,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  fetchShareList,
  createPublicShare,
  revokePublicShare,
  inviteByEmails,
  revokeInvite,
  clearShareError,
} from "@/services/features/share/shareSlice";
import type { InviteResult, ShareRecord } from "@/services/features/share/shareSlice";

const { TextArea } = Input;

interface ShareModalProps {
  open: boolean;
  presentationId: number;
  onClose: () => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Tooltip title={copied ? "Đã sao chép!" : "Sao chép link"}>
      <Button
        size="small"
        icon={copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        onClick={handleCopy}
        className={copied ? "!text-emerald-500" : ""}
      />
    </Tooltip>
  );
}

function PublicShareTab({
  publicShare,
  loading,
  onCreate,
  onRevoke,
}: {
  publicShare: ShareRecord | null;
  loading: boolean;
  onCreate: (expiresAt?: string) => void;
  onRevoke: () => void;
}) {
  const [expiresAt, setExpiresAt] = useState("");

  const handleCreate = () => {
    const expires = expiresAt.trim() || undefined;
    onCreate(expires);
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Link công khai</span>
        </div>

        {publicShare ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
              <Link2 className="w-4 h-4 text-sky-500 shrink-0" />
              <span className="text-sm text-slate-600 truncate flex-1">
                {publicShare.shareUrl}
              </span>
              <CopyButton text={publicShare.shareUrl} />
            </div>

            {publicShare.expiresAt && (
              <p className="text-xs text-slate-400">
                Hết hạn: {new Date(publicShare.expiresAt).toLocaleString("vi-VN")}
              </p>
            )}

            <div className="flex gap-2">
              <Popconfirm
                title="Thu hồi link chia sẻ?"
                description="Mọi người sẽ không thể xem bài thuyết trình qua link này nữa."
                onConfirm={onRevoke}
                okText="Thu hồi"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button
                  size="small"
                  danger
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  loading={loading}
                >
                  Thu hồi
                </Button>
              </Popconfirm>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Thời hạn (tùy chọn)
              </label>
              <Input
                size="small"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                placeholder="Để trống = không hết hạn"
              />
            </div>
            <Button
              type="primary"
              size="small"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleCreate}
              loading={loading}
              className="!bg-sky-500 !border-sky-500"
            >
              Tạo link chia sẻ công khai
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function InviteTab({
  shares,
  loading,
  onInvite,
  onRevoke,
}: {
  shares: ShareRecord[];
  loading: boolean;
  onInvite: (emails: string[], expiresAt?: string) => void;
  onRevoke: (accessId: number) => void;
}) {
  const [emailInput, setEmailInput] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [lastResults] = useState<InviteResult[] | null>(null);

  const privateShares = shares.filter((s) => s.shareType === "private");

  const handleInvite = () => {
    const emails = emailInput
      .split(/[\n,;]/)
      .map((e) => e.trim())
      .filter(Boolean);

    if (emails.length === 0) {
      message.warning("Vui lòng nhập ít nhất 1 địa chỉ email.");
      return;
    }

    if (emails.length > 50) {
      message.warning("Tối đa 50 email mỗi lần gửi.");
      return;
    }

    const expires = expiresAt.trim() || undefined;
    onInvite(emails, expires);
    setEmailInput("");
    setExpiresAt("");
  };

  return (
    <div className="space-y-4">
      {/* Invite form */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">
            Mời qua email
          </span>
        </div>

        <TextArea
          rows={3}
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder="Nhập email, mỗi dòng / dấu phẩy một địa chỉ&#10;Ví dụ:&#10;nguyen@email.com&#10;tran@email.com"
        />

        <div>
          <label className="text-xs text-slate-500 mb-1 block">
            Thời hạn (tùy chọn)
          </label>
          <Input
            size="small"
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            placeholder="Để trống = không hết hạn"
          />
        </div>

        <Button
          type="primary"
          size="small"
          icon={<Mail className="w-3.5 h-3.5" />}
          onClick={handleInvite}
          loading={loading}
          className="!bg-sky-500 !border-sky-500"
        >
          Gửi lời mời
        </Button>
      </div>

      {/* Last invite results */}
      {lastResults && (
        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
          <span className="text-xs font-medium text-slate-600">Kết quả lần gửi gần nhất</span>
          {lastResults.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {r.success ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              )}
              <span className={r.success ? "text-slate-700" : "text-slate-400"}>
                {r.email}
              </span>
              {r.success && r.shareUrl && (
                <CopyButton text={r.shareUrl} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Existing invites */}
      {privateShares.length > 0 && (
        <div>
          <span className="text-xs font-medium text-slate-600">
            Người đã được mời ({privateShares.length})
          </span>
          <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
            {privateShares.map((s) => (
              <div
                key={s.accessId}
                className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {s.user
                      ? `${s.user.firstName} ${s.user.lastName}`
                      : "—"}
                  </p>
                  {s.user?.email && (
                    <p className="text-xs text-slate-400">{s.user.email}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <CopyButton text={s.shareUrl} />
                  <Popconfirm
                    title="Thu hồi quyền truy cập?"
                    onConfirm={() => onRevoke(s.accessId)}
                    okText="Thu hồi"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      size="small"
                      danger
                      type="text"
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                    />
                  </Popconfirm>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const ShareModal: React.FC<ShareModalProps> = ({
  open,
  presentationId,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const { shares, publicShare, loading, inviteLoading, error } =
    useAppSelector((s) => s.share);

  useEffect(() => {
    if (open && presentationId) {
      dispatch(fetchShareList(presentationId));
    }
  }, [open, presentationId, dispatch]);

  useEffect(() => {
    if (error) {
      message.error(error);
      dispatch(clearShareError());
    }
  }, [error, dispatch]);

  const handleCreatePublic = (expiresAt?: string) => {
    dispatch(createPublicShare({ presentationId, expiresAt }));
  };

  const handleRevokePublic = () => {
    dispatch(revokePublicShare(presentationId));
  };

  const handleInvite = (emails: string[], expiresAt?: string) => {
    dispatch(inviteByEmails({ presentationId, emails, expiresAt })).then(
      (action) => {
        if (inviteByEmails.fulfilled.match(action)) {
          const results = action.payload.results;
          const successCount = results.filter((r) => r.success).length;
          message.success(`${successCount}/${results.length} lời mời đã được gửi.`);
          // Refresh list
          dispatch(fetchShareList(presentationId));
        }
      },
    );
  };

  const handleRevokeInvite = (accessId: number) => {
    dispatch(revokeInvite({ presentationId, accessId }));
  };

  const tabItems = [
    {
      key: "public",
      label: (
        <span className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" /> Công khai
        </span>
      ),
      children: (
        <PublicShareTab
          publicShare={publicShare}
          loading={loading}
          onCreate={handleCreatePublic}
          onRevoke={handleRevokePublic}
        />
      ),
    },
    {
      key: "private",
      label: (
        <span className="flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5" /> Mời email
        </span>
      ),
      children: (
        <InviteTab
          shares={shares}
          loading={inviteLoading}
          onInvite={handleInvite}
          onRevoke={handleRevokeInvite}
        />
      ),
    },
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          <span>Chia sẻ bài thuyết trình</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      destroyOnClose
    >
      {loading && shares.length === 0 ? (
        <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Đang tải...</span>
        </div>
      ) : (
        <Tabs items={tabItems} className="share-modal-tabs" />
      )}
    </Modal>
  );
};

export default ShareModal;
