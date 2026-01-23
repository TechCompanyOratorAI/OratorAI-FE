export const BASE_URL = "https://node-api-service-uc69r.ondigitalocean.app";

// Auth endpoints
export const LOGIN_ENDPOINT = `${BASE_URL}/api/v1/auth/login`;
export const REGISTER_ENDPOINT = `${BASE_URL}/api/v1/auth/register`;
export const REGISTER_INSTRUCTOR_ENDPOINT = `${BASE_URL}/api/v1/auth/register-instructor`;
export const REFRESH_TOKEN_ENDPOINT = `${BASE_URL}/api/v1/auth/refresh-token`;
export const LOGOUT_ENDPOINT = `${BASE_URL}/api/v1/auth/logout`;
export const PROFILE_ENDPOINT = `${BASE_URL}/api/v1/auth/profile`;
export const CHANGE_PASSWORD_ENDPOINT = `${BASE_URL}/api/v1/auth/change-password`;
export const FORGOT_PASSWORD_ENDPOINT = `${BASE_URL}/api/v1/auth/forgot-password`;

// Course endpoints
export const COURSES_ENDPOINT = `${BASE_URL}/api/v1/courses`;
export const MY_COURSES_ENDPOINT = `${BASE_URL}/api/v1/courses/my-courses`;
export const COURSE_DETAIL_ENDPOINT = (courseId: string) => `${BASE_URL}/api/v1/courses/${courseId}`;

// Topic endpoints
export const TOPICS_ENDPOINT = (courseId: string) => `${BASE_URL}/api/v1/courses/${courseId}/topics`;
export const TOPIC_DETAIL_ENDPOINT = (topicId: string) => `${BASE_URL}/api/v1/topics/${topicId}`;


//Admin endpoints
export const GET_ALL_USERS_ENDPOINT = `${BASE_URL}/api/v1/users`;

// Enrollment endpoints
export const ENROLL_COURSE_ENDPOINT = (courseId: string) => `${BASE_URL}/api/v1/enrollments/courses/${courseId}`;
export const GET_ENROLLED_COURSES_ENDPOINT = `${BASE_URL}/api/v1/enrollments/courses`;
export const DROP_COURSE_ENDPOINT = (courseId: string) => `${BASE_URL}/api/v1/enrollments/courses/${courseId}`;
export const ENROLL_TOPIC_ENDPOINT = (topicId: string) => `${BASE_URL}/api/v1/enrollments/topics/${topicId}`;
export const GET_ENROLLED_TOPICS_ENDPOINT = `${BASE_URL}/api/v1/enrollments/topics`;
export const DROP_TOPIC_ENDPOINT = (topicId: string) => `${BASE_URL}/api/v1/enrollments/topics/${topicId}`;