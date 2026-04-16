import React, { useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  XCircle,
  Clock,
  LayoutList,
  Mic,
  BrainCircuit,
  FileBarChart2,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchPresentationProgress } from "@/services/features/presentation/presentationSlice";
import { useSocket } from "@/hooks/useSocket";
import type { ProgressStep } from "@/services/features/presentation/presentationSlice";

interface PresentationProgressTrackerProps {
  presentationId: number;
  /** Poll interval in ms. Default 0 = chỉ gọi khi vào trang và khi bấm làm mới. */
  pollInterval?: number;
  /** Enable WebSocket real-time updates. Default true. */
  useWebSocket?: boolean;
  onCompleted?: () => void;
  onFailed?: (error?: string) => void;
}

// ── Payload types from WebSocket events ──────────────────────────────────────
interface JobEventPayload {
  presentationId: number;
  jobType?: string;
  jobId?: number;
  progress?: number;
  status?: string;
  error?: string;
  message?: string;
  _ts?: number;
}

// ── Icon & color map ──────────────────────────────────────────────────────────
const stepIcons: Record<string, React.ReactNode> = {
  slides: <LayoutList className="w-4 h-4" />,
  asr: <Mic className="w-4 h-4" />,
  semantic: <BrainCircuit className="w-4 h-4" />,
  report: <FileBarChart2 className="w-4 h-4" />,
};

const stepColors = {
  completed: { ring: "border-emerald-500", icon: "bg-emerald-500 text-white", text: "text-emerald-700", bar: "bg-emerald-500" },
  processing: { ring: "border-sky-500", icon: "bg-sky-500 text-white", text: "text-sky-700", bar: "bg-sky-500" },
  failed: { ring: "border-red-500", icon: "bg-red-100 text-red-600", text: "text-red-700", bar: "bg-red-500" },
  pending: { ring: "border-slate-300", icon: "bg-slate-100 text-slate-400", text: "text-slate-500", bar: "bg-slate-200" },
};

// ── Step icon helper ──────────────────────────────────────────────────────────
function StepIcon({ step }: { step: ProgressStep }) {
  if (step.status === "completed") return <CheckCircle2 className="w-4 h-4" />;
  if (step.status === "processing") return <Loader2 className="w-4 h-4 animate-spin" />;
  if (step.status === "failed") return <XCircle className="w-4 h-4" />;
  return stepIcons[step.type] ?? <Clock className="w-4 h-4" />;
}

// ── Formatters ────────────────────────────────────────────────────────────────
function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  if (seconds < 60) return `~${seconds}s`;
  return `~${Math.ceil(seconds / 60)}p`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ── Component ─────────────────────────────────────────────────────────────────
const PresentationProgressTracker: React.FC<PresentationProgressTrackerProps> = ({
  presentationId,
  pollInterval = 0,
  useWebSocket = true,
  onCompleted,
  onFailed,
}) => {
  const dispatch = useAppDispatch();
  const { progress, progressLoading } = useAppSelector((s) => s.presentation);
  const { socket, connected } = useSocket();

  const onCompletedCalled = useRef(false);
  const onFailedCalled = useRef(false);

  // Refs for setInterval closure (avoid stale state)
  const overallStatusRef = useRef(progress?.overallStatus);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  overallStatusRef.current = progress?.overallStatus;

  // ── Fetch progress from API ────────────────────────────────────────────────
  const fetch = useCallback(() => {
    dispatch(fetchPresentationProgress(presentationId));
  }, [dispatch, presentationId]);

  // ── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch();
  }, [fetch]);

  // ── WebSocket real-time updates ───────────────────────────────────────────
  useEffect(() => {
    if (!useWebSocket) return;

    console.log(`[ProgressTracker] useWebSocket=true, presentationId=${presentationId}, socket connected=${socket.isConnected()}`);

    // Join the presentation room so we receive events for this presentation
    socket.joinPresentation(presentationId);

    const handleJobStarted = (_data: unknown) => {
      const data = _data as JobEventPayload;
      console.log(`[ProgressTracker] ★ RECEIVED "presentation:job:started"`, data);
      if (data.presentationId === presentationId) fetch();
    };

    const handleJobProgress = (_data: unknown) => {
      const data = _data as JobEventPayload;
      console.log(`[ProgressTracker] ★ RECEIVED "presentation:job:progress"`, data);
      if (data.presentationId === presentationId) fetch();
    };

    const handleJobFailed = (_data: unknown) => {
      const data = _data as JobEventPayload;
      console.log(`[ProgressTracker] ★ RECEIVED "presentation:job:failed"`, data);
      if (data.presentationId === presentationId) {
        fetch();
        if (!onFailedCalled.current && onFailed) {
          onFailedCalled.current = true;
          onFailed(data.error);
        }
      }
    };

    const handleJobCompleted = (_data: unknown) => {
      const data = _data as JobEventPayload;
      console.log(`[ProgressTracker] ★ RECEIVED "presentation:job:completed"`, data);
      if (data.presentationId === presentationId) fetch();
    };

    console.log(`[ProgressTracker] Registering socket listeners for "presentation:job:*" events`);
    socket.on("presentation:job:started", handleJobStarted);
    socket.on("presentation:job:progress", handleJobProgress);
    socket.on("presentation:job:completed", handleJobCompleted);
    socket.on("presentation:job:failed", handleJobFailed);

    return () => {
      socket.leavePresentation(presentationId);
      socket.off("presentation:job:started", handleJobStarted);
      socket.off("presentation:job:progress", handleJobProgress);
      socket.off("presentation:job:completed", handleJobCompleted);
      socket.off("presentation:job:failed", handleJobFailed);
    };
  }, [useWebSocket, socket, presentationId, fetch, onFailed]);

  // ── Fallback polling when WebSocket not enabled / disconnected ─────────────
  useEffect(() => {
    // Only start polling if WebSocket is disabled or not connected
    const shouldPoll = pollInterval > 0 && (!useWebSocket || !connected);

    if (!shouldPoll) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    pollTimerRef.current = setInterval(() => {
      const status = overallStatusRef.current;
      if (status === "completed" || status === "failed") {
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
        return;
      }
      fetch();
    }, pollInterval);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [pollInterval, useWebSocket, connected, fetch]);

  // ── Notify parent: completed ────────────────────────────────────────────────
  useEffect(() => {
    if (
      progress?.overallStatus === "completed" &&
      !onCompletedCalled.current &&
      onCompleted
    ) {
      onCompletedCalled.current = true;
      onCompleted();
    }
  }, [progress?.overallStatus, onCompleted]);

  // ── Loading state ───────────────────────────────────────────────────────────
  if (!progress && progressLoading) {
    return (
      <div className="flex items-center justify-center py-10 gap-3 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-sky-500" />
        <span className="text-sm">Đang tải tiến độ xử lý...</span>
      </div>
    );
  }

  if (!progress) return null;

  const isCompleted = progress.overallStatus === "completed";
  const isFailed = progress.overallStatus === "failed";
  const showPolling = pollInterval > 0 && (!useWebSocket || !connected);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm"
    >
      {/* ── Header ── */}
      <div
        className={`px-5 py-4 flex items-center justify-between ${
          isCompleted
            ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100"
            : isFailed
            ? "bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-100"
            : "bg-gradient-to-r from-sky-50 to-indigo-50 border-b border-sky-100"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isCompleted ? "bg-emerald-100" : isFailed ? "bg-red-100" : "bg-sky-100"
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : isFailed ? (
              <XCircle className="w-5 h-5 text-red-600" />
            ) : (
              <Loader2 className="w-5 h-5 text-sky-600 animate-spin" />
            )}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">
              {isCompleted ? "Xử lý hoàn tất" : isFailed ? "Xử lý thất bại" : "Đang xử lý AI..."}
            </p>
            <p className="text-xs text-slate-500">
              {progress.completedSteps}/{progress.totalSteps} bước hoàn thành
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Overall % */}
          <span
            className={`text-2xl font-bold ${
              isCompleted ? "text-emerald-600" : isFailed ? "text-red-600" : "text-sky-600"
            }`}
          >
            {progress.overallProgress}%
          </span>
          {/* Manual refresh */}
          <button
            onClick={fetch}
            disabled={progressLoading}
            className="p-1.5 rounded-lg hover:bg-white/60 transition text-slate-400 hover:text-slate-600 disabled:opacity-40"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${progressLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Overall progress bar ── */}
      <div className="h-1.5 bg-slate-100">
        <motion.div
          className={`h-full ${isCompleted ? "bg-emerald-500" : isFailed ? "bg-red-500" : "bg-sky-500"}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress.overallProgress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {/* ── Steps ── */}
      <div className="p-5 space-y-4">
        {progress.steps.map((step, index) => {
          const colors = stepColors[step.status] ?? stepColors.pending;
          const isLast = index === progress.steps.length - 1;

          return (
            <div key={step.type} className="flex gap-4">
              {/* Icon + connector */}
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.08 }}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${colors.ring} ${colors.icon}`}
                >
                  <StepIcon step={step} />
                </motion.div>
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 mt-1 ${
                      step.status === "completed" ? "bg-emerald-300" : "bg-slate-200"
                    }`}
                    style={{ minHeight: "20px" }}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div>
                    <span className={`text-sm font-semibold ${colors.text}`}>{step.name}</span>
                    {step.estimatedDuration && step.status === "pending" && (
                      <span className="ml-2 text-xs text-slate-400">{formatDuration(step.estimatedDuration)}</span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      step.status === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : step.status === "processing"
                        ? "bg-sky-100 text-sky-700"
                        : step.status === "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {step.status === "completed"
                      ? "Hoàn thành"
                      : step.status === "processing"
                      ? "Đang xử lý"
                      : step.status === "failed"
                      ? "Thất bại"
                      : "Chờ"}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                  <motion.div
                    className={`h-full rounded-full ${colors.bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${step.progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.06 }}
                  />
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-400">
                  {step.completedAt && <span>✓ {formatDate(step.completedAt)}</span>}
                  {step.retryCount > 0 && <span className="text-amber-500">↺ Thử lại {step.retryCount} lần</span>}
                  {step.errorMessage && <span className="text-red-500">{step.errorMessage}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer: connection status ── */}
      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
        <span className="text-xs text-slate-400">Cập nhật: {formatDate(progress.lastUpdated)}</span>

        {useWebSocket && (
          <AnimatePresence>
            <motion.span
              key="ws-status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-xs flex items-center gap-1 ${
                connected ? "text-emerald-500" : "text-slate-400"
              }`}
            >
              {connected ? (
                <>
                  <Wifi className="w-3 h-3" />
                  Real-time
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  Đang kết nối...
                </>
              )}
            </motion.span>
          </AnimatePresence>
        )}

        {!isCompleted && !isFailed && showPolling && (
          <span className="text-xs text-sky-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse inline-block" />
            Cập nhật mỗi {pollInterval / 1000}s
          </span>
        )}

        {!isCompleted && !isFailed && !useWebSocket && pollInterval <= 0 && (
          <span className="text-xs text-slate-500">Nhấn nút làm mới để cập nhật</span>
        )}
      </div>
    </motion.div>
  );
};

export default PresentationProgressTracker;
