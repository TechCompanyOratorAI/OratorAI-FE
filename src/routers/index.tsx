import HomePage from "@/page/HomePage/HomePage";
import LoginPage from "@/page/Authentication/LoginPage/LoginPage";
import RegisterPage from "@/page/Authentication/RegisterPage/RegisterPage";
import InstructorRegisterPage from "@/page/Authentication/InstructorRegisterPage/InstructorRegisterPage";
import ForgotPasswordPage from "@/page/Authentication/ForgotPasswordPage/ForgotPasswordPage";
import { Route, Routes } from "react-router-dom";
import InstructorDashboardPage from "@/page/Instructor/InstructorDashboardPage";
import CourseDetailPage from "@/page/Instructor/CourseDetailPage";
import TopicDetailPage from "@/page/Instructor/TopicDetailPage";
import ClassDetailPage from "@/page/Instructor/ClassDetailPage";
import PresentationAnalysisPage from "@/page/Admin/PresentationAnalysisPage";
import StudentDashboardPage from "@/page/Students/StudentDashboardPage";
import StudentClassesPage from "@/page/Students/StudentClassesPage";
import StudentMyCoursesPage from "@/page/Students/StudentMyClassesPage";
import StudentCourseDetailPage from "@/page/Students/StudentClassDetailPage";
import AdminDashboardPage from "@/page/Admin/AdminDashboardPage";
import AdminClassPage from "@/page/Admin/AdminClassPage";
import UserManagementPage from "@/page/Admin/UserManagementPage";
import AIConfigurationPage from "@/page/Admin/AIConfigurationPage";
import SettingsPage from "@/page/Admin/SettingsPage";
import StudentSettingsPage from "@/page/Students/StudentSettingsPage";
import FeedbackPage from "@/page/Students/FeedbackPage";
import StudentTopicDetailPage from "@/page/Students/StudentTopicDetailPage";
import PresentationDetailPage from "@/page/Students/PresentationDetailPage";
import ProtectedRoute from "@/components/ProtectedRoute/ProtectedRoute";
import ForbiddenPage from "@/page/Error/ForbiddenPage";
import NotFoundPage from "@/page/Error/NotFoundPage";
import AdminCoursePage from "@/page/Admin/AdminCoursePage";
import ManageClassesPage from "@/page/Instructor/ManageClassesPage";

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
        <Route
          path="/instructor/dashboard"
          element={<InstructorDashboardPage />}
        />
        <Route
          path="/instructor/manage-classes"
          element={<ManageClassesPage />}
        />
        <Route
          path="/instructor/course/:courseId"
          element={<CourseDetailPage />}
        />
        <Route
          path="/instructor/class/:classId"
          element={<ClassDetailPage />}
        />
        <Route
          path="/instructor/topic/:topicId"
          element={<TopicDetailPage />}
        />
      </Route>

      {/* Protected Student routes */}
      <Route element={<ProtectedRoute allowedRoles={["Student"]} />}>
        <Route path="/student/dashboard" element={<StudentDashboardPage />} />
        <Route path="/student/classes" element={<StudentClassesPage />} />
        <Route
          path="/student/course/:courseId"
          element={<StudentCourseDetailPage />}
        />
        <Route path="/student/my-class" element={<StudentMyCoursesPage />} />
        <Route
          path="/student/class/:classId"
          element={<StudentCourseDetailPage />}
        />
        <Route
          path="/student/topic/:topicId"
          element={<StudentTopicDetailPage />}
        />
        <Route
          path="/student/class/:classId/topic/:topicId"
          element={<StudentTopicDetailPage />}
        />
        <Route path="/student/feedback" element={<FeedbackPage />} />
        <Route path="/student/settings" element={<StudentSettingsPage />} />
        <Route
          path="/student/presentation/:presentationId"
          element={<PresentationDetailPage />}
        />
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
