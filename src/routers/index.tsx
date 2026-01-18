import HomePage from "@/page/HomePage/HomePage";
import LoginPage from "@/page/Authentication/LoginPage/LoginPage";
import RegisterPage from "@/page/Authentication/RegisterPage/RegisterPage";
import InstructorRegisterPage from "@/page/Authentication/InstructorRegisterPage/InstructorRegisterPage";
import ForgotPasswordPage from "@/page/Authentication/ForgotPasswordPage/ForgotPasswordPage";
import { Route, Routes } from "react-router-dom";
import ManageCoursesPage from "@/page/Instructor/ManageCoursesPage";
import CourseDetailPage from "@/page/Instructor/CourseDetailPage";
import PresentationAnalysisPage from "@/page/Admin/PresentationAnalysisPage";
import StudentDashboardPage from "@/page/Students/StudentDashboardPage";
import AdminDashboardPage from "@/page/Admin/AdminDashboardPage";
import UserManagementPage from "@/page/Admin/UserManagementPage";
import AIConfigurationPage from "@/page/Admin/AIConfigurationPage";
import SettingsPage from "@/page/Admin/SettingsPage";
import FeedbackPage from "@/page/Students/FeedbackPage";

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register-instructor" element={<InstructorRegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/instructor/manage-courses" element={<ManageCoursesPage />} />
      <Route path="/instructor/course/:courseId" element={<CourseDetailPage />} />
      <Route path="/student/dashboard" element={<StudentDashboardPage />} />
      <Route path="/student/feedback" element={<FeedbackPage />} />
      <Route path="/student/settings" element={<SettingsPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      <Route path="/admin/presentation-analysis" element={<PresentationAnalysisPage />} />
      <Route path="/admin/analysis-logs" element={<PresentationAnalysisPage />} />
      <Route path="/admin/user-management" element={<UserManagementPage />} />
      <Route path="/admin/ai-configuration" element={<AIConfigurationPage />} />
      <Route path="/admin/settings" element={<SettingsPage />} />
    </Routes>
  );
};

export default AppRouter;