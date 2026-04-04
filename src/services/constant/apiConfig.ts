export const BASE_URL = "https://node-api-service-uc69r.ondigitalocean.app";

// export const BASE_URL = "http://localhost:8080";

// Auth endpoints
export const LOGIN_ENDPOINT = `${BASE_URL}/api/v1/auth/login`;
export const REGISTER_ENDPOINT = `${BASE_URL}/api/v1/auth/register`;
export const REGISTER_INSTRUCTOR_ENDPOINT = `${BASE_URL}/api/v1/auth/register-instructor`;
export const REFRESH_TOKEN_ENDPOINT = `${BASE_URL}/api/v1/auth/refresh-token`;
export const LOGOUT_ENDPOINT = `${BASE_URL}/api/v1/auth/logout`;
export const PROFILE_ENDPOINT = `${BASE_URL}/api/v1/auth/profile`;
export const CHANGE_PASSWORD_ENDPOINT = `${BASE_URL}/api/v1/auth/change-password`;
export const FORGOT_PASSWORD_ENDPOINT = `${BASE_URL}/api/v1/auth/forgot-password`;
export const RESET_PASSWORD_ENDPOINT = `${BASE_URL}/api/v1/auth/reset-password`;
export const RESEND_VERIFICATION_ENDPOINT = `${BASE_URL}/api/v1/auth/resend-verification`;
export const VERIFY_EMAIL_ENDPOINT = (token: string) =>
  `${BASE_URL}/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`;

// Course endpoints
export const COURSES_ENDPOINT = `${BASE_URL}/api/v1/courses`;
export const ADD_INSTRUCTOR_TO_COURSE_ENDPOINT = (courseId: string) =>
  `${BASE_URL}/api/v1/courses/${courseId}/instructors`;
export const REMOVE_INSTRUCTOR_FROM_COURSE_ENDPOINT = (
  courseId: string,
  userId: string,
) => `${BASE_URL}/api/v1/courses/${courseId}/instructors/${userId}`;
export const MY_COURSES_ENDPOINT = `${BASE_URL}/api/v1/courses/my-class`;
export const COURSE_DETAIL_ENDPOINT = (courseId: string) =>
  `${BASE_URL}/api/v1/courses/${courseId}`;

// Topic endpoints (topics are created per class, not per course)
export const CLASS_TOPICS_ENDPOINT = (classId: string) =>
  `${BASE_URL}/api/v1/classes/${classId}/topics`;
export const TOPIC_DETAIL_ENDPOINT = (topicId: string) =>
  `${BASE_URL}/api/v1/topics/${topicId}`;

//Admin endpoints
export const GET_ALL_USERS_ENDPOINT = `${BASE_URL}/api/v1/users`;
// Departments endpoints
export const DEPARTMENTS_ENDPOINT = `${BASE_URL}/api/v1/departments`;
export const CREATE_DEPARTMENT_ENDPOINT = `${BASE_URL}/api/v1/departments`;
export const UPDATE_DEPARTMENT_ENDPOINT = (departmentId: string) =>
  `${BASE_URL}/api/v1/departments/${departmentId}`;
export const DELETE_DEPARTMENT_ENDPOINT = (departmentId: string) =>
  `${BASE_URL}/api/v1/departments/${departmentId}`;

// Classes endpoints
export const CLASSES_ENDPOINT = `${BASE_URL}/api/v1/classes`;
export const CREATE_CLASS_ENDPOINT = (courseId: string) =>
  `${BASE_URL}/api/v1/courses/${courseId}/classes`;
export const GET_CLASSES_BY_COURSE_ENDPOINT = (courseId: string) =>
  `${BASE_URL}/api/v1/courses/${courseId}/classes`;
export const UPDATE_CLASS_ENDPOINT = (classId: string) =>
  `${BASE_URL}/api/v1/classes/${classId}`;
export const DELETE_CLASS_ENDPOINT = (classId: string) =>
  `${BASE_URL}/api/v1/classes/${classId}`;
export const ADD_INSTRUCTOR_TO_CLASS_ENDPOINT = (classId: string) =>
  `${BASE_URL}/api/v1/classes/${classId}/instructors`;
export const REMOVE_INSTRUCTOR_FROM_CLASS_ENDPOINT = (
  classId: string,
  userId: string,
) => `${BASE_URL}/api/v1/classes/${classId}/instructors/${userId}`;
export const CLASS_DETAIL_ENDPOINT = (classId: string) =>
  `${BASE_URL}/api/v1/classes/${classId}`;
//Enroll class endpoints
export const ENROLL_CLASS_BY_KEY_ENDPOINT = `${BASE_URL}/api/v1/enrollments/join`;
//Group endpoints
export const GET_ALL_GROUPS_BY_CLASS_ENDPOINT = (classId: string) =>
  `${BASE_URL}/api/v1/groups/classes/${classId}`;
export const GET_MY_GROUP_BY_CLASS_ENDPOINT = (classId: string) =>
  `${BASE_URL}/api/v1/groups/classes/${classId}/my-group`;
export const GROUP_DETAIL_ENDPOINT = (groupId: string) =>
  `${BASE_URL}/api/v1/groups/${groupId}`;
export const CREATE_GROUP_ENDPOINT = `${BASE_URL}/api/v1/groups`;
export const UPDATE_GROUP_ENDPOINT = (groupId: string) =>
  `${BASE_URL}/api/v1/groups/${groupId}`;
export const DELETE_GROUP_ENDPOINT = (groupId: string) =>
  `${BASE_URL}/api/v1/groups/${groupId}`;
export const JOIN_GROUP_ENDPOINT = (groupId: string) =>
  `${BASE_URL}/api/v1/groups/${groupId}/join`;
export const LEAVE_GROUP_ENDPOINT = (groupId: string) =>
  `${BASE_URL}/api/v1/groups/${groupId}/leave`;
export const REMOVE_MEMBER_FROM_GROUP_ENDPOINT = (
  groupId: string,
  userId: string,
) => `${BASE_URL}/api/v1/groups/${groupId}/members/${userId}/remove`;
export const CHANGE_LEADER_OF_GROUP_ENDPOINT = (
  groupId: string,
  userId: string,
) => `${BASE_URL}/api/v1/groups/${groupId}/members/${userId}/promote`;
/** GET/POST/DELETE — topic the nhóm (leader chọn / hủy) */
export const GROUP_TOPIC_ENDPOINT = (groupId: string) =>
  `${BASE_URL}/api/v1/groups/${groupId}/topic`;

//Rubric endpoints
export const GET_RUBRIC_BY_CLASS_ENDPOINT = (classId: string) =>
  `${BASE_URL}/api/v1/classesRubricCriteria/${classId}/rubric`;
export const CREATE_RUBRIC_BY_CLASS_ENDPOINT = (classId: string) =>
  `${BASE_URL}/api/v1/classesRubricCriteria/${classId}/rubric/criteria`;
export const UPDATE_CLASS_RUBRIC_ENDPOINT = (classRubricCriteriaId: string) =>
  `${BASE_URL}/api/v1/classesRubricCriteria/class-rubric-criteria/${classRubricCriteriaId}`;
export const DELETE_CLASS_RUBRIC_ENDPOINT = (classRubricCriteriaId: string) =>
  `${BASE_URL}/api/v1/classesRubricCriteria/class-rubric-criteria/${classRubricCriteriaId}`;
//Rubric-temple admin endpoints
export const GET_ALL_RUBRIC_TEMPLATES_ENDPOINT = `${BASE_URL}/api/v1/rubric-templates/all`;
export const CREATE_RUBRIC_TEMPLATE_ENDPOINT = `${BASE_URL}/api/v1/rubric-templates`;
export const UPDATE_RUBRIC_TEMPLATE_ENDPOINT = (rubricTemplateId: string) =>
  `${BASE_URL}/api/v1/rubric-templates/${rubricTemplateId}`;
export const DELETE_RUBRIC_TEMPLATE_ENDPOINT = (rubricTemplateId: string) =>
  `${BASE_URL}/api/v1/rubric-templates/${rubricTemplateId}`;
// Create criteria by rubric template
export const CREATE_CRITERIA_BY_RUBRIC_TEMPLATE_ENDPOINT = (
  rubricTemplateId: string,
) => `${BASE_URL}/api/v1/rubric-criteria/${rubricTemplateId}/criteria`;
export const UPDATE_CRITERIA_BY_RUBRIC_TEMPLATE_ENDPOINT = (
  rubricCriteriaId: string,
) => `${BASE_URL}/api/v1/rubric-criteria/${rubricCriteriaId}`;
export const DELETE_CRITERIA_BY_RUBRIC_TEMPLATE_ENDPOINT = (
  rubricCriteriaId: string,
) => `${BASE_URL}/api/v1/rubric-criteria/${rubricCriteriaId}`;

//get class by instructor
export const GET_CLASSES_BY_INSTRUCTOR_ENDPOINT = `${BASE_URL}/api/v1/me/teaching-classes`;

// Temple rubric for instructor
export const GET_RUBRIC_TEMPLATES_FOR_INSTRUCTOR_ENDPOINT = `${BASE_URL}/api/v1/rubric-templates`;
export const PICK_RUBRIC_TEMPLATE_FOR_CLASS_ENDPOINT = (classId: string) =>
  `${BASE_URL}/api/v1/classesAISettings/${classId}/ai-settings`;

export const UPDATE_CLASS_RUBRIC_CRITERIA_ENDPOINT = (
  classRubricCriteriaId: string,
) =>
  `${BASE_URL}/api/v1/classesRubricCriteria/class-rubric-criteria/${classRubricCriteriaId}`;
export const DELETE_CLASS_RUBRIC_CRITERIA_ENDPOINT = (
  classRubricCriteriaId: string,
) =>
  `${BASE_URL}/api/v1/classesRubricCriteria/class-rubric-criteria/${classRubricCriteriaId}`;

// Filter for admin endpoints
export const FILTER_INSTRUCTORS_BY_COURSE_ENDPOINT = (courseId: string) =>
  `${BASE_URL}/api/v1/courses/${courseId}/available-instructors`;
export const FILTER_INSTRUCTORS_BY_CLASS_ENDPOINT = (courseId: string) =>
  `${BASE_URL}/api/v1/courses/${courseId}/instructors`;

// Enrollment (class-level; topic theo nhóm dùng /groups/:id/topic)
// Enrolled Classes endpoints
export const GET_ENROLLED_CLASSES_ENDPOINT = `${BASE_URL}/api/v1/enrollments/me/classes`;

// Presentation endpoints
export const PRESENTATIONS_ENDPOINT = `${BASE_URL}/api/v1/presentations`;
export const PRESENTATIONS_BY_CLASS_TOPIC_ENDPOINT = (
  classId: string,
  topicId: string,
) => `${BASE_URL}/api/v1/presentations?classId=${classId}&topicId=${topicId}`;
export const CREATE_PRESENTATION_ENDPOINT = `${BASE_URL}/api/v1/presentations`;
export const PRESENTATION_DETAIL_ENDPOINT = (presentationId: string) =>
  `${BASE_URL}/api/v1/presentations/${presentationId}`;
export const PRESENTATION_SLIDES_ENDPOINT = (presentationId: string) =>
  `${BASE_URL}/api/v1/presentations/${presentationId}/slides`;
export const PRESENTATION_MEDIA_ENDPOINT = (presentationId: string) =>
  `${BASE_URL}/api/v1/presentations/${presentationId}/media`;
export const PRESENTATION_SUBMIT_ENDPOINT = (presentationId: string) =>
  `${BASE_URL}/api/v1/presentations/${presentationId}/submit`;
export const PRESENTATION_PROGRESS_ENDPOINT = (presentationId: string) =>
  `${BASE_URL}/api/v1/presentations/${presentationId}/progress`;
export const TOPIC_PRESENTATIONS_ENDPOINT = (topicId: string) =>
  `${BASE_URL}/api/v1/topics/
${topicId}/presentations`;

//Report Presentation endpoints
export const REPORT_PRESENTATION_ENDPOINT = (presentationId: string) =>
  `${BASE_URL}/api/v1/ai-reports/presentation/${presentationId}`;
export const CONFIRM_REPORT_ENDPOINT = (reportId: string) =>
  `${BASE_URL}/api/v1/ai-reports/${reportId}/confirm`;

// Share presentation endpoints
export const SHARE_PUBLIC_ENDPOINT = (presentationId: string) =>
  `${BASE_URL}/api/v1/presentations/${presentationId}/share/public`;
export const SHARE_LIST_ENDPOINT = (presentationId: string) =>
  `${BASE_URL}/api/v1/presentations/${presentationId}/share`;
export const SHARE_INVITE_ENDPOINT = (presentationId: string) =>
  `${BASE_URL}/api/v1/presentations/${presentationId}/share/invite`;
export const SHARE_REVOKE_PUBLIC_ENDPOINT = (presentationId: string) =>
  `${BASE_URL}/api/v1/presentations/${presentationId}/share/public`;
export const SHARE_REVOKE_INVITE_ENDPOINT = (
  presentationId: string,
  accessId: string,
) => `${BASE_URL}/api/v1/presentations/${presentationId}/share/invite/${accessId}`;
export const SHARE_VIEW_ENDPOINT = (token: string) =>
  `${BASE_URL}/api/v1/share/${token}`;
