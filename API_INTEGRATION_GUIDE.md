# Course API Integration Guide

## Overview
This document explains the integration of the course API with the ManageCoursesPage component using Redux Toolkit for state management.

## API Endpoints

### Get All Courses
- **Endpoint**: `https://node-api-service-uc69r.ondigitalocean.app/api/v1/courses`
- **Method**: GET
- **Query Parameters**: 
  - `page`: Page number (optional, default: 1)
  - `limit`: Items per page (optional, default: 10)

**Response**:
```json
{
  "data": [
    {
      "courseId": 1,
      "courseCode": "SE101",
      "courseName": "Advanced Software Engineering",
      "description": "Updated description",
      "instructorId": 10,
      "semester": "Fall 2026",
      "academicYear": 2026,
      "startDate": "2026-01-15",
      "endDate": "2026-05-15",
      "isActive": true,
      "createdAt": "2026-01-14T07:14:43.000Z",
      "updatedAt": "2026-01-14T07:21:58.000Z",
      "instructor": {
        "userId": 10,
        "username": "duckneee",
        "firstName": "John",
        "lastName": "Smith",
        "email": "vuduc870@gmail.com"
      },
      "topics": [
        {
          "topicId": 1,
          "topicName": "Advanced Agile & Scrum",
          "sequenceNumber": 2
        }
      ]
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### Get Course Detail
- **Endpoint**: `https://node-api-service-uc69r.ondigitalocean.app/api/v1/courses/{courseId}`
- **Method**: GET
- **Response**: Single course object (same structure as above)

### Create Course
- **Endpoint**: `https://node-api-service-uc69r.ondigitalocean.app/api/v1/courses`
- **Method**: POST
- **Request Body**: Course data (excluding courseId, createdAt, updatedAt)

### Update Course
- **Endpoint**: `https://node-api-service-uc69r.ondigitalocean.app/api/v1/courses/{courseId}`
- **Method**: PUT
- **Request Body**: Updated course data

### Delete Course
- **Endpoint**: `https://node-api-service-uc69r.ondigitalocean.app/api/v1/courses/{courseId}`
- **Method**: DELETE

## Redux State Structure

### Course State
```typescript
{
  courses: CourseData[];        // Array of all courses
  selectedCourse: CourseData | null;  // Currently selected course
  loading: boolean;             // Loading state
  error: string | null;         // Error message if any
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

## Files Modified

### 1. `src/services/features/course/courseSlice.ts` (New)
- Created Redux slice for course management
- Implemented async thunks for CRUD operations:
  - `fetchCourses()` - Get all courses
  - `fetchCourseDetail()` - Get single course
  - `createCourse()` - Create new course
  - `updateCourse()` - Update existing course
  - `deleteCourse()` - Delete course

### 2. `src/services/store/store.ts`
- Added courseReducer to the root reducer
- Integrated course state management with Redux store

### 3. `src/page/Instructor/ManageCoursesPage.tsx`
- Removed hardcoded mock data
- Integrated Redux hooks (`useAppDispatch`, `useAppSelector`)
- Fetches courses from API on component mount
- Maps API data to UI format
- Implemented filtering by status and search functionality
- Added delete course functionality with confirmation dialog
- Added loading and error states

## Usage Examples

### Fetching All Courses
```typescript
import { fetchCourses } from '@/services/features/course/courseSlice';
import { useAppDispatch, useAppSelector } from '@/services/store/store';

const MyComponent = () => {
  const dispatch = useAppDispatch();
  const { courses, loading, error } = useAppSelector(state => state.course);

  useEffect(() => {
    dispatch(fetchCourses({}));
  }, [dispatch]);

  return (
    <>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {courses.map(course => <div key={course.courseId}>{course.courseName}</div>)}
    </>
  );
};
```

### Creating a Course
```typescript
import { createCourse } from '@/services/features/course/courseSlice';

const handleCreate = async (courseData) => {
  dispatch(createCourse(courseData));
};
```

### Updating a Course
```typescript
import { updateCourse } from '@/services/features/course/courseSlice';

const handleUpdate = async (courseId, updatedData) => {
  dispatch(updateCourse({ courseId, data: updatedData }));
};
```

### Deleting a Course
```typescript
import { deleteCourse } from '@/services/features/course/courseSlice';

const handleDelete = async (courseId) => {
  dispatch(deleteCourse(courseId));
};
```

## Features Implemented

✅ Fetch and display courses from API
✅ Filter courses by status (Active/Archived)
✅ Search courses by name or code
✅ Pagination support
✅ Create new course
✅ Update existing course
✅ Delete course with confirmation dialog
✅ Loading and error states
✅ Responsive design maintained
✅ Instructor information display
✅ Course topics display

## Next Steps

To fully utilize this integration:

1. **Edit Course** - Implement edit functionality with a modal/form
2. **Grade/View Class** - Add routes to grading and class view pages
3. **Course Topics** - Implement topic management CRUD
4. **Student Assignment** - Link with assignment API
5. **Error Handling** - Add toast notifications for user feedback
6. **Optimistic Updates** - Implement optimistic UI updates
7. **Caching** - Add request caching to reduce API calls

## Notes

- All API calls use the configured axios instance with automatic token refresh
- Error messages are extracted from API responses or use default messages
- The component transforms API data to the existing UI format to minimize changes
- Delete operations include confirmation dialog to prevent accidental deletion
