import React, { useState } from "react";
import Button from "@/components/yoodli/Button";
import SidebarAdmin from "@/components/Sidebar/SidebarAdmin/SidebarAdmin";
import {
  Share2,
  Download,
  Play,
  Pause,
  Volume2,
  Search,
  Sparkles,
  Info,
  FileText,
} from "lucide-react";
import { Progress } from "antd";

interface TranscriptEntry {
  timestamp: string;
  text: string;
  highlights?: {
    type: "filler" | "key-point";
    word: string;
    start: number;
    end: number;
  }[];
}

const PresentationAnalysisPage: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime] = useState(192); // 03:12 in seconds
  const [searchQuery, setSearchQuery] = useState("");

  const transcriptEntries: TranscriptEntry[] = [
    {
      timestamp: "02:45",
      text: "The initial phase of star formation begins in giant molecular clouds. These clouds are cold and dense, consisting mainly of molecular hydrogen.",
    },
    {
      timestamp: "03:12",
      text: "So, um, looking at this chart, we can see a significant rise in temperature as the core collapses. This is where the protostar begins to take shape.",
      highlights: [
        {
          type: "filler",
          word: "um",
          start: 4,
          end: 6,
        },
        {
          type: "key-point",
          word: "protostar",
          start: 90,
          end: 99,
        },
      ],
    },
    {
      timestamp: "03:45",
      text: "It's important to note that this process can take millions of years depending on the initial mass of the cloud fragment.",
    },
    {
      timestamp: "04:10",
      text: "Next, we'll examine the main sequence phase, which is the longest period in a star's life.",
    },
  ];

  const renderTranscriptText = (entry: TranscriptEntry) => {
    if (!entry.highlights || entry.highlights.length === 0) {
      return <p className="text-sm text-gray-700 leading-relaxed">{entry.text}</p>;
    }

    let lastIndex = 0;
    const parts: React.ReactNode[] = [];

    entry.highlights.forEach((highlight, index) => {
      // Add text before highlight
      if (highlight.start > lastIndex) {
        parts.push(
          <span key={`text-${index}`}>
            {entry.text.substring(lastIndex, highlight.start)}
          </span>
        );
      }

      // Add highlighted text
      parts.push(
        <span
          key={`highlight-${index}`}
          className={`px-1 rounded ${highlight.type === "filler"
              ? "bg-yellow-200 text-yellow-900"
              : "bg-blue-100 text-blue-900"
            }`}
        >
          {entry.text.substring(highlight.start, highlight.end)}
        </span>
      );

      lastIndex = highlight.end;
    });

    // Add remaining text
    if (lastIndex < entry.text.length) {
      parts.push(
        <span key="text-end">{entry.text.substring(lastIndex)}</span>
      );
    }

    return <p className="text-sm text-gray-700 leading-relaxed">{parts}</p>;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const totalDuration = 942; // 15:42 in seconds
  const progress = (currentTime / totalDuration) * 100;

  // Waveform data (simplified)
  const waveformHeights = [
    19, 32, 45, 26, 38, 54, 58, 29, 19, 13, 38, 61, 32, 26, 16, 19, 29, 26,
    38, 13, 22, 35, 48, 16, 22, 42, 16, 22, 29, 19, 13, 16, 26, 32, 42, 29,
    19,
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <SidebarAdmin activeItem="analysis-logs" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-4 overflow-x-auto">
            <a href="#" className="hover:text-gray-900 whitespace-nowrap">
              Sinh viên
            </a>
            <span>/</span>
            <a href="#" className="hover:text-gray-900 whitespace-nowrap">
              Sarah Jenkins
            </a>
            <span>/</span>
            <span className="text-gray-900 whitespace-nowrap">Phân tích bài thuyết trình</span>
          </div>

          {/* Title and Actions */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                Introduction to Astrophysics
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                Ghi hình ngày Oct 24, 2023 • Thời lượng: 15:42
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                text="Chia sẻ"
                variant="secondary"
                fontSize="14px"
                borderRadius="8px"
                paddingWidth="17px"
                paddingHeight="8px"
                icon={<Share2 className="w-5 h-5" />}
                iconPosition="left"
                onClick={() => { }}
              />
              <Button
                text="Xuất báo cáo"
                variant="primary"
                fontSize="14px"
                borderRadius="8px"
                paddingWidth="16px"
                paddingHeight="8px"
                icon={<Download className="w-5 h-5" />}
                iconPosition="left"
                onClick={() => { }}
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="max-w-[1400px] mx-auto">
            {/* Video and Transcript Section */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_569px] xl:grid-cols-[807px_569px] gap-6 mb-6">
              {/* Video Player */}
              <div className="space-y-6">
                {/* Video Display */}
                <div className="bg-gray-900 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                  <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                        <Play className="w-8 h-8 ml-1" />
                      </div>
                      <p className="text-sm">Trình phát video</p>
                    </div>
                  </div>
                </div>

                {/* Audio Sync Controls */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Đồng bộ âm thanh
                    </span>
                    <span className="text-xs text-gray-600">Tốc độ: 1.0x</span>
                  </div>

                  {/* Waveform */}
                  <div className="flex items-end justify-start gap-1.5 h-16 mb-4">
                    {waveformHeights.map((height, index) => (
                      <div
                        key={index}
                        className="w-1 bg-gray-300 rounded-full"
                        style={{ height: `${height}px` }}
                      ></div>
                    ))}
                  </div>

                  {/* Playback Controls */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 text-gray-700" />
                      ) : (
                        <Play className="w-6 h-6 text-gray-700 ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="h-1.5 bg-gray-200 rounded-full mb-1">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(totalDuration)}</span>
                      </div>
                    </div>
                    <button className="w-8 h-8 flex items-center justify-center">
                      <Volume2 className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Transcript */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                {/* Transcript Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <FileText className="w-6 h-6 text-gray-700" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Bản chép lời
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Đang đồng bộ</span>
                  </div>
                </div>

                {/* Search */}
                <div className="p-5 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm trong bản chép lời..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Transcript Entries */}
                <div className="p-4 space-y-6 max-h-[465px] overflow-y-auto">
                  {transcriptEntries.map((entry, index) => (
                    <div
                      key={index}
                      className={`${entry.timestamp === "03:12"
                          ? "bg-blue-50 border-l-4 border-blue-500 p-4 rounded"
                          : ""
                        }`}
                    >
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        {entry.timestamp}
                      </p>
                      {renderTranscriptText(entry)}
                      {entry.highlights && entry.highlights.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {entry.highlights.map((highlight, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-1 rounded text-xs font-medium ${highlight.type === "filler"
                                  ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                  : "bg-blue-100 text-blue-800 border border-blue-200"
                                }`}
                            >
                              {highlight.type === "filler"
                                ? "Từ đệm"
                                : "Ý chính"}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Analysis & Insights */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-6 h-6 text-gray-700" />
                <h2 className="text-xl font-bold text-gray-900">
                  Phân tích và nhận định AI
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Executive Summary */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">
                    Tóm tắt điều hành
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed mb-4">
                    Người trình bày thể hiện kiến thức chuyên môn tốt nhưng dùng
                    khá nhiều từ đệm ở phần thứ hai. Tài liệu trực quan được sử dụng
                    phù hợp, tuy nhiên tốc độ trình bày giảm đáng kể
                    khi giải thích phương pháp.
                  </p>
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">
                      Độ tin cậy: Cao
                    </span>
                  </div>
                </div>

                {/* Relevance Score */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-semibold text-gray-900">
                      Điểm mức độ phù hợp
                    </h4>
                    <Info className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="relative w-32 h-32 mb-4">
                      <Progress
                        type="circle"
                        percent={85}
                        strokeColor={{
                          "0%": "#0ea5e9",
                          "100%": "#6366f1",
                        }}
                        size={128}
                        format={() => (
                          <div className="text-center">
                            <div className="text-3xl font-bold text-gray-900">
                              85
                            </div>
                            <div className="text-xs text-gray-500">
                              trên thang 100
                            </div>
                          </div>
                        )}
                      />
                    </div>
                    <p className="text-sm font-medium text-blue-600">
                      Mức độ phù hợp cao
                    </p>
                  </div>
                </div>

                {/* Speaking Pace */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-semibold text-gray-900">
                      Tốc độ nói
                    </h4>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      Tối ưu
                    </span>
                  </div>
                  <div className="space-y-4">
                    {/* Bar Chart */}
                    <div className="flex items-end justify-between h-24 gap-1">
                      {[34, 52, 56, 43, 39].map((height, index) => (
                        <div
                          key={index}
                          className="flex-1 bg-gradient-to-t from-sky-500 to-indigo-500 rounded-t"
                          style={{ height: `${height}%` }}
                        ></div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Đầu</span>
                      <span className="font-medium">130 từ/phút TB</span>
                      <span>Cuối</span>
                    </div>
                  </div>
                </div>

                {/* Clarity & Tone */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-semibold text-gray-900">
                      Độ rõ ràng và giọng điệu
                    </h4>
                    <Info className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="space-y-4">
                    {/* Clarity */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">Độ rõ ràng</span>
                        <span className="text-gray-900 font-medium">92%</span>
                      </div>
                      <Progress
                        percent={92}
                        strokeColor={{
                          "0%": "#0ea5e9",
                          "100%": "#6366f1",
                        }}
                        showInfo={false}
                      />
                    </div>

                    {/* Formality */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">Mức trang trọng</span>
                        <span className="text-gray-900 font-medium">78%</span>
                      </div>
                      <Progress
                        percent={78}
                        strokeColor={{
                          "0%": "#0ea5e9",
                          "100%": "#6366f1",
                        }}
                        showInfo={false}
                      />
                    </div>

                    {/* Engagement */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">Mức độ thu hút</span>
                        <span className="text-gray-900 font-medium">65%</span>
                      </div>
                      <Progress
                        percent={65}
                        strokeColor={{
                          "0%": "#0ea5e9",
                          "100%": "#6366f1",
                        }}
                        showInfo={false}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PresentationAnalysisPage;

