import React, { useState } from "react";
import SidebarStudent from "@/components/Sidebar/SidebarStudent/SidebarStudent";
import Button from "@/components/yoodli/Button";
import {
  Download,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  FileText,
  Sparkles,
  BookOpen,
  Search,
  Clock,
  Edit,
  Trash2,
  Link as LinkIcon,
  Save,
  Send,
  Bold,
  Italic,
  Underline,
  MessageSquare,
} from "lucide-react";
import { Progress, Slider, Checkbox } from "antd";

interface FeedbackEntry {
  id: string;
  timestamp: string;
  text: string;
}

const FeedbackPage: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime] = useState(315); // 5:15 in seconds
  const [totalDuration] = useState(900); // 15:00 in seconds
  const [activeTab, setActiveTab] = useState("transcript");
  const [searchQuery, setSearchQuery] = useState("");
  const [contentClarityScore, setContentClarityScore] = useState(8);
  const [visualAidsLevel, setVisualAidsLevel] = useState<"low" | "med" | "high">("med");
  const [syncWithVideo, setSyncWithVideo] = useState(true);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([
    {
      id: "1",
      timestamp: "02:14",
      text: "Excellent point made here about the market trends. Your voice modulation really emphasized the importance of this statistic.",
    },
    {
      id: "2",
      timestamp: "04:30",
      text: "Slight hesitation here. Try to maintain eye contact with the camera instead of looking at your notes.",
    },
  ]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = (currentTime / totalDuration) * 100;

  const transcriptEntries = [
    {
      timestamp: "05:12",
      text: "This chart clearly demonstrates the velocity of change in the current market. As you can see by the upward trend in Q3...",
    },
    {
      timestamp: "05:24",
      text: "However, we must consider the emerging competitors entering the space with lower overhead costs.",
    },
    {
      timestamp: "05:45",
      text: "Umm, basically, the strategy needs to pivot towards retention rather than just acquisition.",
      hasFiller: true,
    },
    {
      timestamp: "06:10",
      text: "Moving on to the demographic shifts we are seeing in the western region, specifically.",
    },
  ];

  const handleAddFeedback = () => {
    if (feedbackText.trim()) {
      const newEntry: FeedbackEntry = {
        id: Date.now().toString(),
        timestamp: formatTime(currentTime),
        text: feedbackText,
      };
      setFeedbackEntries([...feedbackEntries, newEntry]);
      setFeedbackText("");
    }
  };

  const handleLinkTimestamp = () => {
    setFeedbackText((prev) => {
      const timestamp = formatTime(currentTime);
      return prev ? `${prev} [${timestamp}]` : `[${timestamp}] `;
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarStudent activeItem="feedback" />
      <main className="flex-1 overflow-y-auto lg:ml-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">
                  MKT-101
                </span>
                <span className="text-sm text-gray-600">
                  Submitted Oct 24, 2023
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Sarah Jenkins - Marketing Strategy 101
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>15 min duration</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="text-left sm:text-right">
                <p className="text-xs text-gray-600 mb-1">AI Analysis Score</p>
                <div className="flex items-center gap-3">
                  <Progress
                    percent={85}
                    showInfo={false}
                    strokeColor={{
                      "0%": "#10b981",
                      "100%": "#10b981",
                    }}
                    className="w-20 sm:w-24"
                  />
                  <span className="text-xl sm:text-2xl font-bold text-gray-900">85/100</span>
                </div>
              </div>
              <div className="w-full sm:w-auto">
                <Button
                  text="Export Report"
                  variant="secondary"
                  icon={<Download className="w-5 h-5" />}
                  iconPosition="left"
                  fontSize="16px"
                  paddingWidth="17px"
                  paddingHeight="8px"
                  borderRadius="8px"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_621px] gap-6">
            {/* Left Column - Video & Transcript */}
            <div className="space-y-6">
              {/* Video Player */}
              <div className="bg-gray-900 rounded-lg overflow-hidden relative">
                <div className="aspect-video bg-gray-800 flex items-center justify-center">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-16 h-16 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-9 h-9 text-white" />
                    ) : (
                      <Play className="w-9 h-9 text-white ml-1" />
                    )}
                  </button>
                </div>
                {/* Progress Bar */}
                <div className="bg-gray-700 px-4 py-4">
                  <div className="h-1.5 bg-gray-600 rounded-full mb-3 relative">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg"
                      style={{ left: `${progress}%` }}
                    />
                  </div>
                  {/* Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button className="w-6 h-6 flex items-center justify-center text-white hover:text-gray-300">
                        <SkipBack className="w-5 h-5" />
                      </button>
                      <button className="w-6 h-6 flex items-center justify-center text-white hover:text-gray-300">
                        <SkipForward className="w-5 h-5" />
                      </button>
                      <span className="text-sm text-white">
                        {formatTime(currentTime)} / {formatTime(totalDuration)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="w-6 h-6 flex items-center justify-center text-white hover:text-gray-300">
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="flex border-b border-gray-200 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab("transcript")}
                    className={`flex items-center gap-2 px-4 sm:px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === "transcript"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    Transcript
                  </button>
                  <button
                    onClick={() => setActiveTab("insights")}
                    className={`flex items-center gap-2 px-4 sm:px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === "insights"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Sparkles className="w-5 h-5" />
                    AI Insights
                  </button>
                  <button
                    onClick={() => setActiveTab("resources")}
                    className={`flex items-center gap-2 px-4 sm:px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === "resources"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <BookOpen className="w-5 h-5" />
                    Resources
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === "transcript" && (
                    <div>
                      {/* Search */}
                      <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search transcript..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Transcript Entries */}
                      <div className="space-y-6">
                        {transcriptEntries.map((entry, index) => (
                          <div
                            key={index}
                            className={`${
                              entry.hasFiller
                                ? "bg-blue-50 border-l-4 border-blue-500 p-4 rounded"
                                : ""
                            }`}
                          >
                            <p className="text-xs font-medium text-gray-500 mb-2">
                              {entry.timestamp}
                            </p>
                            <p className="text-sm text-gray-900">
                              {entry.hasFiller ? (
                                <>
                                  <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                                    {entry.text.split(",")[0]}
                                  </span>
                                  <span>{entry.text.substring(entry.text.indexOf(","))}</span>
                                </>
                              ) : (
                                entry.text
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "insights" && (
                    <div className="text-center py-12 text-gray-500">
                      AI Insights content coming soon...
                    </div>
                  )}

                  {activeTab === "resources" && (
                    <div className="text-center py-12 text-gray-500">
                      Resources content coming soon...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Grading & Feedback */}
            <div className="space-y-6">
              {/* Grading Rubric */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Grading Rubric
                  </h3>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">
                    2/5 Completed
                  </span>
                </div>

                <div className="space-y-6">
                  {/* Content Clarity & Depth */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Content Clarity & Depth
                      </label>
                      <span className="text-sm font-medium text-gray-900">
                        {contentClarityScore}/10
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>Poor</span>
                      <span>Excellent</span>
                    </div>
                    <Slider
                      value={contentClarityScore}
                      onChange={setContentClarityScore}
                      min={0}
                      max={10}
                      marks={{ 0: "0", 10: "10" }}
                    />
                  </div>

                  {/* Delivery & Pacing */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Delivery & Pacing
                      </label>
                      <span className="text-sm text-gray-500">--/10</span>
                    </div>
                    <Slider
                      value={0}
                      disabled
                      min={0}
                      max={10}
                      marks={{ 0: "0", 10: "10" }}
                    />
                  </div>

                  {/* Visual Aids */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-medium text-gray-700">
                        Visual Aids
                      </label>
                      <span className="text-sm text-gray-500">--/10</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setVisualAidsLevel("low")}
                        className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
                          visualAidsLevel === "low"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Low
                      </button>
                      <button
                        onClick={() => setVisualAidsLevel("med")}
                        className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
                          visualAidsLevel === "med"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Med
                      </button>
                      <button
                        onClick={() => setVisualAidsLevel("high")}
                        className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
                          visualAidsLevel === "high"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        High
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback Log */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-gray-700" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Feedback Log
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={syncWithVideo}
                      onChange={(e) => setSyncWithVideo(e.target.checked)}
                    >
                      <span className="text-sm text-gray-700">Sync with video</span>
                    </Checkbox>
                  </div>
                </div>

                {/* Existing Feedback Entries */}
                <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto">
                  {feedbackEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="border border-gray-200 rounded-lg p-4 relative"
                    >
                      <div className="absolute left-0 top-4 w-2 h-full bg-blue-500 rounded-l-lg" />
                      <div className="ml-4">
                        <div className="flex items-center justify-between mb-2">
                          <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                            <Clock className="w-3.5 h-3.5" />
                            {entry.timestamp}
                          </button>
                          <div className="flex items-center gap-2">
                            <button className="w-4 h-4 text-gray-400 hover:text-gray-600">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="w-4 h-4 text-gray-400 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-900">{entry.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Feedback Section */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-900">
                      Add Feedback
                    </h4>
                    <button
                      onClick={handleLinkTimestamp}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      Link timestamp ({formatTime(currentTime)})
                    </button>
                  </div>

                  {/* Textarea */}
                  <div className="relative mb-4">
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Type your feedback here..."
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    {/* Formatting Tools */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1">
                      <button className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded">
                        <Bold className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded">
                        <Italic className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded">
                        <Underline className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Autosaved 2m ago</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        text="Save Draft"
                        variant="secondary"
                        fontSize="14px"
                        paddingWidth="16px"
                        paddingHeight="8px"
                        borderRadius="6px"
                        icon={<Save className="w-4 h-4" />}
                        iconPosition="left"
                      />
                      <Button
                        text="Publish Feedback"
                        variant="primary"
                        fontSize="14px"
                        paddingWidth="16px"
                        paddingHeight="8px"
                        borderRadius="6px"
                        icon={<Send className="w-4 h-4" />}
                        iconPosition="right"
                        onClick={handleAddFeedback}
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

export default FeedbackPage;

