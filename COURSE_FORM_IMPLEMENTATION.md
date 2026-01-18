# Course Creation & Update Implementation

## Overview
Full-featured course form modal with create and update capabilities using the API structure provided.

## Files Created

### 1. [src/components/Course/CourseModal.tsx](src/components/Course/CourseModal.tsx) (NEW)
A reusable modal component for creating and editing courses with the following features:

**Form Fields:**
- `courseCode` - Course identifier (e.g., "SE101")
- `courseName` - Full course name
- `description` - Course description (textarea)
- `semester` - Academic semester selector (Fall/Spring/Summer 2026-2027)
- `academicYear` - Academic year number
- `startDate` - Course start date (date input)
- `endDate` - Course end date (date input)

**Features:**
- ✅ Full form validation with error messages
- ✅ Date range validation (end date must be after start date)
- ✅ Form population when editing existing courses
- ✅ Loading state handling
- ✅ Responsive modal design
- ✅ Clear error messaging for each field

## Files Modified

### 2. [src/page/Instructor/ManageCoursesPage.tsx](src/page/Instructor/ManageCoursesPage.tsx)
**Updated with:**
- CourseModal component integration
- Modal state management:
  - `courseModalOpen` - Controls modal visibility
  - `editingCourse` - Stores course being edited (null for create mode)
- New handlers:
  - `handleCourseModalOpen(course?)` - Opens modal (with optional course for edit)
  - `handleCourseModalClose()` - Closes modal and resets states
  - `handleCourseSubmit(courseData)` - Submits form, calls create/update dispatch
- Integrated Redux actions:
  - `createCourse()` - Creates new course
  - `updateCourse()` - Updates existing course
- "Create New Course" button now opens the modal
- Edit button in dropdown menu opens modal with course data
- Modal integrated before delete confirmation dialog

## Form Validation

The form includes the following validations:

```typescript
// Required field validation
- courseCode: Must not be empty
- courseName: Must not be empty
- description: Must not be empty
- semester: Must be selected
- startDate: Must be provided
- endDate: Must be provided

// Date validation
- endDate must be after startDate
```

## API Request Structure

When submitted, the form sends data matching this structure:

```json
{
  "courseCode": "SE101",
  "courseName": "Software Engineering Fundamentals",
  "description": "Introduction to software engineering principles and practices",
  "semester": "Fall 2026",
  "academicYear": 2026,
  "startDate": "2026-01-15",
  "endDate": "2026-05-15"
}
```

## Usage Flow

### Create Course
1. Click "Create New Course" button
2. Modal opens with empty form
3. Fill in all required fields
4. Click "Save Course" to submit
5. Form is validated before submission
6. Course is created and list refreshes

### Edit Course
1. Click "..." (more options) on a course card
2. Select "Edit Course" from dropdown
3. Modal opens with current course data pre-filled
4. Modify fields as needed
5. Click "Save Course" to submit
6. Form is validated before submission
7. Course is updated and list refreshes

### Modal Close
- Click X button in modal header
- Click "Cancel" button
- Modal closes and resets state

## Semester Options

The semester dropdown includes:
- Fall 2026
- Spring 2026
- Summer 2026
- Fall 2027
- Spring 2027
- Summer 2027

(Can be extended as needed)

## Styling Features

- **Loading State**: "Saving..." text and disabled button state during submission
- **Error Messages**: Red text below each field showing validation errors
- **Responsive**: Full modal width on mobile, constrained to 640px on larger screens
- **Accessible**: Proper labels, ARIA attributes, keyboard navigation support
- **Smooth Transitions**: Opacity and visibility transitions on modal appearance

## Integration with Redux

The form works seamlessly with the course Redux slice:

```typescript
// Create flow
dispatch(createCourse(formData))
  → API POST request
  → Course added to state.course.courses

// Update flow
dispatch(updateCourse({ courseId, data: formData }))
  → API PUT request
  → Course updated in state.course.courses
```

## Error Handling

- Form validation errors show inline below each field
- API errors are handled by Redux (stored in state.course.error)
- Loading state prevents multiple submissions
- Invalid dates prevent form submission

## Future Enhancements

- Add instructor selection field
- Add topics/units assignment
- Add course image/banner upload
- Add course prerequisites field
- Add course capacity field
- Add department/program selection
- Add approval workflow
- Add duplicate course functionality
- Add bulk operations (import from CSV)
