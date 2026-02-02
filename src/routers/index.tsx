import HomePage from "@/page/HomePage/HomePage";
import LoginPage from "@/page/Authentication/LoginPage/LoginPage";
import RegisterPage from "@/page/Authentication/RegisterPage/RegisterPage";
import InstructorRegisterPage from "@/page/Authentication/InstructorRegisterPage/InstructorRegisterPage";
import ForgotPasswordPage from "@/page/Authentication/ForgotPasswordPage/ForgotPasswordPage";
import { Route, Routes } from "react-router-dom";
import ManageCoursesPage from "@/page/Instructor/ManageCoursesPage";
import InstructorDashboardPage from "@/page/Instructor/InstructorDashboardPage";
import CourseDetailPage from "@/page/Instructor/CourseDetailPage";
import TopicDetailPage from "@/page/Instructor/TopicDetailPage";
import PresentationAnalysisPage from "@/page/Admin/PresentationAnalysisPage";
import StudentDashboardPage from "@/page/Students/StudentDashboardPage";
import StudentCoursesPage from "@/page/Students/StudentCoursesPage";
import StudentMyCoursesPage from "@/page/Students/StudentMyCoursesPage";
import StudentCourseDetailPage from "@/page/Students/StudentCourseDetailPage";
import AdminDashboardPage from "@/page/Admin/AdminDashboardPage";
import AdminClassPage from "@/page/Admin/AdminClassPage";
import UserManagementPage from "@/page/Admin/UserManagementPage";
import AIConfigurationPage from "@/page/Admin/AIConfigurationPage";
import SettingsPage from "@/page/Admin/SettingsPage";
import StudentSettingsPage from "@/page/Students/StudentSettingsPage";
import FeedbackPage from "@/page/Students/FeedbackPage";
import ProtectedRoute from "@/components/ProtectedRoute/ProtectedRoute";
import ForbiddenPage from "@/page/Error/ForbiddenPage";
import NotFoundPage from "@/page/Error/NotFoundPage";
import AdminCoursePage from "@/page/Admin/AdminCoursePage";

const AppRouter = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register-instructor" element={<InstructorRegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected Instructor routes */}
      <Route element={<ProtectedRoute allowedRoles={["Instructor"]} />}>
        <Route path="/instructor/dashboard" element={<InstructorDashboardPage />} />
        <Route
          path="/instructor/manage-courses"
          element={<ManageCoursesPage />}
        />
        <Route
          path="/instructor/course/:courseId"
          element={<CourseDetailPage />}
        />
        <Route
          path="/instructor/topic/:topicId"
          element={<TopicDetailPage />}
        />
      </Route>

      {/* Protected Student routes */}
      <Route element={<ProtectedRoute allowedRoles={["Student"]} />}>
        <Route path="/student/dashboard" element={<StudentDashboardPage />} />
        <Route path="/student/courses" element={<StudentCoursesPage />} />
        <Route
          path="/student/course/:courseId"
          element={<StudentCourseDetailPage />}
        />

        <Route path="/student/my-class" element={<StudentMyCoursesPage />} />
        <Route path="/student/class/:classId" element={<StudentCourseDetailPage />} />
        <Route path="/student/feedback" element={<FeedbackPage />} />
        <Route path="/student/settings" element={<StudentSettingsPage />} />
      </Route>

      {/* Protected Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/classes" element={<AdminClassPage />} />
        <Route
          path="/admin/presentation-analysis"
          element={<PresentationAnalysisPage />}
        />
        <Route
          path="/admin/analysis-logs"
          element={<PresentationAnalysisPage />}
        />
        <Route path="/admin/user-management" element={<UserManagementPage />} />
        <Route path="/admin/manage-classes" element={<AdminClassPage />} />
        <Route path="/admin/manage-courses" element={<AdminCoursePage />} />
        <Route
          path="/admin/ai-configuration"
          element={<AIConfigurationPage />}
        />
        <Route path="/admin/settings" element={<SettingsPage />} />
      </Route>

      {/* Error / fallback routes */}
      <Route path="/unauthorized" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRouter;
