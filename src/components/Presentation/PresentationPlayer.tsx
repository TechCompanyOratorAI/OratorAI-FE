import React, { useState, useRef, useEffect, useCallback } from "react";
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
  /** Hide the top header bar (useful when parent already renders a hero/title section). Default: true. */
  showHeader?: boolean;
  /** Called each animation frame while audio/video is playing, with current playback time in seconds. */
  onTimeUpdate?: (currentTime: number) => void;
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

// SVG Icons matching Coursera style
const PlayIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M7 14.12V5.88c0-.226.076-.408.228-.547a.762.762 0 01.531-.208c.063 0 .13.01.2.031.069.021.136.051.201.091l6.36 4.128a.804.804 0 01.261.277.703.703 0 010 .703.748.748 0 01-.26.27l-6.361 4.13a.796.796 0 01-.41.12c-.2 0-.375-.07-.525-.208A.71.71 0 017 14.12zm1.5-1.37L12.75 10 8.5 7.25v5.5z"
      fill="white"
    />
  </svg>
);

const PauseIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
  >
    <path d="M6 15V5h2.5v10H6zm5.5 0V5H14v10h-2.5z" fill="white" />
  </svg>
);

const VolumeOnIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 28 28"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M3.5 11v6h4.5l5.5 5V6L8 11H3.5zM19.5 14c0-2.1-1.2-3.9-3-4.8v9.6c1.8-.9 3-2.7 3-4.8zm-3-8.7v2.1c3 .9 5 3.6 5 6.6s-2 5.7-5 6.6v2.1c4.2-.9 7-4.7 7-8.7s-2.8-7.8-7-8.7z"
      fill="white"
    />
  </svg>
);

const VolumeOffIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 28 28"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M19.571 22.838C19.357 22.974 19.143 23.1 18.929 23.217C18.715 23.334 18.492 23.44 18.259 23.538C17.967 23.674 17.67 23.674 17.369 23.538C17.068 23.402 16.859 23.178 16.742 22.867C16.625 22.575 16.64 22.288 16.786 22.006C16.931 21.724 17.15 21.516 17.442 21.379C17.578 21.321 17.704 21.258 17.821 21.19C17.938 21.122 18.054 21.049 18.171 20.971L14 17.267V20.504C14 21.029 13.762 21.394 13.286 21.598C12.809 21.802 12.386 21.72 12.017 21.35L8.167 17.5H4.667C4.336 17.5 4.059 17.388 3.836 17.165C3.612 16.941 3.5 16.664 3.5 16.333V11.667C3.5 11.336 3.612 11.059 3.836 10.836C4.059 10.612 4.336 10.5 4.667 10.5H7.234L2.45 5.717C2.236 5.503 2.129 5.231 2.129 4.9C2.129 4.57 2.236 4.297 2.45 4.084C2.664 3.87 2.936 3.763 3.267 3.763C3.597 3.763 3.87 3.87 4.084 4.084L23.917 23.917C24.131 24.131 24.238 24.403 24.238 24.734C24.238 25.064 24.131 25.336 23.917 25.55C23.703 25.764 23.431 25.871 23.1 25.871C22.77 25.871 22.497 25.764 22.284 25.55L19.571 22.838ZM22.167 13.971C22.167 12.357 21.739 10.884 20.884 9.552C20.028 8.22 18.881 7.224 17.442 6.563C17.15 6.427 16.936 6.218 16.8 5.936C16.664 5.654 16.645 5.367 16.742 5.075C16.859 4.764 17.068 4.54 17.369 4.404C17.67 4.268 17.977 4.268 18.288 4.404C20.174 5.24 21.681 6.514 22.809 8.225C23.936 9.936 24.5 11.852 24.5 13.971C24.5 14.613 24.442 15.249 24.325 15.881C24.209 16.513 24.043 17.121 23.829 17.704C23.674 18.132 23.436 18.399 23.115 18.506C22.794 18.613 22.497 18.618 22.225 18.521C21.953 18.424 21.734 18.249 21.569 17.996C21.404 17.743 21.399 17.452 21.554 17.121C21.768 16.616 21.924 16.105 22.021 15.59C22.118 15.074 22.167 14.535 22.167 13.971ZM17.238 9.829C17.879 10.238 18.375 10.85 18.725 11.667C19.075 12.484 19.25 13.261 19.25 14V14.292C19.25 14.389 19.24 14.486 19.221 14.584C19.182 14.836 19.046 15.002 18.813 15.079C18.579 15.157 18.365 15.099 18.171 14.904L16.684 13.417C16.567 13.3 16.479 13.169 16.421 13.023C16.363 12.877 16.334 12.727 16.334 12.571V10.325C16.334 10.092 16.436 9.922 16.64 9.815C16.844 9.708 17.043 9.713 17.238 9.829ZM11.375 8.108C11.259 7.992 11.2 7.856 11.2 7.7C11.2 7.545 11.259 7.409 11.375 7.292L12.017 6.65C12.386 6.281 12.809 6.198 13.286 6.402C13.762 6.606 14 6.971 14 7.496V9.334C14 9.606 13.884 9.79 13.65 9.888C13.417 9.985 13.203 9.936 13.009 9.742L11.375 8.108ZM11.667 17.675V14.934L9.567 12.834H5.834V15.167H9.159L11.667 17.675Z"
      fill="white"
    />
  </svg>
);

const Replay10Icon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 28 28"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M10.5 13.416H9.625C9.372 13.416 9.163 13.334 8.998 13.168C8.833 13.003 8.75 12.794 8.75 12.541C8.75 12.289 8.833 12.08 8.998 11.914C9.163 11.749 9.372 11.666 9.625 11.666H11.375C11.628 11.666 11.837 11.749 12.002 11.914C12.167 12.08 12.25 12.289 12.25 12.541V17.791C12.25 18.044 12.167 18.253 12.002 18.418C11.837 18.584 11.628 18.666 11.375 18.666C11.122 18.666 10.913 18.584 10.748 18.418C10.583 18.253 10.5 18.044 10.5 17.791V13.416ZM14.583 18.666C14.253 18.666 13.976 18.555 13.752 18.331C13.529 18.107 13.417 17.83 13.417 17.5V12.833C13.417 12.503 13.529 12.226 13.752 12.002C13.976 11.778 14.253 11.666 14.583 11.666H16.917C17.247 11.666 17.524 11.778 17.748 12.002C17.972 12.226 18.083 12.503 18.083 12.833V17.5C18.083 17.83 17.972 18.107 17.748 18.331C17.524 18.555 17.247 18.666 16.917 18.666H14.583ZM15.167 16.916H16.333V13.416H15.167V16.916ZM14 25.666C12.542 25.666 11.176 25.389 9.902 24.835C8.628 24.281 7.52 23.532 6.577 22.589C5.634 21.646 4.885 20.538 4.331 19.264C3.777 17.991 3.5 16.625 3.5 15.166C3.5 14.836 3.612 14.559 3.835 14.335C4.059 14.112 4.336 14 4.667 14C4.997 14 5.274 14.112 5.498 14.335C5.722 14.559 5.833 14.836 5.833 15.166C5.833 17.441 6.626 19.371 8.21 20.956C9.795 22.541 11.725 23.333 14 23.333C16.275 23.333 18.205 22.541 19.79 20.956C21.374 19.371 22.167 17.441 22.167 15.166C22.167 12.891 21.374 10.962 19.79 9.377C18.205 7.792 16.275 6.999 14 6.999H13.825L14.817 7.991C15.05 8.225 15.162 8.497 15.152 8.808C15.142 9.119 15.031 9.391 14.817 9.625C14.583 9.858 14.306 9.979 13.985 9.989C13.665 9.999 13.388 9.887 13.154 9.654L10.15 6.649C9.917 6.416 9.8 6.144 9.8 5.833C9.8 5.522 9.917 5.249 10.15 5.016L13.154 2.012C13.388 1.779 13.665 1.667 13.985 1.677C14.306 1.686 14.583 1.808 14.817 2.041C15.031 2.275 15.142 2.547 15.152 2.858C15.162 3.169 15.05 3.441 14.817 3.675L13.825 4.666H14C15.458 4.666 16.824 4.943 18.098 5.498C19.372 6.052 20.48 6.8 21.423 7.743C22.366 8.687 23.115 9.795 23.669 11.069C24.223 12.342 24.5 13.708 24.5 15.166C24.5 16.625 24.223 17.991 23.669 19.264C23.115 20.538 22.366 21.646 21.423 22.589C20.48 23.532 19.372 24.281 18.098 24.835C16.824 25.389 15.458 25.666 14 25.666Z"
      fill="white"
    />
  </svg>
);

const Forward10Icon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 28 28"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M14 25.666C12.542 25.666 11.176 25.389 9.902 24.835C8.628 24.281 7.52 23.532 6.577 22.589C5.634 21.646 4.885 20.538 4.331 19.264C3.777 17.991 3.5 16.625 3.5 15.166C3.5 13.708 3.777 12.342 4.331 11.069C4.885 9.795 5.634 8.687 6.577 7.743C7.52 6.8 8.628 6.052 9.902 5.498C11.176 4.943 12.542 4.666 14 4.666H14.175L13.183 3.675C12.95 3.441 12.838 3.169 12.848 2.858C12.858 2.547 12.969 2.275 13.183 2.041C13.417 1.808 13.694 1.686 14.015 1.677C14.335 1.667 14.613 1.779 14.846 2.012L17.85 5.016C18.083 5.249 18.2 5.522 18.2 5.833C18.2 6.144 18.083 6.416 17.85 6.649L14.846 9.654C14.613 9.887 14.335 9.999 14.015 9.989C13.694 9.979 13.417 9.858 13.183 9.625C12.969 9.391 12.858 9.119 12.848 8.808C12.838 8.497 12.95 8.225 13.183 7.991L14.175 6.999H14C11.725 6.999 9.795 7.792 8.21 9.377C6.626 10.962 5.833 12.891 5.833 15.166C5.833 17.441 6.626 19.371 8.21 20.956C9.795 22.541 11.725 23.333 14 23.333C16.275 23.333 18.205 22.541 19.79 20.956C21.374 19.371 22.167 17.441 22.167 15.166C22.167 14.836 22.279 14.559 22.502 14.335C22.726 14.112 23.003 14 23.333 14C23.664 14 23.941 14.112 24.165 14.335C24.388 14.559 24.5 14.836 24.5 15.166C24.5 16.625 24.223 17.991 23.669 19.264C23.115 20.538 22.366 21.646 21.423 22.589C20.48 23.532 19.372 24.281 18.098 24.835C16.824 25.389 15.458 25.666 14 25.666ZM10.5 13.416H9.625C9.372 13.416 9.163 13.334 8.998 13.168C8.833 13.003 8.75 12.794 8.75 12.541C8.75 12.289 8.833 12.08 8.998 11.914C9.163 11.749 9.372 11.666 9.625 11.666H11.375C11.628 11.666 11.837 11.749 12.002 11.914C12.167 12.08 12.25 12.289 12.25 12.541V17.791C12.25 18.044 12.167 18.253 12.002 18.418C11.837 18.584 11.628 18.666 11.375 18.666C11.122 18.666 10.913 18.584 10.748 18.418C10.583 18.253 10.5 18.044 10.5 17.791V13.416ZM14.583 18.666C14.253 18.666 13.976 18.555 13.752 18.331C13.529 18.107 13.417 17.83 13.417 17.5V12.833C13.417 12.503 13.529 12.226 13.752 12.002C13.976 11.778 14.253 11.666 14.583 11.666H16.917C17.247 11.666 17.524 11.778 17.748 12.002C17.972 12.226 18.083 12.503 18.083 12.833V17.5C18.083 17.83 17.972 18.107 17.748 18.331C17.524 18.555 17.247 18.666 16.917 18.666H14.583ZM15.167 16.916H16.333V13.416H15.167V16.916Z"
      fill="white"
    />
  </svg>
);

const SettingsIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M9.167 18a.913.913 0 01-.604-.208.898.898 0 01-.313-.542l-.312-1.625a7.525 7.525 0 01-.928-.438 5.375 5.375 0 01-.843-.583l-1.563.542a.95.95 0 01-.635-.01.887.887 0 01-.49-.407l-.833-1.458a.87.87 0 01-.104-.615.987.987 0 01.312-.552l1.23-1.083a6.138 6.138 0 01-.063-1.542c.014-.166.035-.333.062-.5L2.854 7.896a.987.987 0 01-.312-.552.87.87 0 01.104-.615l.833-1.458a.887.887 0 01.49-.406.951.951 0 01.635-.01l1.563.54c.264-.221.545-.416.843-.582a7.53 7.53 0 01.928-.438L8.25 2.75a.897.897 0 01.313-.542A.913.913 0 019.167 2h1.666c.236 0 .438.07.604.208.167.14.271.32.313.542l.313 1.625c.319.125.628.27.927.438.298.166.58.36.843.583l1.563-.542a.951.951 0 01.635.01.887.887 0 01.49.407l.833 1.458a.87.87 0 01.104.615.988.988 0 01-.312.552l-1.23 1.083a6.138 6.138 0 01.063 1.542 6.133 6.133 0 01-.062.5l1.229 1.083c.166.153.27.337.312.552a.87.87 0 01-.104.615l-.833 1.458a.887.887 0 01-.49.406.95.95 0 01-.635.01l-1.563-.54a5.377 5.377 0 01-.843.582 7.521 7.521 0 01-.928.438l-.312 1.625a.897.897 0 01-.313.542.912.912 0 01-.604.208H9.167zm.458-1.5h.75l.396-2.063a4.618 4.618 0 001.479-.541 4.335 4.335 0 001.188-1l2 .666.374-.624-1.583-1.396a5.03 5.03 0 00.198-.74c.049-.257.073-.524.073-.802s-.024-.545-.073-.802a5.028 5.028 0 00-.198-.74l1.584-1.396-.376-.625-2 .667a4.335 4.335 0 00-1.187-1 4.619 4.619 0 00-1.48-.542L10.376 3.5h-.75l-.396 2.063a4.619 4.619 0 00-1.479.541 4.337 4.337 0 00-1.187 1l-2-.667-.375.625L5.77 8.459c-.083.236-.15.483-.198.74A4.307 4.307 0 005.5 10c0 .278.024.545.073.802.049.257.115.504.198.74l-1.583 1.396.375.624 2-.666c.333.403.729.736 1.187 1 .458.264.951.444 1.48.541l.395 2.063zM10 13c.833 0 1.542-.292 2.125-.875A2.893 2.893 0 0013 10c0-.833-.292-1.542-.875-2.125A2.893 2.893 0 0010 7c-.833 0-1.542.292-2.125.875A2.893 2.893 0 007 10c0 .833.292 1.542.875 2.125A2.893 2.893 0 0010 13z"
      fill="currentColor"
    />
  </svg>
);

const FullscreenIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M3.778 16.222h1.778a.86.86 0 01.633.256.86.86 0 01.255.633.86.86 0 01-.255.633.86.86 0 01-.633.256H2.889a.86.86 0 01-.633-.256.86.86 0 01-.256-.633v-2.667a.86.86 0 01.256-.633.86.86 0 01.633-.255.86.86 0 01.633.255.86.86 0 01.256.633v1.778zm12.444 0v-1.778a.86.86 0 01.256-.633.86.86 0 01.633-.255.86.86 0 01.633.255.86.86 0 01.256.633v2.667a.86.86 0 01-.256.633.86.86 0 01-.633.256h-2.667a.86.86 0 01-.633-.256.86.86 0 01-.255-.633.86.86 0 01.255-.633.86.86 0 01.633-.256h1.778zM3.778 3.778v1.778a.86.86 0 01-.256.633.86.86 0 01-.633.255.86.86 0 01-.633-.255A.86.86 0 012 5.556V2.889a.86.86 0 01.256-.633A.86.86 0 012.889 2h2.667a.86.86 0 01.633.256.86.86 0 01.255.633.86.86 0 01-.255.633.86.86 0 01-.633.256H3.778zm12.444 0h-1.778a.86.86 0 01-.633-.256.86.86 0 01-.255-.633.86.86 0 01.255-.633.86.86 0 01.633-.256h2.667a.86.86 0 01.633.256.86.86 0 01.256.633v2.667a.86.86 0 01-.256.633.86.86 0 01-.633.255.86.86 0 01-.633-.255.86.86 0 01-.256-.633V3.778z"
      fill="currentColor"
    />
  </svg>
);

const ExitFullscreenIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M5.556 16.222v1.778a.86.86 0 01-.256.633A.86.86 0 014.667 18a.86.86 0 01-.633-.256.86.86 0 01-.256-.633v-2.667a.86.86 0 01.256-.633A.86.86 0 014.667 13.5h2.667a.86.86 0 01.633.256.86.86 0 01.255.633.86.86 0 01-.255.633.86.86 0 01-.633.256H5.556zM13.5 16.222h-1.778a.86.86 0 00-.633.256.86.86 0 00-.255.633.86.86 0 00.255.633A.86.86 0 0011.722 18h2.667a.86.86 0 00.633-.256.86.86 0 00.256-.633v-2.667a.86.86 0 00-.256-.633.86.86 0 00-.633-.255.86.86 0 00-.633.255.86.86 0 00-.256.633v1.778zM5.556 3.778v1.778a.86.86 0 01-.256.633.86.86 0 01-.633.255.86.86 0 01-.633-.255A.86.86 0 013.778 5.556V2.889a.86.86 0 01.256-.633A.86.86 0 014.667 2h2.667a.86.86 0 01.633.256.86.86 0 01.255.633.86.86 0 01-.255.633.86.86 0 01-.633.256H5.556zM13.5 3.778h-1.778a.86.86 0 00-.633-.256.86.86 0 00-.255-.633.86.86 0 00.255-.633A.86.86 0 0111.722 2h2.667a.86.86 0 00.633.256.86.86 0 00.256.633v2.667a.86.86 0 00-.256.633.86.86 0 00-.633.255.86.86 0 00-.633-.255.86.86 0 00-.256-.633V3.778z"
      fill="currentColor"
    />
  </svg>
);

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const PresentationPlayer: React.FC<PresentationPlayerProps> = ({
  slides,
  audioRecord,
  title,
  description,
  status,
  studentName,
  createdAt,
  showHeader = true,
  onTimeUpdate,
}) => {
  const [pageNumber, setPageNumber] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"media" | "slides">("slides");
  const [currentSelectedSlideIndex, setCurrentSelectedSlideIndex] = useState(0);

  const playerRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoWrapperRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  useEffect(() => {
    if (slides.length > 0) {
      const firstSlide = slides.find((s) => s.slideNumber === 1);
      if (firstSlide) setPageNumber(1);
      else setPageNumber(slides[0].slideNumber);
    }
  }, [slides]);

  useEffect(() => {
    if (slides.length > 0) {
      const slideNumbers = slides.map((s) => s.slideNumber);
      const maxSlideNumber = Math.max(...slideNumbers);
      const minSlideNumber = Math.min(...slideNumbers);
      const targetPage = minSlideNumber <= 1 ? 1 : minSlideNumber;
      if (pageNumber < minSlideNumber || pageNumber > maxSlideNumber) {
        setPageNumber(targetPage);
      }
    }
  }, [slides, pageNumber]);

  useEffect(() => {
    setPageNumber(1);
    setCurrentSelectedSlideIndex(0);
  }, []);

  useEffect(() => {
    if (slides.length > 0) {
      if (currentSelectedSlideIndex >= slides.length)
        setCurrentSelectedSlideIndex(0);
      setPageNumber(1);
    }
  }, [slides, currentSelectedSlideIndex]);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = window.setTimeout(
        () => setShowControls(false),
        3000,
      );
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  const handleMouseMove = useCallback(
    () => resetControlsTimer(),
    [resetControlsTimer],
  );

  // Sync video element properties
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.volume = volume;
      playerRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (playerRef.current) playerRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pause();
      setIsPlaying(false);
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    } else {
      playerRef.current.play();
      setIsPlaying(true);
      resetControlsTimer();
    }
  };

  const seek = (seconds: number) => {
    if (!playerRef.current) return;
    playerRef.current.currentTime = Math.max(
      0,
      Math.min(
        playerRef.current.duration || 0,
        playerRef.current.currentTime + seconds,
      ),
    );
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !playerRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    playerRef.current.currentTime = ratio * (playerRef.current.duration || 0);
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !playerRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    setHoverProgress(Math.max(0, Math.min(1, ratio)) * 100);
  };

  const toggleMute = () => setIsMuted((m) => !m);

  const toggleFullscreen = () => {
    if (!videoWrapperRef.current) return;
    if (!document.fullscreenElement) {
      videoWrapperRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const changePage = (offset: number) => {
    const totalPages = slides.length;
    const newPage = Math.min(Math.max(1, pageNumber + offset), totalPages);
    setPageNumber(newPage);
  };

  const currentPdfSlide = slides[currentSelectedSlideIndex];
  const currentSlide =
    slides.find((s) => s.slideNumber === pageNumber) ||
    slides[0] ||
    currentPdfSlide;
  const hasVideo = !!audioRecord?.filePath && isVideoFile(audioRecord.filePath);
  const currentSlideIsVideo =
    currentSlide?.filePath && isVideoFile(currentSlide.filePath);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const renderSlideContent = () => {
    if (!currentSlide?.filePath && !currentPdfSlide?.filePath) {
      return (
        <div className="flex flex-col items-center justify-center h-[500px] text-slate-500">
          <File className="w-16 h-16 mb-4" />
          <p>Không có slide</p>
        </div>
      );
    }

    if (isPptxFile(currentPdfSlide?.filePath)) {
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(currentPdfSlide.filePath)}`;
      return (
        <div
          className="relative bg-slate-900 rounded-xl overflow-hidden border border-slate-700"
          style={{ height: "600px" }}
        >
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-slate-800/90 backdrop-blur-sm border-b border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span className="text-xs text-slate-300 font-medium">
                {currentPdfSlide.fileName}
              </span>
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

    if (isPdfFile(currentPdfSlide?.filePath)) {
      return (
        <div className="h-[600px] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative">
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            <div className="h-full overflow-auto">
              <Viewer
                fileUrl={currentPdfSlide.filePath}
                initialPage={0}
                onPageChange={(e) => setPageNumber(e.currentPage + 1)}
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
            onTimeUpdate={(e) => setDuration(e.currentTarget.duration)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-slate-500 bg-slate-100 rounded-lg">
        <File className="w-16 h-16 mb-4" />
        <p className="text-lg font-medium">{currentSlide.fileName}</p>
        <p className="text-sm">Tệp {getFileExtension(currentSlide.filePath)}</p>
        <div className="flex gap-2 mt-4">
          <a
            href={currentSlide.filePath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition"
          >
            <ExternalLink className="w-4 h-4" />
            Mở
          </a>
          <a
            href={currentSlide.filePath}
            download
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition"
          >
            <Download className="w-4 h-4" />
            Tải xuống
          </a>
        </div>
      </div>
    );
  };

  // Coursera-style custom video player
  const renderMediaPlayer = () => {
    if (!audioRecord?.filePath) {
      return (
        <div className="flex flex-col items-center justify-center h-[500px] text-slate-500 bg-slate-100 rounded-lg">
          <Video className="w-16 h-16 mb-4" />
          <p>Không có bản ghi video</p>
        </div>
      );
    }

    if (!isVideoFile(audioRecord.filePath)) {
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
              onTimeUpdate={(e) => onTimeUpdate?.(e.currentTarget.currentTime)}
            />
          </div>
        </div>
      );
    }

    return (
      <div
        ref={videoWrapperRef}
        className="relative w-full bg-black select-none"
        style={{ aspectRatio: "16/9" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        onClick={togglePlay}
      >
        {/* Video element */}
        <video
          ref={playerRef}
          src={audioRecord.filePath}
          className="w-full h-full object-contain"
          onTimeUpdate={(e) => {
            const t = e.currentTarget.currentTime;
            setCurrentTime(t);
            onTimeUpdate?.(t);
          }}
          onLoadedMetadata={(e) => {
            setDuration(e.currentTarget.duration);
            e.currentTarget.volume = volume;
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setShowControls(true);
          }}
        />

        {/* Center play/pause flash */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center">
              <PlayIcon />
            </div>
          </div>
        )}

        {/* Control bar */}
        <div
          className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}
          style={{
            background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress bar */}
          <div
            ref={progressBarRef}
            className="relative w-full cursor-pointer group px-2"
            style={{ height: "20px", display: "flex", alignItems: "center" }}
            onClick={handleProgressClick}
            onMouseMove={handleProgressHover}
            onMouseLeave={() => setHoverProgress(null)}
          >
            <div className="relative w-full h-1 group-hover:h-1.5 transition-all duration-150 rounded-full bg-white/30">
              {/* Buffered (placeholder) */}
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-white/50"
                style={{ width: "40%" }}
              />
              {/* Played */}
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-[#0056D2]"
                style={{ width: `${progressPercent}%` }}
              />
              {/* Hover preview */}
              {hoverProgress !== null && (
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-white/20"
                  style={{ width: `${hoverProgress}%` }}
                />
              )}
              {/* Thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#0056D2] rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow"
                style={{ left: `calc(${progressPercent}% - 6px)` }}
              />
            </div>
          </div>

          {/* Buttons row */}
          <div className="flex items-center justify-between px-3 pb-2 pt-0">
            {/* Left controls */}
            <div className="flex items-center gap-1">
              {/* Play/Pause */}
              <button
                className="p-1.5 rounded hover:bg-white/10 transition text-white"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>

              {/* Volume */}
              <div
                className="flex items-center gap-1 relative"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <button
                  className="p-1.5 rounded hover:bg-white/10 transition text-white"
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeOffIcon />
                  ) : (
                    <VolumeOnIcon />
                  )}
                </button>
                {/* Volume slider popup */}
                <div
                  className={`flex items-center transition-all duration-150 overflow-hidden ${showVolumeSlider ? "w-20 opacity-100" : "w-0 opacity-0"}`}
                >
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={isMuted ? 0 : Math.round(volume * 100)}
                    onChange={(e) => {
                      const v = Number(e.target.value) / 100;
                      setVolume(v);
                      if (v > 0) setIsMuted(false);
                    }}
                    className="w-full h-1 accent-[#0056D2] cursor-pointer"
                    style={{ accentColor: "#0056D2" }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              {/* Seek -10s */}
              <button
                className="p-1.5 rounded hover:bg-white/10 transition text-white"
                onClick={() => seek(-10)}
                aria-label="Seek backward 10 seconds"
              >
                <Replay10Icon />
              </button>

              {/* Time display */}
              <span className="text-white text-sm font-mono px-1 whitespace-nowrap">
                <span>{formatTime(currentTime)}</span>
                <span className="text-white/50 mx-0.5">/</span>
                <span className="text-white/70">{formatTime(duration)}</span>
              </span>

              {/* Seek +10s */}
              <button
                className="p-1.5 rounded hover:bg-white/10 transition text-white"
                onClick={() => seek(10)}
                aria-label="Seek forward 10 seconds"
              >
                <Forward10Icon />
              </button>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-1">
              {/* Playback speed */}
              <div className="relative">
                <button
                  className="px-2 py-1 rounded hover:bg-white/10 transition text-white text-sm font-medium min-w-[36px]"
                  onClick={() => setShowSpeedMenu((s) => !s)}
                  aria-label="Playback rate"
                >
                  {playbackRate}x
                </button>
                {showSpeedMenu && (
                  <div
                    className="absolute bottom-full right-0 mb-1 bg-[#1a1a2e] rounded-lg overflow-hidden shadow-xl border border-white/10"
                    style={{ minWidth: "80px" }}
                  >
                    {SPEED_OPTIONS.map((rate) => (
                      <button
                        key={rate}
                        className={`w-full px-4 py-2 text-sm text-left transition hover:bg-white/10 ${playbackRate === rate ? "text-[#4a90d9] font-semibold" : "text-white"}`}
                        onClick={() => {
                          setPlaybackRate(rate);
                          setShowSpeedMenu(false);
                        }}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Settings (placeholder) */}
              <button
                className="p-1.5 rounded hover:bg-white/10 transition text-white"
                aria-label="Settings"
              >
                <SettingsIcon />
              </button>

              {/* Fullscreen */}
              <button
                className="p-1.5 rounded hover:bg-white/10 transition text-white"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const hasSlides = slides.length > 0;
  const hasMediaContent = hasVideo || !!audioRecord;

  useEffect(() => {
    if (!hasSlides && hasMediaContent) setActiveTab("media");
    else if (hasSlides && !hasMediaContent) setActiveTab("slides");
  }, [hasSlides, hasMediaContent]);

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
    >
      {/* Header */}
      {showHeader && (
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
                    <span>
                      {new Date(createdAt).toLocaleDateString("vi-VN")}
                    </span>
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
      )}

      {/* Tabs */}
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
          </div>
        </div>
      )}

      {/* Player Container */}
      <div className="relative bg-slate-950">
        <div className="flex flex-col">
          {/* Content */}
          <div className={activeTab === "media" ? "" : "p-4"}>
            {hasSlides && (!hasMediaContent || activeTab === "slides") && (
              <div className="mb-4">{renderSlideContent()}</div>
            )}
            {hasMediaContent &&
              (!hasSlides || activeTab === "media") &&
              renderMediaPlayer()}
          </div>

          {/* Slides Sidebar */}
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
                  const isSelected =
                    slideIsPdf || slideIsPptx
                      ? index === currentSelectedSlideIndex
                      : pageNumber === slide.slideNumber;
                  return (
                    <button
                      key={slide.slideId}
                      onClick={() => {
                        if (slideIsPdf || slideIsPptx) {
                          setCurrentSelectedSlideIndex(index);
                        } else {
                          setPageNumber(slide.slideNumber);
                        }
                        setActiveTab("slides");
                        if (slideIsVideo) setIsPlaying(false);
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

      {/* Bottom Controls — shown only for slides tab */}
      {(!hasMediaContent || activeTab === "slides") && (
        <div className="bg-slate-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
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
      )}
    </div>
  );
};

export default PresentationPlayer;
