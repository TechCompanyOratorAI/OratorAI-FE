import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "antd";
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  Calendar,
  User,
  FileText,
  Video,
  File,
  Download,
  ExternalLink,
} from "lucide-react";

// Import react-pdf-viewer
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";

// Import styles
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

interface Slide {
  slideId: number;
  slideNumber: number;
  fileName: string;
  filePath: string;
  fileFormat: string;
  fileSizeBytes: number;
  uploadedAt: string;
  updatedAt: string;
  createdAt: string;
}

interface AudioRecord {
  audioId: number;
  fileName: string;
  filePath: string;
  durationSeconds: number | null;
}

interface PresentationPlayerProps {
  slides: Slide[];
  audioRecord: AudioRecord | null;
  title: string;
  description?: string;
  status: string;
  studentName?: string;
  createdAt?: string;
  onResultClick?: () => void;
  resultLoading?: boolean;
}

// Helper to check if file is video
const isVideoFile = (filePath: string): boolean => {
  if (!filePath) return false;
  const videoExtensions = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v"];
  return videoExtensions.some((ext) => filePath.toLowerCase().endsWith(ext));
};

// Helper to check if file is PDF
const isPdfFile = (filePath: string): boolean => {
  if (!filePath) return false;
  return filePath.toLowerCase().endsWith(".pdf");
};

// Helper to check if file is PPTX/PPT
const isPptxFile = (filePath: string): boolean => {
  if (!filePath) return false;
  const lower = filePath.toLowerCase().split("?")[0]; // strip query params
  return lower.endsWith(".pptx") || lower.endsWith(".ppt");
};

// Helper to get file extension
const getFileExtension = (filePath: string): string => {
  if (!filePath) return "FILE";
  const parts = filePath.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "FILE";
};

const PresentationPlayer: React.FC<PresentationPlayerProps> = ({
  slides,
  audioRecord,
  title,
  description,
  status,
  studentName,
  createdAt,
  onResultClick,
  resultLoading = false,
}) => {
  const [pageNumber, setPageNumber] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [activeTab, setActiveTab] = useState<"media" | "slides">("slides");
  // Track which slide file is currently selected for viewing
  const [currentSelectedSlideIndex, setCurrentSelectedSlideIndex] = useState(0);

  const playerRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  // Create default layout plugin for PDF viewer
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  // Reset pageNumber when slides change (new presentation loaded) - always reset to first slide (page 1)
  useEffect(() => {
    if (slides.length > 0) {
      const firstSlide = slides.find((s) => s.slideNumber === 1);
      if (firstSlide) {
        setPageNumber(1);
      } else {
        // Fallback to first available slide
        const firstAvailable = slides[0];
        setPageNumber(firstAvailable.slideNumber);
      }
    }
  }, [slides]);

  // Ensure pageNumber is always valid (between min and max slide numbers)
  useEffect(() => {
    if (slides.length > 0) {
      const slideNumbers = slides.map((s) => s.slideNumber);
      const maxSlideNumber = Math.max(...slideNumbers);
      const minSlideNumber = Math.min(...slideNumbers);

      // Always default to page 1 if within range, otherwise use min
      const targetPage = minSlideNumber <= 1 ? 1 : minSlideNumber;
      if (pageNumber < minSlideNumber || pageNumber > maxSlideNumber) {
        setPageNumber(targetPage);
      }
    }
  }, [slides, pageNumber]);

  // Auto-hide controls
  useEffect(() => {
    if (isPlaying) {
      controlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, showControls]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (isPlaying && controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  const changePage = (offset: number) => {
    const totalPages = slides.length;
    const newPage = Math.min(Math.max(1, pageNumber + offset), totalPages);
    setPageNumber(newPage);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // For PDF files: use currentSelectedSlideIndex to pick which file to view
  // For video slides: use pageNumber to navigate pages within the video
  const currentPdfSlide = slides[currentSelectedSlideIndex];
  const currentSlide =
    slides.find((s) => s.slideNumber === pageNumber) ||
    slides[0] ||
    currentPdfSlide;
  const hasVideo = !!audioRecord?.filePath && isVideoFile(audioRecord.filePath);
  const currentSlideIsVideo =
    currentSlide?.filePath && isVideoFile(currentSlide.filePath);

  // Force reset pageNumber and selected index when component mounts
  useEffect(() => {
    setPageNumber(1);
    setCurrentSelectedSlideIndex(0);
  }, []);

  // Reset selected slide index when slides change
  useEffect(() => {
    if (slides.length > 0) {
      // Make sure currentSelectedSlideIndex is valid
      if (currentSelectedSlideIndex >= slides.length) {
        setCurrentSelectedSlideIndex(0);
      }
      // Reset page number when slides change
      setPageNumber(1);
    }
  }, [slides, currentSelectedSlideIndex]);

  // Render content based on file type
  const renderSlideContent = () => {
    // Check both currentSlide and currentPdfSlide
    if (!currentSlide?.filePath && !currentPdfSlide?.filePath) {
      return (
        <div className="flex flex-col items-center justify-center h-[500px] text-slate-500">
          <File className="w-16 h-16 mb-4" />
          <p>No slide available</p>
        </div>
      );
    }

    // Render PPTX file using Microsoft Office Online Viewer
    if (isPptxFile(currentPdfSlide?.filePath)) {
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(currentPdfSlide.filePath)}`;
      return (
        <div className="relative bg-slate-900 rounded-xl overflow-hidden border border-slate-700" style={{ height: "600px" }}>
          {/* Header bar */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-slate-800/90 backdrop-blur-sm border-b border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span className="text-xs text-slate-300 font-medium">{currentPdfSlide.fileName}</span>
            </div>
            <a
              href={currentPdfSlide.filePath}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-full transition"
            >
              <Download className="w-3 h-3" />
              Tải xuống
            </a>
          </div>
          {/* Office Online iframe */}
          <iframe
            src={officeViewerUrl}
            title={currentPdfSlide.fileName}
            className="w-full h-full border-0"
            style={{ paddingTop: "40px" }}
            allowFullScreen
          />
        </div>
      );
    }

    // Render PDF file using currentPdfSlide
    if (isPdfFile(currentPdfSlide?.filePath)) {
      return (
        <div className="h-[600px] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative">
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            <div className="h-full overflow-auto">
              <Viewer
                fileUrl={currentPdfSlide.filePath}
                initialPage={0}
                onPageChange={(e) => {
                  setPageNumber(e.currentPage + 1);
                }}
                plugins={[defaultLayoutPluginInstance]}
              />
            </div>
          </Worker>
        </div>
      );
    }

    if (currentSlideIsVideo) {
      return (
        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
          <video
            ref={playerRef}
            src={currentSlide.filePath}
            className="w-full h-full"
            controls
            autoPlay={isPlaying}
            onTimeUpdate={(e) => {
              const video = e.currentTarget;
              setDuration(video.duration);
            }}
            onLoadedMetadata={(e) => {
              setDuration(e.currentTarget.duration);
            }}
          />
        </div>
      );
    }

    // Default: Show file info for unknown types
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-slate-500 bg-slate-100 rounded-lg">
        <File className="w-16 h-16 mb-4" />
        <p className="text-lg font-medium">{currentSlide.fileName}</p>
        <p className="text-sm">
          {getFileExtension(currentSlide.filePath)} File
        </p>
        <div className="flex gap-2 mt-4">
          <a
            href={currentSlide.filePath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition"
          >
            <ExternalLink className="w-4 h-4" />
            Open
          </a>
          <a
            href={currentSlide.filePath}
            download
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
        </div>
      </div>
    );
  };

  // Render audio/video player based on file type
  const renderMediaPlayer = () => {
    if (!audioRecord?.filePath) {
      return (
        <div className="flex flex-col items-center justify-center h-[500px] text-slate-500 bg-slate-100 rounded-lg">
          <Video className="w-16 h-16 mb-4" />
          <p>No video recording available</p>
        </div>
      );
    }

    if (isVideoFile(audioRecord.filePath)) {
      return (
        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
          <video
            ref={playerRef}
            src={audioRecord.filePath}
            className="w-full h-full"
            controls
            autoPlay={isPlaying}
            onTimeUpdate={(e) => {
              const video = e.currentTarget;
              setDuration(video.duration);
            }}
            onLoadedMetadata={(e) => {
              setDuration(e.currentTarget.duration);
            }}
          />
        </div>
      );
    }

    // For audio files (not video)
    return (
      <div className="flex flex-col items-center justify-center h-[200px] bg-slate-800 rounded-lg">
        <div className="w-24 h-24 rounded-full bg-sky-500/20 flex items-center justify-center mb-4">
          <Volume2 className="w-12 h-12 text-sky-400" />
        </div>
        <p className="text-white font-medium truncate max-w-md px-4">
          {audioRecord.fileName}
        </p>
        <div className="w-full max-w-md px-4 mt-4">
          <audio
            ref={playerRef as React.LegacyRef<HTMLAudioElement>}
            src={audioRecord.filePath}
            controls
            className="w-full"
          />
        </div>
      </div>
    );
  };

  const hasSlides = slides.length > 0;
  const hasMediaContent = hasVideo || !!audioRecord;

  // Khi không có slide nhưng có media (video/audio), ưu tiên tab media
  useEffect(() => {
    if (!hasSlides && hasMediaContent) {
      setActiveTab("media");
    } else if (hasSlides && !hasMediaContent) {
      setActiveTab("slides");
    }
  }, [hasSlides, hasMediaContent]);

  // Calculate status badge
  const getStatusBadge = () => {
    const statusConfigs: Record<string, { bg: string; text: string }> = {
      draft: { bg: "bg-slate-100 text-slate-700", text: "Nháp" },
      submitted: { bg: "bg-sky-100 text-sky-700", text: "Đã nộp" },
      processing: { bg: "bg-amber-100 text-amber-700", text: "Đang xử lý" },
      analyzed: { bg: "bg-emerald-100 text-emerald-700", text: "Đã chấm" },
      done: { bg: "bg-emerald-100 text-emerald-700", text: "Hoàn thành" },
      failed: { bg: "bg-red-100 text-red-700", text: "Thất bại" },
    };
    return statusConfigs[status.toLowerCase()] || statusConfigs.draft;
  };

  const statusBadge = getStatusBadge();

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-3xl border border-slate-200 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
            {description && (
              <p className="text-slate-400 mt-1 text-sm sm:text-base">
                {description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-400">
              {studentName && (
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{studentName}</span>
                </div>
              )}
              {createdAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(createdAt).toLocaleDateString("vi-VN")}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>{slides.length} slide</span>
              </div>
              {audioRecord && (
                <div className="flex items-center gap-1">
                  <Video className="w-4 h-4" />
                  <span>{formatTime(duration)}</span>
                </div>
              )}
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.bg}`}
          >
            {statusBadge.text}
          </span>
        </div>
      </div>

      {/* Tabs cho media và slides (chỉ hiển thị khi vừa có slide vừa có media) */}
      {hasMediaContent && hasSlides && (
        <div className="border-b border-slate-200">
          <div className="flex items-center justify-between gap-4 px-4">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("slides")}
                className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "slides"
                    ? "border-sky-500 text-sky-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Slide ({slides.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab("media")}
                className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "media"
                    ? "border-sky-500 text-sky-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Video ghi hình
                </div>
              </button>
            </div>

            {onResultClick && status === "done" && (
              <Button
                type="primary"
                icon={<FileText className="h-4 w-4" />}
                onClick={onResultClick}
                loading={resultLoading}
              >
                {resultLoading ? "Đang tải..." : "Kết quả"}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Player Container */}
      <div className="relative bg-slate-950">
        <div className="flex flex-col">
          {/* Content Section */}
          <div className="p-4">
            {hasSlides && (!hasMediaContent || activeTab === "slides") && (
              <div className="mb-4">{renderSlideContent()}</div>
            )}
            {hasMediaContent && (!hasSlides || activeTab === "media") && (
              <div className="mb-4">{renderMediaPlayer()}</div>
            )}
          </div>

          {/* Slides Sidebar - chỉ hiển thị khi có slide và đang xem slides */}
          {hasSlides && (!hasMediaContent || activeTab === "slides") ? (
            <div className="bg-slate-800 border-t border-slate-700">
              <div className="p-4 border-b border-slate-700">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Slide ({slides.length})
                </h3>
              </div>
              <div className="flex overflow-x-auto p-4 gap-3 max-h-[200px]">
                {slides.map((slide, index) => {
                  const slideIsVideo = isVideoFile(slide.filePath);
                  const slideIsPdf = isPdfFile(slide.filePath);
                  const slideIsPptx = isPptxFile(slide.filePath);
                  const isSelected = slideIsPdf || slideIsPptx
                    ? index === currentSelectedSlideIndex
                    : pageNumber === slide.slideNumber;
                  return (
                    <button
                      key={slide.slideId}
                      onClick={() => {
                        if (slideIsPdf || slideIsPptx) {
                          // For PDF/PPTX files, switch to that file by index
                          setCurrentSelectedSlideIndex(index);
                        } else {
                          // For video slides, navigate by pageNumber
                          setPageNumber(slide.slideNumber);
                        }
                        setActiveTab("slides");
                        if (slideIsVideo) {
                          setIsPlaying(false);
                        }
                      }}
                      className={`flex-shrink-0 w-40 p-2 rounded-lg border-2 transition ${
                        isSelected
                          ? "border-sky-500 bg-sky-500/10"
                          : "border-slate-600 hover:border-slate-500 bg-slate-700/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                            isSelected
                              ? "bg-sky-500 text-white"
                              : "bg-slate-600 text-slate-300"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <div className="flex-1 text-left min-w-0">
                          <span className="text-white text-xs truncate block">
                            {slide.fileName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {slideIsVideo
                              ? "Video"
                              : slideIsPdf
                                ? "PDF"
                                : isPptxFile(slide.filePath)
                                  ? "PPTX"
                                  : getFileExtension(slide.filePath)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-slate-100 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Show file counter for PDF files */}
          {isPdfFile(currentPdfSlide?.filePath) ? (
            <span className="text-slate-700 font-medium">
              File {currentSelectedSlideIndex + 1} / {slides.length}
            </span>
          ) : currentSlideIsVideo ? (
            <>
              <button
                onClick={() => changePage(-1)}
                disabled={pageNumber <= 1}
                className="p-2 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-50 transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-slate-700 font-medium min-w-[100px] text-center">
                Slide {pageNumber} / {slides.length}
              </span>
              <button
                onClick={() => changePage(1)}
                disabled={pageNumber >= slides.length}
                className="p-2 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-50 transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          ) : (
            <span className="text-slate-500 text-sm">
              Use the toolbar below to navigate
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">
            {currentPdfSlide?.fileName || currentSlide?.fileName}
          </span>
          <button
            onClick={() => {
              setPageNumber(1);
              if (playerRef.current instanceof HTMLVideoElement) {
                playerRef.current.currentTime = 0;
              }
              setIsPlaying(false);
            }}
            className="text-sm text-slate-600 hover:text-slate-900 font-medium"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default PresentationPlayer;
