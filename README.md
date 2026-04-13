# OratorAI - Hệ thống Quản lý Thuyết trình

## 1. Tổng quan

**OratorAI** là một nền tảng quản lý thuyết trình được thiết kế cho môi trường giáo dục đại học. Hệ thống hỗ trợ ba vai trò chính: **Admin**, **Giảng viên (Instructor)**, và **Sinh viên (Student)**. Giảng viên có thể tạo lớp học, giao đề tài và quản lý bài thuyết trình. Sinh viên nộp bài thuyết trình nhóm, nhận phản hồi tự động từ AI và xem điểm số. Admin quản lý toàn bộ hệ thống từ khóa học, lớp học, khoa, người dùng đến mẫu rubric.

Dự án sử dụng **React 18** với **TypeScript**, **Redux Toolkit** cho state management, **Ant Design** cho UI components, **TailwindCSS** cho styling, và kết nối đến backend API qua **Axios**.

---

## 2. Kiến trúc dự án

```
src/
├── apps/                  # Entry point ứng dụng
├── components/            # Các component UI dùng chung
│   ├── Authentication/    # Form login, register, forgot password...
│   ├── Course/            # Modal tạo/sửa khóa học, lớp học, giảng viên
│   ├── CriterionFeedback/ # Modal phản hồi tiêu chí chấm điểm
│   ├── Department/        # Modal quản lý khoa
│   ├── Footer/            # Footer
│   ├── Group/             # Modal chi tiết nhóm, phân phối điểm
│   ├── Header/            # Navigation header
│   ├── Presentation/      # Modal upload, player thuyết trình
│   ├── ProtectedRoute/    # Component bảo vệ route theo role
│   ├── Rubric/           # Modal rubric chấm điểm
│   ├── RubricTemplate/    # Modal template rubric và criteria
│   ├── Share/            # Modal chia sẻ thuyết trình
│   ├── Sidebar/          # Sidebar cho Admin và Instructor
│   ├── StudentLayout/    # Layout dành cho sinh viên
│   ├── Toast/            # Component thông báo
│   ├── yoodli/           # Component landing page (hero, carousel...)
│   └── AppLogo/          # Logo ứng dụng
├── page/                 # Các trang chính theo vai trò
│   ├── Admin/            # Trang quản trị (dashboard, quản lý user, khóa học...)
│   ├── Authentication/    # Trang đăng nhập, đăng ký, quên mật khẩu...
│   ├── Error/            # Trang 404, 403
│   ├── HomePage/         # Trang chủ
│   ├── Instructor/       # Trang giảng viên (dashboard, lớp học, đề tài...)
│   ├── Share/            # Trang chia sẻ thuyết trình công khai
│   └── Students/         # Trang sinh viên (dashboard, lớp học, thuyết trình...)
├── routers/              # Định nghĩa routes và bảo vệ route
└── services/             # Logic nghiệp vụ, API, Redux slices
    ├── constant/         # Cấu hình API endpoints
    ├── features/         # Redux slices theo domain
    └── store/           # Cấu hình Redux store
```

---

## 3. Vai trò và tính năng

### 3.1. Admin

| Route | Mô tả |
|---|---|
| `/admin/dashboard` | Tổng quan hệ thống |
| `/admin/manage-courses` | Quản lý khóa học |
| `/admin/classes` | Quản lý lớp học |
| `/admin/manage-departments` | Quản lý khoa |
| `/admin/user-management` | Quản lý người dùng |
| `/admin/rubric-templates` | Quản lý mẫu rubric |
| `/admin/ai-configuration` | Cấu hình AI |
| `/admin/presentation-analysis` | Phân tích thuyết trình |
| `/admin/settings` | Cài đặt hệ thống |

### 3.2. Instructor (Giảng viên)

| Route | Mô tả |
|---|---|
| `/instructor/dashboard` | Dashboard giảng viên |
| `/instructor/manage-classes` | Quản lý các lớp đang dạy |
| `/instructor/course/:courseId` | Chi tiết khóa học |
| `/instructor/class/:classId` | Chi tiết lớp học |
| `/instructor/class/:classId/students` | Danh sách sinh viên trong lớp |
| `/instructor/topic/:topicId` | Chi tiết đề tài |
| `/instructor/presentation/:presentationId` | Xem & chấm thuyết trình |
| `/instructor/students` | Quản lý sinh viên |

### 3.3. Student (Sinh viên)

| Route | Mô tả |
|---|---|
| `/student/dashboard` | Dashboard sinh viên |
| `/student/my-class` | Các lớp đã đăng ký |
| `/student/class/:classId` | Chi tiết lớp học |
| `/student/topic/:topicId` | Chi tiết đề tài nhóm |
| `/student/my-presentations` | Danh sách thuyết trình đã nộp |
| `/student/presentation/:presentationId` | Chi tiết thuyết trình |
| `/student/settings` | Cài đặt tài khoản |

### 3.4. Public

| Route | Mô tả |
|---|---|
| `/` | Trang chủ |
| `/login` | Đăng nhập |
| `/register` | Đăng ký sinh viên |
| `/register-instructor` | Đăng ký giảng viên |
| `/forgot-password` | Quên mật khẩu |
| `/reset-password` | Đặt lại mật khẩu |
| `/verify-email` | Xác thực email |
| `/share/:token` | Trang xem thuyết trình chia sẻ công khai |

---

## 4. Công nghệ sử dụng

### Framework & Ngôn ngữ

| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| React | 18.3.1 | UI framework |
| TypeScript | 5.8.3 | Ngôn ngữ chính |
| Vite | 6.0.5 | Build tool |

### State Management & Data Fetching

| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| Redux Toolkit | 2.5.0 | State management |
| Redux Persist | 6.0.0 | Lưu state vào localStorage |
| Axios | 1.7.9 | HTTP client |

### UI & Styling

| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| Ant Design | 5.25.1 | Component library (chính) |
| TailwindCSS | ~ | Utility-first CSS |
| Framer Motion | 12.26.2 | Animation |
| Lucide React | 0.473.0 | Icons |
| Recharts | 3.8.0 | Charts |
| React Router DOM | 7.1.1 | Routing |
| Radix UI | Various | Headless UI primitives |
| Emotion | 11.14.0 | CSS-in-JS |

### Drag & Drop

| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| @dnd-kit/core | 6.3.1 | Drag and drop primitives |
| @dnd-kit/sortable | 10.0.0 | Sortable list |
| @dnd-kit/modifiers | 9.0.0 | Drag modifiers |

### File & Media

| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| react-pdf | 10.3.0 | Viewer PDF |
| @react-pdf-viewer/core | 3.12.0 | PDF viewer |
| react-player | 3.4.0 | Video player |

### Utilities

| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| clsx | 2.1.1 | Conditional className |
| tailwind-merge | 2.6.0 | Merge Tailwind classes |
| tailwindcss-animate | 1.0.7 | Animations cho Tailwind |
| canvas-confetti | 1.9.4 | Hiệu ứng confetti |
| react-toastify | 11.0.5 | Toast notifications |

---

## 5. Cấu trúc API Services

### 5.1. Redux Slices

| Slice | Domain |
|---|---|
| `authSlice` | Xác thực, đăng nhập, đăng ký |
| `courseSlice` | Quản lý khóa học |
| `classSlice` | Quản lý lớp học (admin) |
| `adminSlice` | User, instructor, department (admin) |
| `rubricTempleSlice` | Rubric template (admin) |
| `rubricSlice` | Rubric chấm điểm (class) |
| `enrollmentSlice` | Đăng ký lớp học |
| `groupSlice` | Quản lý nhóm |
| `groupGradeSlice` | Phân phối điểm nhóm |
| `topicSlice` | Quản lý đề tài |
| `presentationSlice` | Thuyết trình |
| `reportSlice` | Báo cáo AI |
| `shareSlice` | Chia sẻ thuyết trình |
| `classScoreSlice` | Điểm số theo lớp |
| `instructorDashboardSlice` | Dashboard giảng viên |

### 5.2. API Endpoints chính

```
Authentication:
  POST /api/v1/auth/login
  POST /api/v1/auth/register
  POST /api/v1/auth/register-instructor
  POST /api/v1/auth/refresh-token
  POST /api/v1/auth/logout
  POST /api/v1/auth/forgot-password
  POST /api/v1/auth/reset-password
  POST /api/v1/auth/verify-email
  POST /api/v1/auth/resend-verification

Courses:
  GET  /api/v1/courses
  POST /api/v1/courses
  GET  /api/v1/courses/:courseId
  PUT  /api/v1/courses/:courseId

Classes:
  GET  /api/v1/classes
  POST /api/v1/courses/:courseId/classes
  GET  /api/v1/classes/:classId
  PUT  /api/v1/classes/:classId
  DELETE /api/v1/classes/:classId

Enrollments:
  POST /api/v1/enrollments/join          # Sinh viên đăng ký lớp bằng mã
  GET  /api/v1/enrollments/me/classes    # Lớp đã đăng ký

Groups:
  GET  /api/v1/groups/classes/:classId
  POST /api/v1/groups
  GET  /api/v1/groups/:groupId
  PUT  /api/v1/groups/:groupId
  DELETE /api/v1/groups/:groupId
  POST /api/v1/groups/:groupId/join
  POST /api/v1/groups/:groupId/leave

Topics:
  GET  /api/v1/classes/:classId/topics
  POST /api/v1/classes/:classId/topics
  GET  /api/v1/topics/:topicId
  PUT  /api/v1/topics/:topicId

Presentations:
  POST /api/v1/presentations
  GET  /api/v1/presentations/:id
  POST /api/v1/presentations/:id/submit
  POST /api/v1/presentations/:id/resubmit

AI Reports:
  GET  /api/v1/ai-reports/presentation/:presentationId
  POST /api/v1/ai-reports/:reportId/confirm
  POST /api/v1/ai-reports/:reportId/reject

Rubric:
  GET  /api/v1/classes/:classId/rubric
  POST /api/v1/classes/:classId/rubric/criteria

Rubric Templates:
  GET  /api/v1/rubric-templates/all      # Admin
  POST /api/v1/rubric-templates           # Admin tạo template
  GET  /api/v1/rubric-templates           # Instructor chọn template

Departments:
  GET/POST /api/v1/departments
  PUT/DELETE /api/v1/departments/:id

Users:
  GET /api/v1/users                       # Admin
  GET /api/v1/users/profile                # Profile
  POST /api/v1/users/avatar               # Upload avatar
```

---

## 6. Cấu hình môi trường

API Base URL được cấu hình tại `src/services/constant/apiConfig.ts`:

```typescript
export const BASE_URL = "http://localhost:8080";
```

Đổi sang URL production khi deploy:

```typescript
export const BASE_URL = "https://api.oratorai.com";
```

---

## 7. Scripts

```bash
npm install          # Cài đặt dependencies
npm run dev         # Chạy dev server (http://localhost:5173)
npm run build       # Build production
npm run lint        # Kiểm tra lint
npm run preview     # Preview build
```

---

## 8. Mô tả luồng nghiệp vụ

### Luồng tạo lớp học (Admin)

1. Admin tạo **Department** (khoa)
2. Admin tạo **Course** (khóa học), gán department
3. Admin tạo **Class** (lớp học), gán course
4. Admin thêm **Instructor** vào class
5. Giảng viên nhận lớp, tạo **Topic** (đề tài)
6. Giảng viên chọn **Rubric Template** cho lớp

### Luồng sinh viên

1. Sinh viên **đăng ký** tài khoản, xác thực email
2. Sinh viên **join class** bằng enrollment key
3. Sinh viên tạo/xin vào **Group**
4. Nhóm trưởng chọn **Topic**
5. Nhóm nộp **Presentation** (upload file PDF/slides)
6. Hệ thống gửi sang **AI Analysis**
7. AI trả về **Report** với điểm số và phản hồi theo từng tiêu chí
8. Giảng viên **duyệt/chỉnh sửa** báo cáo
9. Nhóm trưởng **phân phối điểm** cho các thành viên

### Luồng chấm điểm

1. Mỗi **Rubric Template** có nhiều **Criteria** (tiêu chí)
2. Mỗi Criteria có: tên, mô tả, weight (%), maxScore, evaluationGuide
3. AI đánh giá presentation dựa trên rubric
4. **CriterionFeedback** lưu điểm chi tiết từng tiêu chí
5. Điểm tổng = tổng(weight × điểm)
