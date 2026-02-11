import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    ArrowLeft,
    Bell,
    Menu,
    X,
    LogOut,
    GraduationCap,
    FileText,
    Clock,
    Calendar,
    User,
    BookOpen,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchPresentationDetail } from "@/services/features/presentation/presentationSlice";
import { logout } from "@/services/features/auth/authSlice";
import Toast from "@/components/Toast/Toast";
import PresentationPlayer from "@/components/Presentation/PresentationPlayer";

const PresentationDetailPage: React.FC = () => {
    const { presentationId } = useParams<{ presentationId: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { currentPresentationDetail: presentation, detailLoading, error } = useAppSelector(
        (state) => state.presentation
    );
    const { user } = useAppSelector((state) => state.auth);

    const [toast, setToast] = useState<{
        message: string;
        type: "success" | "error" | "info";
    } | null>(null);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const presentationIdNumber = presentationId ? parseInt(presentationId) : null;

    useEffect(() => {
        if (presentationIdNumber) {
            dispatch(fetchPresentationDetail(presentationIdNumber));
        }
    }, [presentationIdNumber, dispatch]);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(event.target as Node)
            ) {
                setIsUserMenuOpen(false);
            }
        };

        if (isUserMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isUserMenuOpen]);

    const handleLogout = () => {
        dispatch(logout());
        navigate("/login");
    };

    const userInitial =
        user?.firstName?.[0]?.toUpperCase() ||
        user?.username?.[0]?.toUpperCase() ||
        "S";

    const userDisplayName = user
        ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        user.username ||
        "Student"
        : "Student";

    if (detailLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading presentation...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error || !presentation) {
        return (
            <div className="min-h-screen bg-gray-50">
                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-[1280px] mx-auto px-4 py-8">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium mb-6"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back
                        </button>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                            <p className="text-red-700 font-medium">{error || "Presentation not found"}</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    const studentName = presentation.student
        ? `${presentation.student.firstName || ""} ${presentation.student.lastName || ""}`.trim()
        : "Unknown Student";

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<
            string,
            { bg: string; text: string; color: string }
        > = {
            draft: {
                bg: "bg-gray-100 text-gray-700",
                text: "Draft",
                color: "text-gray-700",
            },
            submitted: {
                bg: "bg-blue-100 text-blue-700",
                text: "Submitted",
                color: "text-blue-700",
            },
            processing: {
                bg: "bg-amber-100 text-amber-700",
                text: "Processing",
                color: "text-amber-700",
            },
            analyzed: {
                bg: "bg-green-100 text-green-700",
                text: "Analyzed",
                color: "text-green-700",
            },
        };

        const config = statusConfig[status.toLowerCase()] || statusConfig.draft;
        return config;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-200/60">
                                <GraduationCap className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-slate-900">OratorAI</span>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-8">
                            <Link
                                to="/student/classes"
                                className="text-sm font-medium text-gray-600 hover:text-gray-900"
                            >
                                Classes
                            </Link>
                            <Link
                                to="/student/my-class"
                                className="text-sm font-medium text-gray-600 hover:text-gray-900"
                            >
                                My Classes
                            </Link>
                            <Link
                                to="/student/feedback"
                                className="text-sm font-medium text-gray-600 hover:text-gray-900"
                            >
                                My Presentations
                            </Link>
                        </nav>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-4">
                            {/* Notifications */}
                            <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                                <Bell className="w-5 h-5 text-gray-600" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>

                            {/* User Menu */}
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 flex items-center justify-center">
                                        <span className="text-white font-semibold text-sm">
                                            {userInitial}
                                        </span>
                                    </div>
                                </button>
                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {userDisplayName}
                                            </p>
                                            <p className="text-xs text-gray-500">Student</p>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden p-2 hover:bg-gray-100 rounded-full"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="w-5 h-5 text-gray-600" />
                                ) : (
                                    <Menu className="w-5 h-5 text-gray-600" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-800 font-semibold"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back
                        </button>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <FileText className="w-4 h-4" />
                            Presentation Detail
                        </div>
                    </div>

                    {/* Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                                <User className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Presenter</p>
                                <p className="font-bold text-slate-900 truncate max-w-[150px]">{studentName}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Topic</p>
                                <p className="font-bold text-slate-900 truncate max-w-[150px]">
                                    {presentation.topic?.topicName || "N/A"}
                                </p>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Duration</p>
                                <p className="font-bold text-slate-900">
                                    {presentation.durationSeconds
                                        ? `${Math.floor(presentation.durationSeconds / 60)}m ${presentation.durationSeconds % 60}s`
                                        : "Not set"}
                                </p>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getStatusBadge(presentation.status).bg
                                }`}>
                                <Calendar className={`w-6 h-6 ${getStatusBadge(presentation.status).color}`} />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Status</p>
                                <p className={`font-bold ${getStatusBadge(presentation.status).color}`}>
                                    {getStatusBadge(presentation.status).text}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Presentation Player */}
                    <PresentationPlayer
                        slides={presentation.slides || []}
                        audioRecord={presentation.audioRecord || null}
                        title={presentation.title}
                        description={presentation.description}
                        status={presentation.status}
                        studentName={studentName}
                        createdAt={presentation.createdAt}
                    />
                </div>
            </main>

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

export default PresentationDetailPage;
